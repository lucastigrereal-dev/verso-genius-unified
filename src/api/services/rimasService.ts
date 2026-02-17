/**
 * Rimas Service - Gerencia busca e acesso a rimas no Supabase
 *
 * Fornece métodos para:
 * - Busca por tema, categoria e query full-text
 * - Paginação de resultados
 * - Cache em Redis para buscas frequentes
 */

import { supabase } from '../../../config/supabase'
import { setCache, getCache } from '../../../config/redis'

export interface SearchRimasParams {
  query?: string
  tema?: string
  categoria?: string
  limit?: number
  offset?: number
}

export interface RimaResult {
  id: string
  verso1: string
  verso2: string
  tema: string
  categoria: string
  created_at: string
}

export interface SearchResponse {
  success: boolean
  data: RimaResult[]
  total: number
  page?: number
  pageSize?: number
}

export class RimasService {
  /**
   * Busca rimas com filtros e paginação
   */
  static async searchRimas(params: SearchRimasParams): Promise<SearchResponse> {
    const limit = Math.min(params.limit || 20, 100) // Max 100
    const offset = Math.max(params.offset || 0, 0)

    // Gerar chave de cache
    const cacheKey = `rimas:search:${JSON.stringify(params)}`
    const cached = await getCache<SearchResponse>(cacheKey)

    if (cached) {
      console.log('✅ Cache hit for rimas search')
      return cached
    }

    try {
      // Construir query
      let query = supabase
        .from('rimas_versos')
        .select('id, verso1, verso2, tema, categoria, created_at', { count: 'exact' })

      // Filtro por tema
      if (params.tema && params.tema.trim()) {
        query = query.ilike('tema', `%${params.tema}%`)
      }

      // Filtro por categoria
      if (params.categoria && params.categoria.trim()) {
        query = query.ilike('categoria', `%${params.categoria}%`)
      }

      // Busca full-text (verso1 ou verso2)
      if (params.query && params.query.trim()) {
        query = query.or(
          `verso1.ilike.%${params.query}%,verso2.ilike.%${params.query}%`
        )
      }

      // Aplicar paginação e ordenação
      query = query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) {
        console.error('❌ Supabase error:', error)
        return {
          success: false,
          data: [],
          total: 0
        }
      }

      const response: SearchResponse = {
        success: true,
        data: data || [],
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit
      }

      // Cachear resultado por 5 minutos
      await setCache(cacheKey, response, 300)

      return response
    } catch (error: any) {
      console.error('❌ RimasService error:', error)
      return {
        success: false,
        data: [],
        total: 0
      }
    }
  }

  /**
   * Obter rima por ID
   */
  static async getRimaById(id: string): Promise<RimaResult | null> {
    try {
      const { data, error } = await supabase
        .from('rimas_versos')
        .select('id, verso1, verso2, tema, categoria, created_at')
        .eq('id', id)
        .single()

      if (error || !data) return null

      return data as RimaResult
    } catch {
      return null
    }
  }

  /**
   * Obter rimas aleatórias
   */
  static async getRandomRimas(limit: number = 10): Promise<RimaResult[]> {
    try {
      // Cache por 10 minutos
      const cacheKey = `rimas:random:${limit}`
      const cached = await getCache<RimaResult[]>(cacheKey)

      if (cached) {
        return cached
      }

      const { data, error } = await supabase
        .from('rimas_versos')
        .select('id, verso1, verso2, tema, categoria, created_at')
        .limit(limit)

      if (error || !data) return []

      await setCache(cacheKey, data, 600)
      return data as RimaResult[]
    } catch {
      return []
    }
  }

  /**
   * Obter estatísticas de rimas
   */
  static async getStats(): Promise<{
    total: number
    temas: { [key: string]: number }
    categorias: { [key: string]: number }
  }> {
    try {
      const cacheKey = 'rimas:stats'
      const cached = await getCache<any>(cacheKey)

      if (cached) {
        return cached
      }

      const { data, error, count } = await supabase
        .from('rimas_versos')
        .select('tema, categoria', { count: 'exact' })

      if (error || !data) {
        return { total: 0, temas: {}, categorias: {} }
      }

      const temas: { [key: string]: number } = {}
      const categorias: { [key: string]: number } = {}

      data.forEach((rima: any) => {
        if (rima.tema) {
          temas[rima.tema] = (temas[rima.tema] || 0) + 1
        }
        if (rima.categoria) {
          categorias[rima.categoria] = (categorias[rima.categoria] || 0) + 1
        }
      })

      const stats = {
        total: count || 0,
        temas,
        categorias
      }

      await setCache(cacheKey, stats, 1800) // Cache 30 minutos
      return stats
    } catch {
      return { total: 0, temas: {}, categorias: {} }
    }
  }

  /**
   * Obter lista de temas únicos
   */
  static async getTemas(): Promise<string[]> {
    try {
      const cacheKey = 'rimas:temas'
      const cached = await getCache<string[]>(cacheKey)

      if (cached) {
        return cached
      }

      const { data, error } = await supabase
        .from('rimas_versos')
        .select('tema')
        .neq('tema', null)

      if (error || !data) return []

      const temas = Array.from(new Set(data.map((r: any) => r.tema).filter(Boolean)))
        .sort() as string[]

      await setCache(cacheKey, temas, 1800)
      return temas
    } catch {
      return []
    }
  }

  /**
   * Obter lista de categorias únicas
   */
  static async getCategorias(): Promise<string[]> {
    try {
      const cacheKey = 'rimas:categorias'
      const cached = await getCache<string[]>(cacheKey)

      if (cached) {
        return cached
      }

      const { data, error } = await supabase
        .from('rimas_versos')
        .select('categoria')
        .neq('categoria', null)

      if (error || !data) return []

      const categorias = Array.from(new Set(data.map((r: any) => r.categoria).filter(Boolean)))
        .sort() as string[]

      await setCache(cacheKey, categorias, 1800)
      return categorias
    } catch {
      return []
    }
  }
}
