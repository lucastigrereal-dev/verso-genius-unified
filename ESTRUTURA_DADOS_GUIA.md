# 🗄️ GUIA DE ESTRUTURA DE DADOS - SUPABASE

## 📊 COMPARAÇÃO DE ESTRUTURAS

### ✅ ESTRUTURA RECOMENDADA (Atual)

```sql
CREATE TABLE rimas_banco (
  id UUID PRIMARY KEY,
  verso TEXT NOT NULL,           -- ← Verso COMPLETO
  tema VARCHAR(100) NOT NULL,
  familia_rima VARCHAR(50),
  dificuldade difficulty_level,
  ranking INTEGER,
  created_at TIMESTAMP
);
```

**Registro exemplo:**
```json
{
  "id": "uuid-123",
  "verso": "Linha 1\nLinha 2\nLinha 3\nLinha 4",
  "tema": "batalha",
  "familia_rima": "ão",
  "dificuldade": "hard",
  "ranking": 92
}
```

**Vantagens:**
- ✅ Flexível (2, 4, 8, 16 linhas)
- ✅ Busca full-text rápida
- ✅ Menos colunas
- ✅ Fácil de manter
- ✅ Preserva formatação original

---

### ❌ ESTRUTURA NÃO RECOMENDADA

```sql
CREATE TABLE rimas_banco (
  id UUID PRIMARY KEY,
  verso1 TEXT,
  verso2 TEXT,
  verso3 TEXT,
  verso4 TEXT,
  categoria VARCHAR(100)
);
```

**Registro exemplo:**
```json
{
  "id": "uuid-123",
  "verso1": "Linha 1",
  "verso2": "Linha 2",
  "verso3": "Linha 3",
  "verso4": "Linha 4",
  "categoria": "batalha"
}
```

**Desvantagens:**
- ❌ Rígido (máximo 4 linhas)
- ❌ Desperdício (se rima tem 2 linhas)
- ❌ Busca complexa (4 campos)
- ❌ Difícil de manter
- ❌ Não escala

---

## 🔄 COMO CONVERTER SEUS DADOS

### Se seus dados estão em CSV (versos separados)

**Arquivo:** `data/rimas-separadas.csv`

```csv
verso1,verso2,verso3,verso4,categoria,dificuldade
"Linha 1","Linha 2","Linha 3","Linha 4",batalha,hard
"Linha A","Linha B","Linha C","Linha D",amor,medium
```

**Executar conversor:**

```bash
python scripts/converter-versos-separados.py
```

**Resultado:** `data/rimas-input.json` (pronto para importar)

```json
[
  {
    "verso": "Linha 1\nLinha 2\nLinha 3\nLinha 4",
    "tema": "batalha",
    "dificuldade": "hard",
    "familia_rima": "ão",
    "ranking": 85
  }
]
```

---

## 📝 FORMATOS DE ENTRADA ACEITOS

### Formato 1: JSON com Verso Completo (IDEAL)

```json
[
  {
    "verso": "Rima linha 1\nRima linha 2\nRima linha 3\nRima linha 4",
    "tema": "batalha",
    "dificuldade": "hard"
  }
]
```

✅ **Usar diretamente:** `tsx scripts/import-rimas-massive.ts`

---

### Formato 2: CSV com Versos Separados

```csv
verso1,verso2,verso3,verso4,categoria
"Linha 1","Linha 2","Linha 3","Linha 4",batalha
```

🔄 **Converter primeiro:** `python scripts/converter-versos-separados.py`

---

### Formato 3: JSON com Versos Separados

```json
[
  {
    "verso1": "Linha 1",
    "verso2": "Linha 2",
    "verso3": "Linha 3",
    "verso4": "Linha 4",
    "categoria": "batalha"
  }
]
```

🔄 **Converter:** Adaptar o script Python para ler JSON

---

### Formato 4: TXT (um arquivo por rima)

```
rimas/
  ├── batalha_001.txt  → "Linha 1\nLinha 2\nLinha 3\nLinha 4"
  ├── amor_001.txt     → "Linha A\nLinha B\nLinha C\nLinha D"
  └── social_001.txt   → ...
```

🔄 **Converter:** Ver `IMPORTACAO_RIMAS_GUIA.md` seção "TXT → JSON"

---

## 🎯 SCHEMA FINAL NO SUPABASE

### Tabela: rimas_banco

| Coluna | Tipo | Null | Default | Descrição |
|--------|------|------|---------|-----------|
| **id** | uuid | ❌ | gen_random_uuid() | ID único |
| **verso** | text | ❌ | - | Verso completo com `\n` |
| **tema** | varchar(100) | ❌ | - | Categoria/tema |
| **familia_rima** | varchar(50) | ✅ | null | Terminação (ex: "ão") |
| **dificuldade** | enum | ❌ | 'medium' | easy/medium/hard |
| **citacao_real** | text | ✅ | null | Se é citação real |
| **mc_source** | varchar(100) | ✅ | null | Nome do MC |
| **musica_source** | varchar(255) | ✅ | null | Nome da música |
| **ranking** | integer | ✅ | 0 | Score 0-100 |
| **is_featured** | boolean | ✅ | false | Destaque |
| **views_count** | integer | ✅ | 0 | Visualizações |
| **likes_count** | integer | ✅ | 0 | Curtidas |
| **created_at** | timestamp | ✅ | now() | Data criação |
| **updated_at** | timestamp | ✅ | now() | Última atualização |

