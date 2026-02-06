# 📥 GUIA COMPLETO - IMPORTAÇÃO DE 100,000+ RIMAS

## 🎯 VISÃO GERAL

Este guia mostra como importar suas **100,000+ rimas** no Supabase de forma eficiente, segura e com retry automático.

---

## 📋 PRÉ-REQUISITOS

### 1. Ambiente

```bash
✅ Node.js 18+ instalado
✅ Supabase projeto criado
✅ Arquivo .env configurado
✅ 100k+ rimas em formato JSON
```

### 2. Variáveis de Ambiente (.env)

```env
# Supabase (OBRIGATÓRIO)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # Service Role Key (não anon!)

# OpenAI (opcional - para geração)
OPENAI_API_KEY=sk-proj-xxx
```

⚠️ **IMPORTANTE:** Use `SUPABASE_SERVICE_KEY` (Service Role), NÃO a chave anon!

---

## 📂 ESTRUTURA DE ARQUIVOS

```
verso-genius-unified/
├── scripts/
│   └── import-rimas-massive.ts    ← Script de importação
├── data/
│   ├── rimas-input.json          ← SUAS 100k+ RIMAS (você cria)
│   └── rimas-input-example.json  ← Exemplo de formato
├── import-log.json               ← Log gerado automaticamente
├── import-checkpoint.json        ← Checkpoint para retomar
└── .env                          ← Configuração
```

---

## 📝 FORMATO DO ARQUIVO DE ENTRADA

### Localização

```
data/rimas-input.json
```

### Schema (JSON Array)

```json
[
  {
    "verso": "Texto completo da rima\nCom quebras de linha\nGeralmente 4 linhas\nNo formato tradicional",
    "tema": "batalha",
    "familia_rima": "ada",
    "dificuldade": "hard",
    "citacao_real": "Emicida - Levanta e Anda",
    "mc_source": "Emicida",
    "musica_source": "Levanta e Anda",
    "ranking": 92,
    "is_featured": true
  },
  {
    "verso": "Outra rima aqui...",
    "tema": "amor",
    "dificuldade": "medium"
  }
]
```

### Campos

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| **verso** | string | ✅ Sim | Texto completo da rima | "Minha rima é pesada..." |
| **tema** | string | ✅ Sim | Categoria/tema | "batalha", "amor", "social" |
| **dificuldade** | enum | ✅ Sim | Nível: "easy", "medium", "hard" | "hard" |
| **familia_rima** | string | ❌ Não | Terminação da rima | "ada", "ão", "ente" |
| **citacao_real** | string | ❌ Não | Se é citação real | "Emicida - Levanta e Anda" |
| **mc_source** | string | ❌ Não | Nome do MC original | "Emicida", "Racionais" |
| **musica_source** | string | ❌ Não | Nome da música | "Levanta e Anda" |
| **ranking** | number | ❌ Não | Score 0-100 (default: 0) | 85 |
| **is_featured** | boolean | ❌ Não | Destaque (default: false) | true |

### Validações Automáticas

O script valida automaticamente:

- ✅ Campos obrigatórios presentes
- ✅ `dificuldade` é "easy", "medium" ou "hard"
- ✅ `verso` não excede 5000 caracteres
- ✅ `tema` não excede 100 caracteres
- ✅ `ranking` é número entre 0-100
- ✅ Deduplicação (ignora versos já existentes)

---

## 🚀 PASSO A PASSO

### Passo 1: Preparar o Arquivo JSON

Converta suas rimas para o formato JSON:

```bash
# Criar diretório
mkdir -p data

# Criar arquivo (substitua com suas rimas)
nano data/rimas-input.json
```

**Exemplo com 3 rimas:**

```json
[
  {
    "verso": "Primeira rima aqui\nSegunda linha\nTerceira linha\nQuarta linha",
    "tema": "batalha",
    "dificuldade": "hard",
    "ranking": 90
  },
  {
    "verso": "Segunda rima...",
    "tema": "amor",
    "dificuldade": "medium"
  },
  {
    "verso": "Terceira rima...",
    "tema": "social",
    "dificuldade": "hard",
    "mc_source": "Racionais"
  }
]
```

