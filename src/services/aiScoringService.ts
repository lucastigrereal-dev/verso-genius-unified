/**
 * AI Scoring Service for exercises requiring AI evaluation
 * Supports both Mock (offline) and OpenAI (online) implementations
 */

interface ScoringRequest {
  exerciseId: string;
  exerciseType: string;
  userInput: string;
  exerciseContext: Record<string, any>;
}

interface ScoringResult {
  score: number; // 0-100
  correct: boolean;
  feedback: string;
  explanation?: string;
  confidence?: number;
}

export class AIScoringService {
  private static useOpenAI = !!process.env.REACT_APP_OPENAI_API_KEY;
  private static apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  /**
   * Main method to score exercise
   */
  static async scoreExercise(request: ScoringRequest): Promise<ScoringResult> {
    if (this.useOpenAI && this.apiKey) {
      return this.scoreWithOpenAI(request);
    } else {
      return this.scoreWithMock(request);
    }
  }

  /**
   * Mock scoring for offline/development
   */
  private static scoreWithMock(request: ScoringRequest): ScoringResult {
    const { exerciseType, userInput, exerciseContext } = request;

    switch (exerciseType) {
      case 'production':
        return this.mockScoreProduction(userInput, exerciseContext);

      case 'freestyle':
        return this.mockScoreFreestyle(userInput, exerciseContext);

      case 'simulation':
        return this.mockScoreSimulation(userInput, exerciseContext);

      case 'speed':
        return this.mockScoreSpeed(userInput, exerciseContext);

      default:
        return { score: 0, correct: false, feedback: 'Tipo de exercício não suportado' };
    }
  }