### Índices

```sql
CREATE INDEX idx_rimas_banco_tema ON rimas_banco(tema);
CREATE INDEX idx_rimas_banco_familia_rima ON rimas_banco(familia_rima);
CREATE INDEX idx_rimas_banco_dificuldade ON rimas_banco(dificuldade);
CREATE INDEX idx_rimas_banco_verso_trgm ON rimas_banco USING GIN(verso gin_trgm_ops);
```

---

## 💡 EXEMPLOS PRÁTICOS

### Exemplo 1: Rima de 4 Linhas

**Entrada (CSV separado):**
```csv
verso1,verso2,verso3,verso4,categoria
"Minha rima é pesada","Na batida calibrada","Toda letra é verdade","Cada barra é certeira",batalha
```

**Conversão:**
```json
{
  "verso": "Minha rima é pesada\nNa batida calibrada\nToda letra é verdade\nCada barra é certeira",
  "tema": "batalha",
  "dificuldade": "medium",
  "familia_rima": "ada",
  "ranking": 75
}
```

**No Supabase:**
```
id: 550e8400-e29b-41d4-a716-446655440000
verso: "Minha rima é pesada\nNa batida calibrada\nToda letra é verdade\nCada barra é certeira"
tema: "batalha"
familia_rima: "ada"
dificuldade: "medium"
ranking: 75
```

---

### Exemplo 2: Rima de 8 Linhas

**Entrada (JSON completo):**
```json
{
  "verso": "Linha 1\nLinha 2\nLinha 3\nLinha 4\nLinha 5\nLinha 6\nLinha 7\nLinha 8",
  "tema": "social",
  "dificuldade": "hard"
}
```

✅ **Funciona perfeitamente!** Não há limite de linhas.

---

### Exemplo 3: Rima de 2 Linhas

**Entrada:**
```json
{
  "verso": "Amor é poesia\nNa melodia do dia",
  "tema": "amor",
  "dificuldade": "easy"
}
```

✅ **Funciona!** Não há desperdício de colunas vazias.

---

## 🔍 BUSCAR RIMAS NO SUPABASE

### Query por Tema

```sql
SELECT * FROM rimas_banco
WHERE tema = 'batalha'
ORDER BY ranking DESC
LIMIT 20;
```

### Full-Text Search

```sql
SELECT
  verso,
  tema,
  ranking,
  similarity(verso, 'flow batida') AS score
FROM rimas_banco
WHERE verso % 'flow batida'
ORDER BY score DESC
LIMIT 10;
```

### Exibir no Frontend

```typescript
// React Component
const versoCompleto = "Linha 1\nLinha 2\nLinha 3\nLinha 4"

// Dividir em linhas
const linhas = versoCompleto.split('\n')

return (
  <div>
    {linhas.map((linha, i) => (
      <p key={i}>{linha}</p>
    ))}
  </div>
)

// Renderiza:
// <p>Linha 1</p>
// <p>Linha 2</p>
// <p>Linha 3</p>
// <p>Linha 4</p>
```

---

## 🛠️ SCRIPTS DISPONÍVEIS

### 1. Importar (Verso Completo)

```bash
tsx scripts/import-rimas-massive.ts
```

**Entrada:** `data/rimas-input.json` (verso completo)

---

### 2. Converter (Versos Separados → Completo)

```bash
python scripts/converter-versos-separados.py
```

**Entrada:** `data/rimas-separadas.csv` (verso1, verso2, ...)
**Saída:** `data/rimas-input.json` (verso completo)

---

## 📋 CHECKLIST

Antes de importar:

- [ ] Decidir estrutura: verso completo (recomendado) ou separado
- [ ] Se separado: usar conversor
- [ ] Validar formato JSON
- [ ] Verificar campos obrigatórios (verso, tema, dificuldade)
- [ ] Configurar .env (SUPABASE_URL, SERVICE_KEY)
- [ ] Aplicar migration 001_unified_schema.sql
- [ ] Executar importação

---

## 🎯 RESUMO

| Aspecto | Verso Completo | Versos Separados |
|---------|----------------|------------------|
| **Flexibilidade** | ✅ Alta | ❌ Baixa |
| **Performance** | ✅ Rápida | ⚠️ Média |
| **Manutenção** | ✅ Fácil | ❌ Difícil |
| **Busca** | ✅ Simples | ❌ Complexa |
| **Escalabilidade** | ✅ Excelente | ❌ Limitada |
| **Recomendado** | ✅ SIM | ❌ NÃO |

---

## 📞 SUPORTE

Dúvidas:
1. Ver exemplos: `data/rimas-input-example.json`
2. Ver guia: `IMPORTACAO_RIMAS_GUIA.md`
3. Ver schema: `RIMAS_DATABASE_COMPLETE.md`

---

**Estrutura Recomendada: VERSO COMPLETO (TEXT)**
**Status: ✅ Production Ready**