💡 **Dica:** Se suas rimas estão em CSV, TXT ou outro formato, veja a seção [Conversão de Formatos](#conversão-de-formatos).

---

### Passo 2: Configurar Supabase

1. **Obter Service Key:**
   - Acessar: https://supabase.com/dashboard/project/SEU_PROJETO/settings/api
   - Copiar: **service_role key** (não a anon key!)

2. **Configurar .env:**

```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5MTU2NTYwMDB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### Passo 3: Aplicar Migrations (Se Ainda Não Fez)

```bash
# Verificar se tabelas existem
# Acessar Supabase SQL Editor e executar:
SELECT COUNT(*) FROM rimas_banco;

# Se der erro "relation does not exist", aplicar migration:
# Copiar conteúdo de database/supabase/migrations/001_unified_schema.sql
# Colar no SQL Editor e executar
```

---

### Passo 4: Executar Importação

```bash
# Instalar dependências (se ainda não fez)
npm install

# Executar script
tsx scripts/import-rimas-massive.ts
```

### Saída Esperada

```
╔════════════════════════════════════════════════════════╗
║   IMPORTAÇÃO MASSIVA DE RIMAS PARA SUPABASE           ║
╚════════════════════════════════════════════════════════╝

📂 Carregando rimas de: C:\Users\lucas\verso-genius-unified\data\rimas-input.json
✅ Carregadas 100,000 rimas do arquivo

🔍 Carregando versos existentes para deduplicação...
✅ Carregados 5,432 versos existentes

🔍 Validando rimas...
✅ Validação concluída:
   - Válidas: 94,568
   - Duplicadas: 5,432
   - Inválidas: 0

🚀 Iniciando importação em batches de 500...

🚀 [████████████████████████████████████████] 100.0% (94,568/94,568) | 156.2 rimas/s | Resta: 0m 0s

✅ IMPORTAÇÃO CONCLUÍDA!

📊 ESTATÍSTICAS FINAIS:
   ✅ Importadas com sucesso: 94,568
   ❌ Falharam: 0
   🔄 Duplicadas (ignoradas): 5,432
   ⏱️  Tempo total: 10m 5s
   ⚡ Taxa média: 156.2 rimas/segundo

📝 Log salvo em: C:\Users\lucas\verso-genius-unified\import-log.json

🎉 Processo finalizado!
```

---

## ⚙️ CONFIGURAÇÕES AVANÇADAS

### Ajustar Performance

Editar `scripts/import-rimas-massive.ts`:

```typescript
const CONFIG = {
  BATCH_SIZE: 500,          // ← Aumentar para 1000 se quiser mais velocidade
  MAX_RETRIES: 3,           // ← Tentativas em caso de erro
  RETRY_DELAY_MS: 2000,     // ← Delay entre retries
  ENABLE_DEDUPLICATION: true, // ← Desabilitar se não tiver rimas duplicadas
  LOG_FILE: 'import-log.json',
  CHECKPOINT_FILE: 'import-checkpoint.json'
}
```

### Recomendações de BATCH_SIZE

| Rimas Totais | BATCH_SIZE | Tempo Estimado |
|--------------|------------|----------------|
| < 10,000 | 500 | 1-2 minutos |
| 10k - 50k | 500 | 5-10 minutos |
| 50k - 100k | 1000 | 8-15 minutos |
| > 100k | 1000 | 15-30 minutos |

---

## 🔄 SISTEMA DE CHECKPOINT

O script salva **checkpoints** a cada 10 batches. Se a importação for interrompida:

```bash
# Continuar de onde parou
tsx scripts/import-rimas-massive.ts

# Saída:
📌 Checkpoint encontrado! Continuando do batch 54
```

**Arquivos gerados:**
- `import-checkpoint.json` - Checkpoint automático
- `import-log.json` - Log completo da importação

---

## 📊 VERIFICAR IMPORTAÇÃO

### 1. No Supabase SQL Editor

```sql
-- Contar total de rimas
SELECT COUNT(*) as total_rimas FROM rimas_banco;

-- Contar por tema
SELECT tema, COUNT(*) as total
FROM rimas_banco
GROUP BY tema
ORDER BY total DESC;

-- Ver últimas importadas
SELECT id, tema, LEFT(verso, 50) as preview, created_at
FROM rimas_banco
ORDER BY created_at DESC
LIMIT 20;
```

### 2. Via Script

```typescript
// Adicionar ao final de import-rimas-massive.ts
const { count } = await supabase
  .from('rimas_banco')
  .select('*', { count: 'exact', head: true })

console.log(`Total de rimas no banco: ${count}`)
```

---

## 🔄 CONVERSÃO DE FORMATOS

### CSV → JSON

Se suas rimas estão em CSV:

```python
# converter-csv-para-json.py
import csv
import json

input_csv = 'rimas.csv'
output_json = 'data/rimas-input.json'

rimas = []

with open(input_csv, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        rimas.append({
            'verso': row['verso'],
            'tema': row['tema'],
            'dificuldade': row['dificuldade'],
            'familia_rima': row.get('familia_rima'),
            'mc_source': row.get('mc_source'),
            'ranking': int(row.get('ranking', 0))
        })

with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(rimas, f, ensure_ascii=False, indent=2)

print(f'✅ Convertidas {len(rimas)} rimas para {output_json}')
```

Executar:
```bash
python converter-csv-para-json.py
```

### TXT → JSON (Uma Rima por Arquivo)

```python
# converter-txt-para-json.py
import os
import json
from pathlib import Path

input_dir = 'rimas_txt/'
output_json = 'data/rimas-input.json'

rimas = []

for file in Path(input_dir).glob('*.txt'):
    with open(file, 'r', encoding='utf-8') as f:
        verso = f.read().strip()

        # Extrair tema do nome do arquivo (ex: "batalha_001.txt")
        tema = file.stem.split('_')[0]

        rimas.append({
            'verso': verso,
            'tema': tema,
            'dificuldade': 'medium'  # Ajustar conforme necessário
        })

with open(output_json, 'w', encoding='utf-8') as f:
    json.dump(rimas, f, ensure_ascii=False, indent=2)

print(f'✅ Convertidas {len(rimas)} rimas de {input_dir}')
```

---

## ❌ TROUBLESHOOTING

### Erro: "SUPABASE_URL não configurada"

**Solução:**
```bash
# Verificar .env
cat .env | grep SUPABASE

# Deve mostrar:
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

---

### Erro: "relation 'rimas_banco' does not exist"

**Solução:** Aplicar migration primeiro.

```sql
-- Acessar Supabase SQL Editor e executar:
-- 1. Copiar conteúdo de database/supabase/migrations/001_unified_schema.sql
-- 2. Colar e executar

-- Verificar:
SELECT * FROM rimas_banco LIMIT 1;
```

---

### Erro: "row is too big"

**Problema:** Algum verso é muito grande (> 8KB).

**Solução:** Limitar tamanho no script:

```typescript
if (rima.verso && rima.verso.length > 5000) {
  rima.verso = rima.verso.substring(0, 5000)
}
```

---

### Importação Muito Lenta

**Causas:**
1. BATCH_SIZE muito pequeno
2. Rede lenta
3. Deduplicação habilitada com muitos registros

**Soluções:**
```typescript
// 1. Aumentar batch size
BATCH_SIZE: 1000  // de 500 para 1000

// 2. Desabilitar deduplicação se não tiver duplicatas
ENABLE_DEDUPLICATION: false

// 3. Executar em servidor na mesma região do Supabase
```

---

### Erro: "JWT expired"

**Problema:** Service key expirada (raro).

**Solução:** Gerar nova service key no dashboard Supabase.

---

## 📈 PERFORMANCE ESPERADA

| Rimas | BATCH_SIZE | Tempo | Rimas/segundo |
|-------|-----------|-------|---------------|
| 10,000 | 500 | 1m 30s | 111 |
| 50,000 | 500 | 6m 20s | 131 |
| 100,000 | 1000 | 10m 30s | 158 |
| 500,000 | 1000 | 52m | 160 |

**Fatores que afetam:**
- Latência de rede
- Região do Supabase
- Tamanho médio dos versos
- Deduplicação habilitada

---

## 🎯 CHECKLIST FINAL

Antes de executar:

- [ ] Arquivo `data/rimas-input.json` criado
- [ ] `.env` configurado com SUPABASE_URL e SERVICE_KEY
- [ ] Migration 001_unified_schema.sql aplicada
- [ ] Dependências instaladas (`npm install`)
- [ ] Formato JSON validado (ver exemplo)

Executar:

- [ ] `tsx scripts/import-rimas-massive.ts`
- [ ] Verificar progresso no terminal
- [ ] Aguardar conclusão (10-30 min para 100k)
- [ ] Verificar `import-log.json`

Verificar:

- [ ] `SELECT COUNT(*) FROM rimas_banco` no Supabase
- [ ] Rimas visíveis no Table Editor
- [ ] Índices funcionando (queries rápidas)

---

## 🚀 APÓS A IMPORTAÇÃO

### 1. Otimizar Banco

```sql
-- Atualizar estatísticas
ANALYZE rimas_banco;

-- Rebuild índices
REINDEX TABLE rimas_banco;

-- Verificar índices
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename = 'rimas_banco';
```

### 2. Testar Queries

```sql
-- Busca por tema (deve ser rápida)
EXPLAIN ANALYZE
SELECT * FROM rimas_banco WHERE tema = 'batalha' LIMIT 20;

-- Full-text search (deve usar índice GIN)
EXPLAIN ANALYZE
SELECT * FROM rimas_banco WHERE verso % 'flow batida' LIMIT 10;
```

### 3. Backup

```bash
# Via Supabase CLI
supabase db dump -f backup-100k-rimas.sql

# Ou via dashboard: Database → Backups
```

---

## 📚 PRÓXIMOS PASSOS

1. ✅ **Importação Completa** - 100k+ rimas no Supabase
2. 🔄 **Seed Temas** - Popular tabela `rimas_temas`
3. 🤖 **Integrar Night-Crawler** - Sistema de geração
4. 🎨 **Criar Componentes Frontend** - RhymeGenerator, RhymeSearch
5. 🚀 **Deploy Production** - Railway/Vercel

---

**Criado:** 2026-02-06
**Script:** `scripts/import-rimas-massive.ts`
**Status:** ✅ Production Ready

