import OpenAI from 'openai'
import { getDB, type Rima, type Letra } from './database'

// Ollama config
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral:latest'

// Ollama API call
async function callOllama(prompt: string): Promise<string | null> {
  try {
    const response = await fetch(OLLAMA_URL + '/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: { temperature: 0.8, num_predict: 500 }
      })
    })

    if (!response.ok) {
      console.error('[OLLAMA] HTTP error:', response.status)
      return null
    }

    const data = await response.json()
    return data.response || null
  } catch (error: any) {
    console.error('[OLLAMA] Error:', error.message)
    return null
  }
}

// Check Ollama availability
export async function checkOllama(): Promise<{ ok: boolean; model?: string; error?: string }> {
  try {
    const response = await fetch(OLLAMA_URL + '/api/tags')
    if (!response.ok) return { ok: false, error: 'Ollama not responding' }
    const data = await response.json()
    const hasModel = data.models?.some(m => m.name === OLLAMA_MODEL)
    return { ok: hasModel, model: OLLAMA_MODEL, error: hasModel ? undefined : 'Model not found' }
  } catch (error: any) {
    return { ok: false, error: error.message }
  }
}


// Types
export interface GerarParams {
  tema: string
  estilo: 'agressivo' | 'tecnico' | 'filosofico' | 'romantico'
  palavras_chave?: string[]
  num_versos?: 4 | 8 | 16
  usar_referencia?: boolean
}

export interface GerarResult {
  id?: number
  tema: string
  estilo: string
  conteudo: string
  versos: string[]
  score: number
  rimas_usadas: { palavra1: string; palavra2: string }[]
  referencias: { titulo: string; artista: string }[]
  tokens_usados: number
  custo_estimado: number
  fonte: 'gpt-4o-mini' | 'ollama' | 'fallback'
  created_at?: string
}

// OpenAI Client
let openaiClient: OpenAI | null = null

