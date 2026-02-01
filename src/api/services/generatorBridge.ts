/**
 * GeneratorBridge - Ponte entre night-crawler e Supabase
 *
 * Este serviço integra o sistema híbrido de geração de rimas (night-crawler)
 * com o banco de dados Supabase, salvando resultados e métricas.
 */

import { supabase } from '../../../config/supabase'
import { setCache, getCache } from '../../../config/redis'

// TODO: Importar quando night-crawler estiver disponível
// import { RhymeGenerator } from '../../../night-crawler/src/generator/rhyme-generator'
// import type { InputGeracao, ResultadoGeracao } from '../../../night-crawler/src/generator/types'

// Tipos temporários (substituir pelos tipos do night-crawler)
interface InputGeracao {
  tema: string
  estilo: 'agressivo' | 'tecnico' | 'filosofico' | 'romantico'
  contexto?: string
}

interface ResultadoGeracao {
  versos: string[]
  versosFormatados: string[]
  paresRima: Array<{ palavra1: string; palavra2: string }>
  score: number
  tentativas: number
  aprovado: boolean
  custo?: {
    tokens_usados: number
    custo_reais: number
  }
}

export class GeneratorBridge {
  // private nightCrawler: RhymeGenerator
  private initialized = false

  constructor() {
    // TODO: Inicializar night-crawler quando disponível
    // this.nightCrawler = new RhymeGenerator({
    //   useOpenAI: !!process.env.OPENAI_API_KEY,
    //   useOllama: true,
    //   useFTS5: true
    // })
  }

  /**
   * Inicializa o gerador (sync FTS5, etc.)
   */
  async initialize() {
    if (this.initialized) return

    console.log('🔧 Initializing GeneratorBridge...')

    // TODO: Sincronizar FTS5 com Supabase
    // await this.syncFTS5()

    this.initialized = true
    console.log('✅ GeneratorBridge ready')
  }

  /**
   * Gera rima usando night-crawler + cache Redis + save Supabase
   */
  async generateRhyme(input: InputGeracao, userId?: string): Promise<ResultadoGeracao> {
    await this.initialize()

    // 1. Check cache Redis
    const cacheKey = `rhyme:${input.tema}:${input.estilo}`
    const cached = await getCache<ResultadoGeracao>(cacheKey)

    if (cached) {
      console.log('✅ Cache hit for rhyme generation')
      return cached
    }

    // 2. Gerar com night-crawler
    console.log('🎵 Generating rhyme with night-crawler...', input)

    // TODO: Substituir pelo gerador real
    // const result = await this.nightCrawler.gerar(input)

    // Fallback temporário (remover quando night-crawler estiver integrado)
    const result: ResultadoGeracao = {
      versos: [
        `Rima sobre ${input.tema} no estilo ${input.estilo}`,
        'Gerador será integrado em breve',
        'Night-crawler em desenvolvimento',
        'Aguarde a próxima atualização'
      ],
      versosFormatados: [
        `Rima sobre ${input.tema} no estilo ${input.estilo}`,
        'Gerador será integrado em breve'
      ],
      paresRima: [{ palavra1: 'tema', palavra2: 'sistema' }],
      score: 7.5,
      tentativas: 1,
      aprovado: true,
      custo: {
        tokens_usados: 0,
        custo_reais: 0
      }
    }

    // 3. Salvar no Supabase para analytics
    try {
      await supabase.from('rimas_banco').insert({
        verso: result.versosFormatados.join('\n'),
        tema: input.tema,
        familia_rima: result.paresRima[0]?.palavra2 || '',
        dificuldade: 'medium',
        ranking: Math.round(result.score * 10)
      })

      // Se userId fornecido, registrar histórico
      if (userId) {
        // TODO: Criar tabela de histórico de gerações
        console.log(`📝 Saved generation for user ${userId}`)
      }
    } catch (err: any) {
      console.error('❌ Failed to save rhyme to Supabase:', err.message)
      // Não falha a geração se o save falhar
    }

    // 4. Cache result (1 hora)
    await setCache(cacheKey, result, 3600)

    return result
  }

  /**
   * Sincroniza FTS5 database com rimas do Supabase
   * Executa periodicamente para manter o night-crawler atualizado
   */
  private async syncFTS5() {
    console.log('🔄 Syncing FTS5 with Supabase...')

    try {
      // Busca últimas 5000 rimas do Supabase
      const { data: rimas, error } = await supabase
        .from('rimas_banco')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5000)

      if (error) {
        throw error
      }

      console.log(`📊 Found ${rimas?.length || 0} rimas in Supabase`)

      // TODO: Inserir no FTS5 database do night-crawler
      // for (const rima of rimas || []) {
      //   this.nightCrawler.addToFTS5({
      //     verse: rima.verso,
      //     theme: rima.tema,
      //     artist: rima.mc_source,
      //     song: rima.musica_source
      //   })
      // }

      console.log('✅ FTS5 sync complete')
    } catch (err: any) {
      console.error('❌ FTS5 sync failed:', err.message)
    }
  }

  /**
   * Busca rimas similares no banco (para contexto do gerador)
   */
  async findSimilarRhymes(tema: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('rimas_banco')
      .select('verso, familia_rima, ranking')
      .eq('tema', tema)
      .order('ranking', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error finding similar rhymes:', error)
      return []
    }

    return data || []
  }

  /**
   * Estatísticas de geração
   */
  async getGenerationStats() {
    const { data, error } = await supabase
      .from('rimas_banco')
      .select('tema, COUNT(*) as count', { count: 'exact' })

    if (error) {
      console.error('Error getting stats:', error)
      return null
    }

    return data
  }
}

// Singleton instance
export const generatorBridge = new GeneratorBridge()

export default generatorBridge
