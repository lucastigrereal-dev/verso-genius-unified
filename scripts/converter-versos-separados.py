"""
CONVERSOR: Versos Separados → Verso Completo

Se suas rimas estão no formato:
  verso1, verso2, verso3, verso4, categoria

Este script converte para:
  verso (completo), tema, dificuldade

COMO USAR:
1. Prepare arquivo CSV: data/rimas-separadas.csv
2. Execute: python scripts/converter-versos-separados.py
3. Resultado: data/rimas-input.json (pronto para import)
"""

import csv
import json
from pathlib import Path

# ========================================
# CONFIGURAÇÃO
# ========================================

INPUT_CSV = 'data/rimas-separadas.csv'
OUTPUT_JSON = 'data/rimas-input.json'

# Mapeamento de dificuldade (ajustar conforme seus dados)
DIFICULDADE_MAP = {
    'fácil': 'easy',
    'facil': 'easy',
    'média': 'medium',
    'media': 'medium',
    'médio': 'medium',
    'medio': 'medium',
    'difícil': 'hard',
    'dificil': 'hard'
}

# ========================================
# FUNÇÕES
# ========================================

def juntar_versos(verso1, verso2, verso3='', verso4='', verso5='', verso6='', verso7='', verso8=''):
    """Junta versos separados em um texto completo"""
    versos = [verso1, verso2, verso3, verso4, verso5, verso6, verso7, verso8]

    # Filtrar versos vazios
    versos_validos = [v.strip() for v in versos if v and v.strip()]

    # Juntar com quebra de linha
    return '\n'.join(versos_validos)

def extrair_familia_rima(verso_completo):
    """Extrai a família de rima (últimas sílabas da última linha)"""
    linhas = verso_completo.split('\n')
    if not linhas:
        return None

    ultima_linha = linhas[-1].strip()
    palavras = ultima_linha.split()

    if not palavras:
        return None

    ultima_palavra = palavras[-1].lower()

    # Remover pontuação
    ultima_palavra = ''.join(c for c in ultima_palavra if c.isalnum())

    # Pegar últimas 2-3 letras
    if len(ultima_palavra) >= 3:
        return ultima_palavra[-3:]
    elif len(ultima_palavra) >= 2:
        return ultima_palavra[-2:]

    return None

def normalizar_dificuldade(dif_input):
    """Normaliza dificuldade para easy/medium/hard"""
    if not dif_input:
        return 'medium'  # Default

    dif_lower = dif_input.lower().strip()
    return DIFICULDADE_MAP.get(dif_lower, 'medium')

def calcular_ranking(verso_completo):
    """Calcula ranking baseado em complexidade"""
    linhas = verso_completo.split('\n')
    num_linhas = len(linhas)

    # Pontuação base por número de linhas
    if num_linhas >= 8:
        score = 90
    elif num_linhas >= 4:
        score = 75
    else:
        score = 60

    # Bonus por tamanho médio das linhas
    avg_length = sum(len(l) for l in linhas) / num_linhas
    if avg_length > 60:
        score += 10
    elif avg_length > 40:
        score += 5

    return min(100, score)

# ========================================
# CONVERSÃO
# ========================================

def converter():
    print('\n╔══════════════════════════════════════════════════╗')
    print('║  CONVERSOR: Versos Separados → Verso Completo   ║')
    print('╚══════════════════════════════════════════════════╝\n')

    # Verificar arquivo de entrada
    if not Path(INPUT_CSV).exists():
        print(f'❌ ERRO: Arquivo não encontrado: {INPUT_CSV}')
        print('\nCrie o arquivo CSV com as colunas:')
        print('  - verso1, verso2, verso3, verso4, categoria')
        print('  OU')
        print('  - linha1, linha2, linha3, linha4, tema')
        return

    print(f'📂 Lendo: {INPUT_CSV}')

    rimas_convertidas = []
    erros = []

    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for i, row in enumerate(reader, start=1):
            try:
                # Detectar colunas (tentar variações)
                verso1 = row.get('verso1') or row.get('linha1') or row.get('v1') or ''
                verso2 = row.get('verso2') or row.get('linha2') or row.get('v2') or ''
                verso3 = row.get('verso3') or row.get('linha3') or row.get('v3') or ''
                verso4 = row.get('verso4') or row.get('linha4') or row.get('v4') or ''
                verso5 = row.get('verso5') or row.get('linha5') or row.get('v5') or ''
                verso6 = row.get('verso6') or row.get('linha6') or row.get('v6') or ''
                verso7 = row.get('verso7') or row.get('linha7') or row.get('v7') or ''
                verso8 = row.get('verso8') or row.get('linha8') or row.get('v8') or ''

                categoria = row.get('categoria') or row.get('tema') or row.get('category') or 'geral'
                dificuldade_input = row.get('dificuldade') or row.get('difficulty') or 'medium'

                # Juntar versos
                verso_completo = juntar_versos(verso1, verso2, verso3, verso4, verso5, verso6, verso7, verso8)

                if not verso_completo:
                    erros.append(f'Linha {i}: Nenhum verso válido')
                    continue

                # Extrair família de rima
                familia_rima = extrair_familia_rima(verso_completo)

                # Normalizar dificuldade
                dificuldade = normalizar_dificuldade(dificuldade_input)

                # Calcular ranking
                ranking = calcular_ranking(verso_completo)

                # Criar objeto
                rima = {
                    'verso': verso_completo,
                    'tema': categoria.lower().strip(),
                    'dificuldade': dificuldade,
                    'familia_rima': familia_rima,
                    'ranking': ranking,
                    'is_featured': False
                }

                rimas_convertidas.append(rima)

            except Exception as e:
                erros.append(f'Linha {i}: {str(e)}')

    # Resultados
    print(f'\n✅ Conversão concluída!')
    print(f'   - Convertidas: {len(rimas_convertidas):,}')
    print(f'   - Erros: {len(erros):,}')

    if erros:
        print('\n⚠️  Erros encontrados:')
        for erro in erros[:10]:  # Mostrar primeiros 10
            print(f'   {erro}')
        if len(erros) > 10:
            print(f'   ... e mais {len(erros) - 10} erros')

    # Salvar JSON
    if rimas_convertidas:
        with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
            json.dump(rimas_convertidas, f, ensure_ascii=False, indent=2)

        print(f'\n💾 Salvo em: {OUTPUT_JSON}')
        print(f'   Tamanho: {Path(OUTPUT_JSON).stat().st_size / 1024:.1f} KB')

        # Exemplo
        print('\n📝 Exemplo convertido:')
        exemplo = rimas_convertidas[0]
        print(f'   Tema: {exemplo["tema"]}')
        print(f'   Dificuldade: {exemplo["dificuldade"]}')
        print(f'   Verso:')
        for linha in exemplo['verso'].split('\n'):
            print(f'      {linha}')

        print('\n🚀 Próximo passo:')
        print('   tsx scripts/import-rimas-massive.ts')
    else:
        print('\n❌ Nenhuma rima válida encontrada!')

# ========================================
# EXECUTAR
# ========================================

if __name__ == '__main__':
    converter()