export function getOpenAI(): OpenAI | null {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

// Buscar rimas relevantes do banco
function buscarRimasContexto(tema: string, estilo: string, limit = 30): Rima[] {
  const db = getDB()

  // Buscar rimas de alta qualidade
  const rimas = db.getRimas({ limit: limit * 2 })

  // Priorizar rimas perfeitas e consoantes
  const rimasOrdenadas = rimas
    .filter(r => r.tipo === 'perfeita' || r.tipo === 'consoante')
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return rimasOrdenadas
}

// Buscar letras de referência
function buscarLetrasReferencia(tema: string, estilo: string, limit = 3): Letra[] {
  const db = getDB()

  // Buscar por tema ou estilo
  let letras = db.searchLetras(tema)

  if (letras.length < limit) {
    // Se não encontrou pelo tema, buscar por estilo
    const letrasPorEstilo = db.getLetras({ estilo, limit: 10 })
    letras = [...letras, ...letrasPorEstilo].slice(0, limit)
  }

  return letras.slice(0, limit)
}

// Extrair versos de exemplo das letras
function extrairVersosExemplo(letras: Letra[], maxVersos = 8): string[] {
  const versos: string[] = []

  for (const letra of letras) {
    const linhas = letra.letra
      .split('\n')
      .filter(l => l.trim().length > 10 && l.trim().length < 100)
      .filter(l => !l.startsWith('[') && !l.includes('Lyrics'))
      .slice(0, 4)

    versos.push(...linhas)

    if (versos.length >= maxVersos) break
  }

  return versos.slice(0, maxVersos)
}

// Construir prompt otimizado
function buildPrompt(params: GerarParams, rimas: Rima[], letras: Letra[]): string {
  const numVersos = params.num_versos || 8
  const versosExemplo = extrairVersosExemplo(letras)

  const estiloDescricao: Record<string, string> = {
    agressivo: 'agressivo de batalha, com punchlines pesadas e provocativas, tom de superioridade',
    tecnico: 'tecnico com flow complexo, rimas internas, multissilabicas e wordplays elaborados',
    filosofico: 'reflexivo e profundo, com metaforas sobre vida, sociedade e existencia',
    romantico: 'emotivo sobre amor, relacionamentos, com sensibilidade e poesia urbana'
  }

  return `Voce e um MC brasileiro experiente em batalhas de rima e rap nacional.

MISSAO: Criar ${numVersos} versos de rap sobre "${params.tema}" no estilo ${estiloDescricao[params.estilo] || estiloDescricao.agressivo}.

RIMAS DISPONIVEIS (use como inspiracao para as terminacoes):
${rimas.slice(0, 15).map(r => `• ${r.palavra1} / ${r.palavra2}`).join('\n')}

${versosExemplo.length > 0 ? `EXEMPLOS DE VERSOS REAIS (capture o flow):
${versosExemplo.map(v => `> ${v}`).join('\n')}` : ''}

${params.palavras_chave?.length ? `PALAVRAS-CHAVE PARA INCLUIR: ${params.palavras_chave.join(', ')}` : ''}

REGRAS OBRIGATORIAS:
1. Escreva em portugues brasileiro coloquial (girias da quebrada sao bem-vindas)
2. Cada par de versos DEVE rimar (AABB ou ABAB)
3. Mantenha metrica consistente (8-12 silabas por verso)
4. Rimas devem ser no minimo consoantes (ultimas 2 letras iguais)
5. Evite cliches como "coracao/paixao", "amor/dor" isolados
6. Inclua pelo menos uma punchline marcante
7. O flow deve ser natural para ser cantado/falado

RESPONDA APENAS COM OS ${numVersos} VERSOS, um por linha, sem numeracao ou explicacoes:`
}

// Calcular score da rima gerada
function calcularScore(versos: string[]): number {
  let score = 7.0 // Base

  // Verificar rimas entre versos consecutivos
  for (let i = 0; i < versos.length - 1; i += 2) {
    const v1 = versos[i]?.trim() || ''
    const v2 = versos[i + 1]?.trim() || ''

    if (!v1 || !v2) continue

    const palavras1 = v1.split(' ')
    const palavras2 = v2.split(' ')
    const ultima1 = palavras1[palavras1.length - 1]?.toLowerCase().replace(/[.,!?]/g, '') || ''
    const ultima2 = palavras2[palavras2.length - 1]?.toLowerCase().replace(/[.,!?]/g, '') || ''

    // Rima perfeita (+0.5)
    if (ultima1.slice(-3) === ultima2.slice(-3) && ultima1.length >= 3 && ultima2.length >= 3) {
      score += 0.5
    }
    // Rima consoante (+0.3)
    else if (ultima1.slice(-2) === ultima2.slice(-2) && ultima1.length >= 2 && ultima2.length >= 2) {
      score += 0.3
    }
  }

  // Bonus por quantidade de versos
  if (versos.length >= 8) score += 0.3
  if (versos.length >= 16) score += 0.2

  // Penalidade por versos muito curtos ou longos
  const avgLength = versos.reduce((sum, v) => sum + v.length, 0) / versos.length
  if (avgLength < 30 || avgLength > 80) score -= 0.3

  return Math.min(10, Math.max(5, score))
}

// Extrair rimas usadas nos versos
function extrairRimasUsadas(versos: string[]): { palavra1: string; palavra2: string }[] {
  const rimas: { palavra1: string; palavra2: string }[] = []

  for (let i = 0; i < versos.length - 1; i += 2) {
    const v1 = versos[i]?.trim() || ''
    const v2 = versos[i + 1]?.trim() || ''

    if (!v1 || !v2) continue

    const palavras1 = v1.split(' ')
    const palavras2 = v2.split(' ')
    const ultima1 = palavras1[palavras1.length - 1]?.replace(/[.,!?]/g, '') || ''
    const ultima2 = palavras2[palavras2.length - 1]?.replace(/[.,!?]/g, '') || ''

    if (ultima1 && ultima2) {
      rimas.push({ palavra1: ultima1, palavra2: ultima2 })
    }
  }

  return rimas
}

// Templates de fallback
const FALLBACK_TEMPLATES: Record<string, (tema: string) => string[]> = {
  agressivo: (tema) => [
    `No ${tema} eu sou rei, minha palavra e lei`,
    `Enquanto voce dorme, eu to no corre fiel`,
    `Meu verso e pesado, flow calibrado`,
    `Na batalha da vida, eu sou o mais cotado`,
    `Nao vim pra brincadeira, vim pra dominar`,
    `Cada rima que eu solto faz o chao tremer`,
    `Sou tipo tsunami, ninguem vai me parar`,
    `No mic eu sou o cara que voce quer ser`,
  ],
  tecnico: (tema) => [
    `${tema} na mente, rima exponencial`,
    `Cada silaba que eu solto e fundamental`,
    `Flow sincopado, metrica de mestre`,
    `Meu vocabulario e tipo uma orquestre`,
    `Rimo de tras pra frente, inverto o sentido`,
    `Multissilabico, nunca fui vencido`,
    `Tecnica apurada desde o berco`,
    `No game do rap eu nunca me perco`,
  ],
  filosofico: (tema) => [
    `${tema} me ensina o que a escola esqueceu`,
    `Cada cicatriz conta o que a vida me deu`,
    `No espelho da quebrada eu encontro a verdade`,
    `Poesia de rua, reflexo da cidade`,
    `Penso logo existo no concreto cinza`,
    `Minha filosofia nao precisa de pinca`,
    `Sabedoria de quem viveu na pele`,
    `O que os livros nao contam, o rap revela ele`,
  ],
  romantico: (tema) => [
    `${tema} no coracao, sentimento real`,
    `Teu sorriso ilumina meu corre marginal`,
    `Na selva de pedra tu e minha flor`,
    `Amor de quebrada, o mais puro amor`,
    `Escrevo teu nome em cada verso meu`,
    `Tu e a razao de tudo que eu vivi e viveu`,
    `Mesmo na correria tu e minha paz`,
    `Amor verdadeiro e tudo que me satisfaz`,
  ],
}

// Funcao principal de geracao
export async function gerarRima(params: GerarParams): Promise<GerarResult> {
  const db = getDB()
  const openai = getOpenAI()

  // Buscar contexto do banco
  const rimas = buscarRimasContexto(params.tema, params.estilo)
  const letras = params.usar_referencia !== false
    ? buscarLetrasReferencia(params.tema, params.estilo)
    : []

  let versos: string[] = []
  let tokensUsados = 0
  let fonte: 'gpt-4o-mini' | 'ollama' | 'fallback' = 'fallback'
  const prompt = buildPrompt(params, rimas, letras)

  // 1. Tentar Ollama primeiro (local, gratuito)
  try {
    console.log('[OLLAMA] Tentando gerar com', OLLAMA_MODEL)
    const ollamaResponse = await callOllama(prompt)
    if (ollamaResponse) {
      versos = ollamaResponse.split('\n').map(v => v.trim()).filter(v => v.length > 5 && !v.startsWith('#') && !v.match(/^\d+\./) && !v.includes('```'))
      if (versos.length >= 4) {
        fonte = 'ollama'
        console.log('[OLLAMA] Gerado', versos.length, 'versos')
      }
    }
  } catch (error: any) {
    console.error('[OLLAMA] Erro:', error.message)
  }

  // 2. Tentar GPT-4o-mini se Ollama falhou
  if (versos.length < 4 && openai) {
    try {
      console.log('[GPT] Tentando gerar com gpt-4o-mini')
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Voce e um MC brasileiro especialista em batalhas de rima. Responda APENAS com os versos solicitados, sem explicacoes ou formatacao extra.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.8,
      })
      const content = response.choices[0]?.message?.content || ''
      versos = content.split('\n').map(v => v.trim()).filter(v => v.length > 5 && !v.startsWith('#') && !v.match(/^\d+\./))
      tokensUsados = response.usage?.total_tokens || 0
      fonte = 'gpt-4o-mini'
      console.log('[GPT] Gerado', versos.length, 'versos,', tokensUsados, 'tokens')
    } catch (error: any) {
      console.error('[GPT] Erro:', error.message)
    }
  }

  // 3. Fallback se ambos falharam
  if (versos.length < 4) {
    console.log('[FALLBACK] Usando templates')
    const template = FALLBACK_TEMPLATES[params.estilo] || FALLBACK_TEMPLATES.agressivo
    versos = template(params.tema).slice(0, params.num_versos || 8)
    fonte = 'fallback'
  }


  // Calcular metricas
  const score = calcularScore(versos)
  const rimasUsadas = extrairRimasUsadas(versos)

  // Custo estimado (GPT-4o-mini: $0.15/1M input, $0.60/1M output)
  const custoEstimado = tokensUsados > 0
    ? (tokensUsados * 0.0000003) // media input/output
    : 0

  // Resultado
  const result: GerarResult = {
    tema: params.tema,
    estilo: params.estilo,
    conteudo: versos.join('\n'),
    versos,
    score,
    rimas_usadas: rimasUsadas,
    referencias: letras.map(l => ({
      titulo: l.titulo,
      artista: l.artista_nome || 'Desconhecido'
    })),
    tokens_usados: tokensUsados,
    custo_estimado: custoEstimado,
    fonte,
  }

  // Salvar no banco
  const id = db.saveRimaGerada({
    tema: result.tema,
    estilo: result.estilo,
    conteudo: result.conteudo,
    score: result.score,
  })

  result.id = id

  return result
}

// Health check da API
export async function checkOpenAI(): Promise<{ ok: boolean; error?: string }> {
  const openai = getOpenAI()

  if (!openai) {
    return { ok: false, error: 'OPENAI_API_KEY nao configurada' }
  }

  try {
    await openai.models.list()
    return { ok: true }
  } catch (error: any) {
    return { ok: false, error: error.message }
  }
}
