export interface RapLyric {
  id: number;
  titulo: string;
  artista: string;
  versos: string[];
  score: number;
  estilo: 'gangsta' | 'consciente' | 'trap' | 'boom_bap' | 'poetico';
  createdAt?: string;
}

export const rapLyrics: RapLyric[] = [
  {
    id: 1,
    titulo: "Código da Rua",
    artista: "MC Falcão",
    versos: [
      "Na quebrada onde eu cresci não tinha manual de vida",
      "Cada esquina uma lição, cada beco uma saída",
      "Minha mãe rezava forte enquanto eu buscava o pão",
      "Hoje canto pra quem vive a mesma situação"
    ],
    score: 8.7,
    estilo: "consciente"
  },
  {
    id: 2,
    titulo: "Trap do Helicóptero",
    artista: "Yung Favela",
    versos: [
      "Skrrt skrrt na Hilux preta com vidro fumê",
      "Saí do barraco agora tô de Porsche Cayenne",
      "Eles duvidaram mas o drip não mente não",
      "Chovendo de green enquanto eu conto os milhão"
    ],
    score: 7.8,
    estilo: "trap"
  },
  {
    id: 3,
    titulo: "Periferia Vive",
    artista: "Mano Zé",
    versos: [
      "O sistema quer me ver de joelho implorando",
      "Mas eu levanto todo dia guerreiro lutando",
      "Minha rima é resistência contra a opressão",
      "Favela é potência, não aceito a exclusão"
    ],
    score: 9.2,
    estilo: "consciente"
  },
  {
    id: 4,
    titulo: "Noite de Sexta",
    artista: "DJ Luan",
    versos: [
      "Sexta-feira no baile o grave vai tremer",
      "Toda mina olhando querendo me conhecer",
      "Whisky no copo, baseado na mão",
      "Essa noite vai ser loka até raiar o clarão"
    ],
    score: 7.5,
    estilo: "trap"
  },
  {
    id: 5,
    titulo: "Crônicas do Gueto",
    artista: "Poeta Marginal",
    versos: [
      "Escrevo com sangue as histórias que ninguém conta",
      "Cada verso é uma cicatriz que o tempo não aponta",
      "Entre o céu e o inferno eu caminho na linha",
      "Minha poesia é a voz da periferia que é minha"
    ],
    score: 9.4,
    estilo: "poetico"
  },
  {
    id: 6,
    titulo: "Blindado",
    artista: "MC Titânio",
    versos: [
      "Carro blindado porque a inveja é pesada",
      "Vim do nada agora tenho conta recheada",
      "Tentaram me derrubar mas eu sou antibalas",
      "Deus no comando, não preciso de mais nada"
    ],
    score: 8.1,
    estilo: "gangsta"
  },
  {
    id: 7,
    titulo: "Boom Bap das Antigas",
    artista: "Velho Sábio",
    versos: [
      "Sample de vinil, batida que balança a mente",
      "Rap raiz de verdade, não esse lixo da frente",
      "Microfone na mão desde noventa e três",
      "Respeita a história antes de falar inglês"
    ],
    score: 8.9,
    estilo: "boom_bap"
  },
  {
    id: 8,
    titulo: "Fé na Missão",
    artista: "Pregador do Gueto",
    versos: [
      "Acordei cinco da manhã com fé no coração",
      "Trampo honesto é minha arma contra a tentação",
      "Moleque esperto não se perde na ilusão",
      "O corre é reto, sem atalho nem perdão"
    ],
    score: 8.5,
    estilo: "consciente"
  },
  {
    id: 9,
    titulo: "Ice no Pulso",
    artista: "Jovem Dex",
    versos: [
      "Rolex no pulso brilhando mais que o sol",
      "Cheguei na festa e virei o protocolo",
      "Lean na sprite, diamante no dente",
      "Ostentação é o idioma da minha gente"
    ],
    score: 7.2,
    estilo: "trap"
  },
  {
    id: 10,
    titulo: "Sobrevivente",
    artista: "Negra Rê",
    versos: [
      "Mulher preta e forte, coroa de rainha",
      "Quebraram minhas asas mas a fé ainda é minha",
      "Cada não que eu ouvi virou combustível",
      "Minha existência é ato político visível"
    ],
    score: 9.3,
    estilo: "consciente"
  },
  {
    id: 11,
    titulo: "Madrugada no Fluxo",
    artista: "MC Trovão",
    versos: [
      "Três da manhã e o fluxo tá lotado",
      "Grave no talo, todo mundo embalado",
      "Polícia passou mas não fechou nada não",
      "Porque a favela unida é revolução"
    ],
    score: 7.9,
    estilo: "gangsta"
  },
  {
    id: 12,
    titulo: "Versos Noturnos",
    artista: "Lírico Lunar",
    versos: [
      "Na calmaria da noite eu encontro a razão",
      "Cada estrela é um verso que mora no coração",
      "Metáforas fluem como rio pro mar",
      "Minha alma sangra tinta pra poder te alcançar"
    ],
    score: 9.1,
    estilo: "poetico"
  },
  {
    id: 13,
    titulo: "Legado",
    artista: "Dom Corleone",
    versos: [
      "Construí um império com suor e com visão",
      "Meus filhos não vão passar a fome que eu passei não",
      "Respeito se conquista não se pede emprestado",
      "Quando eu partir vou deixar nome e legado"
    ],
    score: 8.8,
    estilo: "gangsta"
  },
  {
    id: 14,
    titulo: "92 BPM",
    artista: "Mestre Nave",
    versos: [
      "Beat cru na caixa, chimbal no contratempo",
      "Rap de verdade não segue algoritmo",
      "Caneta e papel, não preciso de auto-tune",
      "Quem manja de rap sabe que eu sou outro volume"
    ],
    score: 8.6,
    estilo: "boom_bap"
  },
  {
    id: 15,
    titulo: "Aurora",
    artista: "Fênix Negra",
    versos: [
      "Das cinzas eu renasço toda vez que me queimam",
      "Minhas cicatrizes são medalhas que me enfeitam",
      "O sol nasce primeiro pra quem dorme na laje",
      "Minha história de luta não precisa de homenagem"
    ],
    score: 9.0,
    estilo: "poetico"
  }
];

// Histórico de rimas geradas (em memória)
export const historicoRimas: RapLyric[] = [];

// Helpers
export function getArtistasList(): string[] {
  return [...new Set(rapLyrics.map(r => r.artista))];
}

export function getEstilosList(): string[] {
  return [...new Set(rapLyrics.map(r => r.estilo))];
}

export function getRimasByEstilo(estilo: string): RapLyric[] {
  return rapLyrics.filter(r => r.estilo === estilo);
}

export function getRandomVersos(estilo?: string, count: number = 4): string[] {
  const source = estilo ? getRimasByEstilo(estilo) : rapLyrics;
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  const versos: string[] = [];

  for (const lyric of shuffled) {
    for (const verso of lyric.versos) {
      if (versos.length < count) {
        versos.push(verso);
      }
    }
    if (versos.length >= count) break;
  }

  return versos;
}
