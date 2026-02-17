import Database from 'better-sqlite3'
import { join } from 'path'

// Types
export interface Artista {
  id: number
  genius_id: number
  nome: string
  total_musicas: number
}

export interface Letra {
  id: number
  genius_id: number
  artista_id: number
  titulo: string
  letra: string
  url: string
  views: number
  release_date: string
  estilo: string
  qualidade: number
  versos_total: number
  palavras_total: number
  temas: string
  created_at: string
  // Joined fields
  artista_nome?: string
}

export interface Rima {
  id: number
  letra_id: number
  palavra1: string
  palavra2: string
  verso1: string
  verso2: string
  tipo: 'perfeita' | 'consoante' | 'toante' | 'interna'
  score: number
  // Joined fields
  letra_titulo?: string
}

export interface RimaGerada {
  id?: number
  tema: string
  estilo: string
  conteudo: string
  score: number
  created_at?: string
}

export interface Stats {
  totalLetras: number
  totalRimas: number
  totalArtistas: number
  totalVersos: number
  totalRimasGeradas: number
  mediaQualidade: number
  rimasPorTipo: Record<string, number>
}

// Database Adapter Interface (para futura migracao D1)
export interface DBAdapter {
  getLetras(params?: { limit?: number; offset?: number; estilo?: string; artista_id?: number }): Letra[]
  getLetraById(id: number): Letra | undefined
  searchLetras(query: string): Letra[]
  getRimas(params?: { palavra?: string; tipo?: string; limit?: number }): Rima[]
  getRimasPorPalavra(palavra: string): Rima[]
  getStats(): Stats
  getRimasGeradas(limit?: number): RimaGerada[]
  saveRimaGerada(rima: RimaGerada): number
  getArtistas(): Artista[]
}

// SQLite Implementation
export class SQLiteAdapter implements DBAdapter {
  private db: Database.Database

  constructor(dbPath?: string) {
    const path = dbPath || join(process.cwd(), 'data', 'rimas.db')
    this.db = new Database(path, { readonly: false })
    this.db.pragma('journal_mode = WAL')
    this.ensureRimasGeradasTable()
  }

  private ensureRimasGeradasTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rimas_geradas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tema TEXT NOT NULL,
        estilo TEXT NOT NULL,
        conteudo TEXT NOT NULL,
        score REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  getLetras(params?: { limit?: number; offset?: number; estilo?: string; artista_id?: number }): Letra[] {
    const limit = params?.limit || 20
    const offset = params?.offset || 0

    let sql = `
      SELECT l.*, a.nome as artista_nome
      FROM letras l
      LEFT JOIN artistas a ON l.artista_id = a.id
      WHERE 1=1
    `
    const bindings: any[] = []

    if (params?.estilo) {
      sql += ` AND l.estilo = ?`
      bindings.push(params.estilo)
    }

    if (params?.artista_id) {
      sql += ` AND l.artista_id = ?`
      bindings.push(params.artista_id)
    }

    sql += ` ORDER BY l.views DESC, l.id DESC LIMIT ? OFFSET ?`
    bindings.push(limit, offset)

    return this.db.prepare(sql).all(...bindings) as Letra[]
  }

  getLetraById(id: number): Letra | undefined {
    const sql = `
      SELECT l.*, a.nome as artista_nome
      FROM letras l
      LEFT JOIN artistas a ON l.artista_id = a.id
      WHERE l.id = ?
    `
    return this.db.prepare(sql).get(id) as Letra | undefined
  }

  searchLetras(query: string): Letra[] {
    const sql = `
      SELECT l.*, a.nome as artista_nome
      FROM letras l
      LEFT JOIN artistas a ON l.artista_id = a.id
      WHERE l.titulo LIKE ? OR l.letra LIKE ?
      ORDER BY l.views DESC
      LIMIT 20
    `
    const pattern = `%${query}%`
    return this.db.prepare(sql).all(pattern, pattern) as Letra[]
  }