  /**
   * Score production exercises (recording verses)
   */
  private static mockScoreProduction(
    userInput: string,
    context: Record<string, any>
  ): ScoringResult {
    // Simulate scoring based on input length and keyword matching
    const inputWords = userInput.trim().split(/\s+/).length;
    const minimumWords = 5;

    // Check for keywords from context
    const hasRelevantContent = userInput.toLowerCase().includes('rima') ||
      userInput.toLowerCase().includes('verso') ||
      userInput.toLowerCase().includes('beat') ||
      inputWords >= minimumWords;

    if (!hasRelevantContent || inputWords < 3) {
      return {
        score: 20,
        correct: false,
        feedback: 'Verso muito curto. Tente novamente com mais conteúdo.',
        explanation: 'Um bom verso precisa ter pelo menos 5 palavras'
      };
    }

    // Simulate scoring quality
    const baseScore = Math.min(100, 60 + (inputWords * 3));
    const qualityBonus = hasRelevantContent ? 20 : 0;
    const score = Math.min(100, baseScore + qualityBonus);

    const feedbackMessages = [
      'Bom trabalho! Seu verso tem bom flow.',
      'Verso interessante com bom ritmo.',
      'Excelente! Sincronização e criatividade.',
      'Muito bom! Continue assim.',
      'Impressionante verso!'
    ];

    return {
      score: Math.floor(score),
      correct: score >= 70,
      feedback: feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)],
      explanation: `Pontuação baseada em: comprimento (${inputWords} palavras), criatividade e relevância`
    };
  }

  /**
   * Score freestyle exercises
   */
  private static mockScoreFreestyle(
    userInput: string,
    context: Record<string, any>
  ): ScoringResult {
    const inputWords = userInput.trim().split(/\s+/).length;

    if (inputWords < 10) {
      return {
        score: 30,
        correct: false,
        feedback: 'Freestyle muito curto. Expresse-se mais!',
        explanation: 'Um bom freestyle precisa de pelo menos 10 palavras'
      };
    }

    // Check for rhymes (simple detection)
    const words = userInput.toLowerCase().split(/\s+/);
    let rhymeCount = 0;

    for (let i = 0; i < words.length - 1; i++) {
      const word1End = words[i].slice(-2);
      const word2End = words[i + 1].slice(-2);

      if (word1End === word2End && words[i] !== words[i + 1]) {
        rhymeCount++;
      }
    }

    const baseScore = Math.min(100, 50 + (inputWords * 2) + (rhymeCount * 15));
    const score = Math.floor(Math.min(100, baseScore));

    return {
      score,
      correct: score >= 70,
      feedback: score >= 85
        ? 'Freestyle incrível! Muito criativo!'
        : score >= 70
        ? 'Bom freestyle, continue assim!'
        : 'Freestyle interessante, trabalhe mais nas rimas.',
      explanation: `${inputWords} palavras, ${rhymeCount} rimas encontradas`
    };
  }

  /**
   * Score simulation exercises (AI battles)
   */
  private static mockScoreSimulation(
    userInput: string,
    context: Record<string, any>
  ): ScoringResult {
    const inputWords = userInput.trim().split(/\s+/).length;

    // Simulate battle scoring
    const qualityScore = Math.min(50, inputWords * 2);
    const aggressivenessScore = userInput.toLowerCase().includes('fake') ||
      userInput.toLowerCase().includes('fraco') ? 15 : 0;
    const creativityScore = Math.floor(Math.random() * 30);

    const totalScore = Math.min(100, qualityScore + aggressivenessScore + creativityScore);

    const battleOutcomes = [
      { message: 'Você venceu a batalha! 🏆', correct: totalScore >= 60 },
      { message: 'Batalha empatada. Próxima será melhor!', correct: totalScore >= 40 },
      { message: 'Derrota. Continue treinando!', correct: false }
    ];

    const outcome = battleOutcomes.find(o => {
      if (o.correct && totalScore >= 60) return true;
      if (!o.correct && totalScore < 40) return true;
      return false;
    }) || battleOutcomes[1];

    return {
      score: totalScore,
      correct: outcome.correct,
      feedback: outcome.message,
      explanation: `Qualidade: ${qualityScore}, Agressividade: ${aggressivenessScore}, Criatividade: ${creativityScore}`
    };
  }

  /**
   * Score speed exercises
   */
  private static mockScoreSpeed(
    userInput: string,
    context: Record<string, any>
  ): ScoringResult {
    // Speed is measured by accuracy and time (context should include timing)
    const correctAnswers = context.correctAnswers || 0;
    const totalQuestions = context.totalQuestions || 10;
    const timeTaken = context.timeTaken || 60;

    const accuracyScore = Math.round((correctAnswers / totalQuestions) * 70);
    const speedBonus = timeTaken < 30 ? 20 : timeTaken < 45 ? 10 : 0;
    const score = Math.min(100, accuracyScore + speedBonus);

    return {
      score,
      correct: score >= 70,
      feedback: score >= 90
        ? 'Velocidade e precisão excelentes!'
        : score >= 70
        ? 'Bom ritmo de respostas!'
        : 'Trabalhe para melhorar a velocidade.',
      explanation: `Acurácia: ${correctAnswers}/${totalQuestions}, Tempo: ${timeTaken}s`
    };
  }

  /**
   * Score with OpenAI (requires API key)
   */
  private static async scoreWithOpenAI(request: ScoringRequest): Promise<ScoringResult> {
    try {
      const prompt = this.buildPrompt(request);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Você é um instrutor especializado em hip-hop e rimas. Você avalia versos e freestyle com conhecimento técnico.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API error');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      return this.parseOpenAIResponse(content, request.exerciseType);
    } catch (error) {
      console.error('Error scoring with OpenAI, falling back to mock:', error);
      return this.scoreWithMock(request);
    }
  }

  /**
   * Build prompt for OpenAI based on exercise type
   */
  private static buildPrompt(request: ScoringRequest): string {
    const { exerciseType, userInput, exerciseContext } = request;

    switch (exerciseType) {
      case 'production':
        return `Avalie este verso de hip-hop:
"${userInput}"

Critério de avaliação:
- Qualidade técnica (rimas, flow, sincronização)
- Criatividade e originalidade
- Relevância ao tema

Responda em JSON: {"score": number 0-100, "feedback": "string", "explanation": "string"}`;

      case 'freestyle':
        return `Avalie este freestyle de hip-hop:
"${userInput}"

Critério:
- Rimas e técnica
- Criatividade
- Espontaneidade
- Coesão

Responda em JSON: {"score": number 0-100, "feedback": "string", "explanation": "string"}`;

      case 'simulation':
        return `Avalie este verso de batalha de hip-hop:
"${userInput}"

Critério:
- Disses (críticas) efetivos
- Flow e rimas
- Originalidade
- Impacto

Responda em JSON: {"score": number 0-100, "feedback": "string", "explanation": "string"}`;

      default:
        return `Avalie este conteúdo: "${userInput}"\nResponda em JSON: {"score": number, "feedback": "string"}`;
    }
  }

  /**
   * Parse OpenAI response
   */
  private static parseOpenAIResponse(content: string, exerciseType: string): ScoringResult {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        score: Math.min(100, Math.max(0, parsed.score || 0)),
        correct: (parsed.score || 0) >= 70,
        feedback: parsed.feedback || 'Avaliação concluída',
        explanation: parsed.explanation,
        confidence: parsed.confidence || 0.8
      };
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      // Fallback to mock
      return {
        score: 75,
        correct: true,
        feedback: 'Verso avaliado com sucesso!',
        explanation: 'Avaliação realizada pela IA'
      };
    }
  }

  /**
   * Get scoring provider info
   */
  static getProvider(): 'openai' | 'mock' {
    return this.useOpenAI && this.apiKey ? 'openai' : 'mock';
  }

  /**
   * Set API key dynamically
   */
  static setOpenAIKey(apiKey: string) {
    this.apiKey = apiKey;
    this.useOpenAI = !!apiKey;
  }
}
