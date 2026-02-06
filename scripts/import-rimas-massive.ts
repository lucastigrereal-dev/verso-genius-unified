/**
 * IMPORTAÇÃO MASSIVA DE RIMAS PARA SUPABASE
 *
 * Script otimizado para importar 100,000+ rimas
 * Com batch processing, deduplicação e error handling
 *
 * COMO USAR:
 * 1. Preparar arquivo JSON: data/rimas-input.json
 * 2. Configurar .env (SUPABASE_URL, SUPABASE_SERVICE_KEY)
 * 3. Executar: tsx scripts/import-rimas-massive.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import 'dotenv/config'

// ========================================
// CONFIGURAÇÃO
// ========================================

const CONFIG = {
  BATCH_SIZE: 500, // Rimas por batch (Supabase recomenda 500-1000)
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
  ENABLE_DEDUPLICATION: true,
  LOG_FILE: 'import-log.json',
  CHECKPOINT_FILE: 'import-checkpoint.json'
}

// ========================================
// TIPOS & INTERFACES
// ========================================

interface RimaInput {
  // Campos obrigatórios
  verso: string
  tema: string
  dificuldade: 'easy' | 'medium' | 'hard'

  // Campos opcionais
  familia_rima?: string
  citacao_real?: string
  mc_source?: string
  musica_source?: string
  ranking?: number
  is_featured?: boolean
}

interface RimaSupabase {
  verso: string
  tema: string
  familia_rima: string | null
  dificuldade: 'easy' | 'medium' | 'hard'
  citacao_real: string | null
  mc_source: string | null
  musica_source: string | null
  ranking: number
  is_featured: boolean
  views_count: number
  likes_count: number
}

interface ImportStats {
  total_input: number
  total_processed: number
  total_success: number
  total_failed: number
  total_duplicates: number
  started_at: string
  finished_at?: string
  errors: Array<{
    batch: number
    error: string
    count: number
  }>
}

// ========================================
// VALIDAÇÃO DE SCHEMA
// ========================================

function validateRima(rima: any, index: number): RimaInput | null {
  const errors: string[] = []

  // Validar campos obrigatórios
  if (!rima.verso || typeof rima.verso !== 'string') {
    errors.push(`[${index}] Campo 'verso' obrigatório e deve ser string`)
  }

  if (!rima.tema || typeof rima.tema !== 'string') {
    errors.push(`[${index}] Campo 'tema' obrigatório e deve ser string`)
  }

  if (!rima.dificuldade || !['easy', 'medium', 'hard'].includes(rima.dificuldade)) {
    errors.push(`[${index}] Campo 'dificuldade' deve ser 'easy', 'medium' ou 'hard'`)
  }

  // Validar tamanhos
  if (rima.verso && rima.verso.length > 5000) {
    errors.push(`[${index}] Campo 'verso' muito longo (max 5000 caracteres)`)
  }

  if (rima.tema && rima.tema.length > 100) {
    errors.push(`[${index}] Campo 'tema' muito longo (max 100 caracteres)`)
  }

  if (errors.length > 0) {
    console.error('❌ Erros de validação:', errors.join('\n'))
    return null
  }

  return {
    verso: rima.verso.trim(),
    tema: rima.tema.toLowerCase().trim(),
    dificuldade: rima.dificuldade,
    familia_rima: rima.familia_rima?.trim() || null,
    citacao_real: rima.citacao_real?.trim() || null,
    mc_source: rima.mc_source?.trim() || null,
    musica_source: rima.musica_source?.trim() || null,
    ranking: typeof rima.ranking === 'number' ? rima.ranking : 0,
    is_featured: rima.is_featured === true
  }
}

// ========================================
// TRANSFORMAÇÃO PARA SUPABASE
// ========================================

function transformToSupabase(rima: RimaInput): RimaSupabase {
  return {
    verso: rima.verso,
    tema: rima.tema,
    familia_rima: rima.familia_rima || null,
    dificuldade: rima.dificuldade,
    citacao_real: rima.citacao_real || null,
    mc_source: rima.mc_source || null,
    musica_source: rima.musica_source || null,
    ranking: rima.ranking || 0,
    is_featured: rima.is_featured || false,
    views_count: 0,
    likes_count: 0
  }
}

// ========================================
// DEDUPLICAÇÃO
// ========================================

async function getExistingVersos(
  supabase: any
): Promise<Set<string>> {
  console.log('🔍 Carregando versos existentes para deduplicação...')

  const existingVersos = new Set<string>()
  let offset = 0
  const limit = 1000

  while (true) {
    const { data, error } = await supabase
      .from('rimas_banco')
      .select('verso')
      .range(offset, offset + limit - 1)

    if (error) {
      console.warn('⚠️  Erro ao carregar versos existentes:', error.message)
      break
    }

    if (!data || data.length === 0) break

    data.forEach((row: any) => {
      existingVersos.add(row.verso.trim())
    })

    offset += limit

    if (data.length < limit) break
  }

  console.log(`✅ Carregados ${existingVersos.size} versos existentes`)
  return existingVersos
}

// ========================================
// CHECKPOINT SYSTEM
// ========================================

interface Checkpoint {
  last_batch: number
  processed: number
  timestamp: string
}

function loadCheckpoint(): Checkpoint | null {
  if (!existsSync(CONFIG.CHECKPOINT_FILE)) {
    return null
  }

  try {
    const data = readFileSync(CONFIG.CHECKPOINT_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

function saveCheckpoint(batch: number, processed: number) {
  const checkpoint: Checkpoint = {
    last_batch: batch,
    processed,
    timestamp: new Date().toISOString()
  }

  writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2))
}

// ========================================
// BATCH IMPORT COM RETRY
// ========================================

async function importBatch(
  supabase: any,
  batch: RimaSupabase[],
  batchNumber: number,
  retries = 0
): Promise<{ success: number; failed: number }> {
  try {
    const { data, error } = await supabase
      .from('rimas_banco')
      .insert(batch)
      .select('id')

    if (error) {
      throw new Error(error.message)
    }

    return { success: data?.length || 0, failed: 0 }
  } catch (error: any) {
    if (retries < CONFIG.MAX_RETRIES) {
      console.warn(
        `⚠️  Batch ${batchNumber} falhou, tentando novamente (${retries + 1}/${CONFIG.MAX_RETRIES})...`
      )
      await new Promise((resolve) => setTimeout(resolve, CONFIG.RETRY_DELAY_MS))
      return importBatch(supabase, batch, batchNumber, retries + 1)
    }

    console.error(`❌ Batch ${batchNumber} falhou após ${CONFIG.MAX_RETRIES} tentativas:`, error.message)
    return { success: 0, failed: batch.length }
  }
}

// ========================================
// PROGRESS BAR
// ========================================

function showProgress(current: number, total: number, startTime: number) {
  const percentage = ((current / total) * 100).toFixed(1)
  const elapsed = Date.now() - startTime
  const rate = current / (elapsed / 1000)
  const remaining = (total - current) / rate

  const bar = '█'.repeat(Math.floor(current / total * 40))
  const empty = '░'.repeat(40 - bar.length)

  const remainingMin = Math.floor(remaining / 60)
  const remainingSec = Math.floor(remaining % 60)

  process.stdout.write(
    `\r🚀 [${bar}${empty}] ${percentage}% (${current}/${total}) | ` +
    `${rate.toFixed(1)} rimas/s | ` +
    `Resta: ${remainingMin}m ${remainingSec}s`
  )
}

// ========================================
// MAIN IMPORT FUNCTION
// ========================================

async function importRimas() {
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║   IMPORTAÇÃO MASSIVA DE RIMAS PARA SUPABASE           ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // Inicializar Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || ''
  )

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ ERRO: Variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY não configuradas!')
    console.error('Configure no arquivo .env')
    process.exit(1)
  }

  // Carregar arquivo de entrada
  const inputFile = join(process.cwd(), 'data', 'rimas-input.json')

  if (!existsSync(inputFile)) {
    console.error(`❌ ERRO: Arquivo não encontrado: ${inputFile}`)
    console.error('\nCrie o arquivo data/rimas-input.json com suas rimas.')
    console.error('Formato esperado: ver exemplo em data/rimas-input-example.json')
    process.exit(1)
  }

  console.log(`📂 Carregando rimas de: ${inputFile}`)

  let rimasInput: any[]
  try {
    const fileContent = readFileSync(inputFile, 'utf-8')
    rimasInput = JSON.parse(fileContent)

    if (!Array.isArray(rimasInput)) {
      throw new Error('Arquivo deve conter um array de objetos')
    }
  } catch (error: any) {
    console.error('❌ ERRO ao ler arquivo JSON:', error.message)
    process.exit(1)
  }

  console.log(`✅ Carregadas ${rimasInput.length.toLocaleString()} rimas do arquivo\n`)

  // Estatísticas
  const stats: ImportStats = {
    total_input: rimasInput.length,
    total_processed: 0,
    total_success: 0,
    total_failed: 0,
    total_duplicates: 0,
    started_at: new Date().toISOString(),
    errors: []
  }

  const startTime = Date.now()

  // Verificar checkpoint
  const checkpoint = loadCheckpoint()
  let startBatch = 0

  if (checkpoint) {
    console.log(`📌 Checkpoint encontrado! Continuando do batch ${checkpoint.last_batch + 1}`)
    startBatch = checkpoint.last_batch + 1
    stats.total_processed = checkpoint.processed
  }

  // Carregar versos existentes (deduplicação)
  let existingVersos = new Set<string>()
  if (CONFIG.ENABLE_DEDUPLICATION) {
    existingVersos = await getExistingVersos(supabase)
  }

  // Validar e transformar rimas
  console.log('\n🔍 Validando rimas...')
  const validRimas: RimaSupabase[] = []

  for (let i = 0; i < rimasInput.length; i++) {
    const validated = validateRima(rimasInput[i], i)

    if (!validated) {
      stats.total_failed++
      continue
    }

    // Deduplicar
    if (CONFIG.ENABLE_DEDUPLICATION && existingVersos.has(validated.verso)) {
      stats.total_duplicates++
      continue
    }

    validRimas.push(transformToSupabase(validated))
  }

  console.log(`✅ Validação concluída:`)
  console.log(`   - Válidas: ${validRimas.length.toLocaleString()}`)
  console.log(`   - Duplicadas: ${stats.total_duplicates.toLocaleString()}`)
  console.log(`   - Inválidas: ${stats.total_failed.toLocaleString()}\n`)

  if (validRimas.length === 0) {
    console.log('⚠️  Nenhuma rima válida para importar!')
    process.exit(0)
  }

  // Importar em batches
  console.log(`🚀 Iniciando importação em batches de ${CONFIG.BATCH_SIZE}...\n`)

  const totalBatches = Math.ceil(validRimas.length / CONFIG.BATCH_SIZE)
  const skipRimas = startBatch * CONFIG.BATCH_SIZE

  for (let i = startBatch; i < totalBatches; i++) {
    const start = i * CONFIG.BATCH_SIZE
    const end = Math.min(start + CONFIG.BATCH_SIZE, validRimas.length)
    const batch = validRimas.slice(start, end)

    const result = await importBatch(supabase, batch, i)

    stats.total_success += result.success
    stats.total_failed += result.failed
    stats.total_processed = end

    if (result.failed > 0) {
      stats.errors.push({
        batch: i,
        error: 'Falha ao inserir batch',
        count: result.failed
      })
    }

    // Salvar checkpoint a cada 10 batches
    if (i % 10 === 0) {
      saveCheckpoint(i, stats.total_processed)
    }

    // Progress bar
    showProgress(stats.total_processed, validRimas.length, startTime)
  }

  // Finalizar
  console.log('\n\n✅ IMPORTAÇÃO CONCLUÍDA!\n')

  stats.finished_at = new Date().toISOString()

  const elapsed = Date.now() - startTime
  const elapsedMin = Math.floor(elapsed / 60000)
  const elapsedSec = Math.floor((elapsed % 60000) / 1000)

  console.log('📊 ESTATÍSTICAS FINAIS:')
  console.log(`   ✅ Importadas com sucesso: ${stats.total_success.toLocaleString()}`)
  console.log(`   ❌ Falharam: ${stats.total_failed.toLocaleString()}`)
  console.log(`   🔄 Duplicadas (ignoradas): ${stats.total_duplicates.toLocaleString()}`)
  console.log(`   ⏱️  Tempo total: ${elapsedMin}m ${elapsedSec}s`)
  console.log(`   ⚡ Taxa média: ${(stats.total_success / (elapsed / 1000)).toFixed(1)} rimas/segundo\n`)

  // Salvar log
  const logFile = join(process.cwd(), CONFIG.LOG_FILE)
  writeFileSync(logFile, JSON.stringify(stats, null, 2))
  console.log(`📝 Log salvo em: ${logFile}\n`)

  // Limpar checkpoint
  if (existsSync(CONFIG.CHECKPOINT_FILE)) {
    writeFileSync(CONFIG.CHECKPOINT_FILE, '')
  }

  // Mostrar erros se houver
  if (stats.errors.length > 0) {
    console.log('⚠️  ERROS ENCONTRADOS:')
    stats.errors.forEach((err) => {
      console.log(`   Batch ${err.batch}: ${err.error} (${err.count} rimas)`)
    })
  }

  console.log('🎉 Processo finalizado!\n')
}

// ========================================
// EXECUTAR
// ========================================

importRimas().catch((error) => {
  console.error('\n❌ ERRO FATAL:', error)
  process.exit(1)
})