  getRimas(params?: { palavra?: string; tipo?: string; limit?: number }): Rima[] {
    const limit = params?.limit || 50

    let sql = `
      SELECT r.*, l.titulo as letra_titulo
      FROM rimas r
      LEFT JOIN letras l ON r.letra_id = l.id
      WHERE 1=1
    `
    const bindings: any[] = []

    if (params?.palavra) {
      sql += ` AND (r.palavra1 LIKE ? OR r.palavra2 LIKE ?)`
      const pattern = `%${params.palavra}%`
      bindings.push(pattern, pattern)
    }

    if (params?.tipo) {
      sql += ` AND r.tipo = ?`
      bindings.push(params.tipo)
    }

    sql += ` ORDER BY r.score DESC LIMIT ?`
    bindings.push(limit)

    return this.db.prepare(sql).all(...bindings) as Rima[]
  }

  getRimasPorPalavra(palavra: string): Rima[] {
    const sql = `
      SELECT r.*, l.titulo as letra_titulo
      FROM rimas r
      LEFT JOIN letras l ON r.letra_id = l.id
      WHERE LOWER(r.palavra1) = LOWER(?) OR LOWER(r.palavra2) = LOWER(?)
      ORDER BY r.score DESC
      LIMIT 100
    `
    return this.db.prepare(sql).all(palavra, palavra) as Rima[]
  }

  getStats(): Stats {
    const letrasCount = this.db.prepare('SELECT COUNT(*) as c FROM letras').get() as { c: number }
    const rimasCount = this.db.prepare('SELECT COUNT(*) as c FROM rimas').get() as { c: number }
    const artistasCount = this.db.prepare('SELECT COUNT(*) as c FROM artistas').get() as { c: number }
    const versosSum = this.db.prepare('SELECT COALESCE(SUM(versos_total), 0) as s FROM letras').get() as { s: number }
    const avgQualidade = this.db.prepare('SELECT COALESCE(AVG(qualidade), 0) as a FROM letras').get() as { a: number }
    const rimasGeradasCount = this.db.prepare('SELECT COUNT(*) as c FROM rimas_geradas').get() as { c: number }

    const tiposRaw = this.db.prepare(`
      SELECT tipo, COUNT(*) as count
      FROM rimas
      GROUP BY tipo
    `).all() as { tipo: string; count: number }[]

    const rimasPorTipo: Record<string, number> = {}
    for (const t of tiposRaw) {
      rimasPorTipo[t.tipo] = t.count
    }

    return {
      totalLetras: letrasCount.c,
      totalRimas: rimasCount.c,
      totalArtistas: artistasCount.c,
      totalVersos: versosSum.s,
      totalRimasGeradas: rimasGeradasCount.c,
      mediaQualidade: avgQualidade.a,
      rimasPorTipo
    }
  }

  getRimasGeradas(limit = 10): RimaGerada[] {
    return this.db.prepare(`
      SELECT * FROM rimas_geradas
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as RimaGerada[]
  }

  saveRimaGerada(rima: RimaGerada): number {
    const result = this.db.prepare(`
      INSERT INTO rimas_geradas (tema, estilo, conteudo, score)
      VALUES (?, ?, ?, ?)
    `).run(rima.tema, rima.estilo, rima.conteudo, rima.score)

    return result.lastInsertRowid as number
  }

  getArtistas(): Artista[] {
    return this.db.prepare(`
      SELECT a.*,
        (SELECT COUNT(*) FROM letras WHERE artista_id = a.id) as total_musicas
      FROM artistas a
      ORDER BY total_musicas DESC
    `).all() as Artista[]
  }

  close() {
    this.db.close()
  }
}

// Singleton instance
let dbInstance: SQLiteAdapter | null = null

export function getDB(): SQLiteAdapter {
  if (!dbInstance) {
    dbInstance = new SQLiteAdapter()
  }
  return dbInstance
}

export function closeDB() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
