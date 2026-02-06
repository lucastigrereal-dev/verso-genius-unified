/**
 * Premium Upsell Modal
 * Modal para upgrade para planos Pro e Elite
 */

import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Check, Zap, Shield, Sparkles } from 'lucide-react'

interface PremiumUpsellProps {
  isOpen: boolean
  onClose: () => void
  onSelectPlan: (tier: 'pro' | 'elite') => void
  highlightedTier?: 'pro' | 'elite'
}

export function PremiumUpsell({
  isOpen,
  onClose,
  onSelectPlan,
  highlightedTier = 'elite'
}: PremiumUpsellProps) {
  if (!isOpen) return null

  const plans = {
    pro: {
      name: 'Pro',
      price: 19.90,
      color: 'blue',
      gradient: 'from-blue-600 to-blue-800',
      icon: <Zap size={48} className="text-blue-300" />,
      features: [
        'Exercícios ilimitados',
        '20 beats disponíveis',
        'Sem anúncios',
        'Gravações ilimitadas',
        'Estatísticas avançadas',
        'Suporte prioritário'
      ]
    },
    elite: {
      name: 'Elite',
      price: 39.90,
      color: 'purple',
      gradient: 'from-purple-600 to-pink-600',
      icon: <Crown size={48} className="text-yellow-300" />,
      features: [
        'Tudo do Pro',
        'Feedback IA ilimitado',
        'Batalhas ao vivo ilimitadas',
        'Análise avançada de flow',
        'Cosméticos exclusivos',
        'Acesso antecipado a features',
        'Badge Elite no perfil',
        'XP boost +50%'
      ],
      badge: '🔥 MELHOR VALOR'
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-dark-200 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-gold-400/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 border-b border-dark-400">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-dark-400 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="inline-block mb-4"
              >
                <Crown size={64} className="text-gold-400" />
              </motion.div>

              <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                Desbloqueie seu Potencial
              </h2>
              <p className="text-gray-400">
                Escolha o plano perfeito para sua jornada no rap
              </p>
            </div>
          </div>

          {/* Free Tier (for comparison) */}
          <div className="p-6 border-b border-dark-400 bg-dark-300">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-400 mb-1">Plano Gratuito</h3>
                  <p className="text-sm text-gray-500">Seu plano atual</p>
                </div>
                <div className="text-2xl font-bold text-gray-400">R$ 0</div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Check size={16} className="text-gray-600" />
                  <span>5 exercícios/dia</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Check size={16} className="text-gray-600" />
                  <span>3 beats básicos</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Check size={16} className="text-gray-600" />
                  <span>Anúncios</span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Plans */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pro Plan */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`rounded-lg overflow-hidden border-2 ${
                  highlightedTier === 'pro'
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'border-dark-400'
                }`}
              >
                <div className={`bg-gradient-to-br ${plans.pro.gradient} p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    {plans.pro.icon}
                  </div>

                  <h3 className="text-3xl font-bold mb-2">{plans.pro.name}</h3>

                  <div className="mb-6">
                    <div className="text-4xl font-bold mb-1">
                      R$ {plans.pro.price.toFixed(2)}
                    </div>
                    <div className="text-sm opacity-80">por mês</div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plans.pro.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check size={20} className="text-blue-300 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => onSelectPlan('pro')}
                    className="w-full py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                  >
                    Assinar Pro
                  </button>

                  <p className="text-xs text-center mt-3 opacity-70">
                    Cancele a qualquer momento
                  </p>
                </div>
              </motion.div>

              {/* Elite Plan */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`rounded-lg overflow-hidden border-4 ${
                  highlightedTier === 'elite'
                    ? 'border-yellow-400 shadow-2xl shadow-purple-500/30'
                    : 'border-purple-500'
                } relative`}
              >
                {/* Badge */}
                {plans.elite.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-yellow-400 text-purple-900 px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                      {plans.elite.badge}
                    </div>
                  </div>
                )}

                <div className={`bg-gradient-to-br ${plans.elite.gradient} p-6 relative overflow-hidden`}>
                  {/* Animated background sparkles */}
                  <motion.div
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Sparkles size={200} className="text-white/10" />
                  </motion.div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      {plans.elite.icon}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                      >
                        <Sparkles size={32} className="text-yellow-300" />
                      </motion.div>
                    </div>

                    <h3 className="text-3xl font-bold mb-2 flex items-center gap-2">
                      {plans.elite.name}
                      <Shield size={24} className="text-yellow-300" />
                    </h3>

                    <div className="mb-6">
                      <div className="text-4xl font-bold mb-1">
                        R$ {plans.elite.price.toFixed(2)}
                      </div>
                      <div className="text-sm opacity-80">por mês</div>
                      <div className="text-xs text-yellow-300 mt-1">
                        Economia de 50% vs. comprar features separadas
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plans.elite.features.map((feature, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-2"
                        >
                          <Check size={20} className="text-yellow-300 flex-shrink-0 mt-0.5" />
                          <span className="text-sm font-medium">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>

                    <button
                      onClick={() => onSelectPlan('elite')}
                      className="w-full py-4 bg-yellow-400 text-purple-900 rounded-lg font-bold hover:bg-yellow-300 transition-colors text-lg shadow-lg"
                    >
                      Assinar Elite
                    </button>

                    <p className="text-xs text-center mt-3 opacity-70">
                      Cancele a qualquer momento • Garantia de 7 dias
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Additional Benefits */}
            <div className="mt-8 grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-dark-300 rounded-lg p-4">
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="font-bold mb-1">Progresso Mais Rápido</h4>
                <p className="text-xs text-gray-400">
                  Exercícios ilimitados para treinar quando quiser
                </p>
              </div>

              <div className="bg-dark-300 rounded-lg p-4">
                <div className="text-3xl mb-2">🤖</div>
                <h4 className="font-bold mb-1">IA Avançada</h4>
                <p className="text-xs text-gray-400">
                  Feedback inteligente para melhorar suas rimas
                </p>
              </div>

              <div className="bg-dark-300 rounded-lg p-4">
                <div className="text-3xl mb-2">🏆</div>
                <h4 className="font-bold mb-1">Status Elite</h4>
                <p className="text-xs text-gray-400">
                  Destaque-se com badges e cosméticos exclusivos
                </p>
              </div>
            </div>

            {/* Social Proof */}
            <div className="mt-8 bg-gradient-to-r from-dark-300 to-dark-400 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                {[...Array(5)].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-2xl"
                  >
                    ⭐
                  </motion.span>
                ))}
              </div>

              <p className="text-lg font-bold mb-2">
                "Melhor investimento que fiz para meu rap!"
              </p>
              <p className="text-sm text-gray-400">
                — MC Léo, assinante Elite há 3 meses
              </p>

              <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <div>
                  <div className="text-2xl font-bold text-purple-400">2,847</div>
                  <div className="text-xs text-gray-400">Assinantes Premium</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gold-400">4.9</div>
                  <div className="text-xs text-gray-400">Avaliação Média</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">98%</div>
                  <div className="text-xs text-gray-400">Recomendariam</div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-bold text-center mb-4">Perguntas Frequentes</h3>

              <details className="bg-dark-300 rounded-lg p-4">
                <summary className="font-bold cursor-pointer">
                  Posso cancelar a qualquer momento?
                </summary>
                <p className="text-sm text-gray-400 mt-2">
                  Sim! Você pode cancelar sua assinatura a qualquer momento, sem multas ou taxas.
                  Você continuará tendo acesso aos benefícios até o final do período pago.
                </p>
              </details>

              <details className="bg-dark-300 rounded-lg p-4">
                <summary className="font-bold cursor-pointer">
                  Como funciona a garantia de 7 dias?
                </summary>
                <p className="text-sm text-gray-400 mt-2">
                  Se você não ficar satisfeito nos primeiros 7 dias, devolvemos 100% do seu dinheiro,
                  sem perguntas. Basta entrar em contato com nosso suporte.
                </p>
              </details>

              <details className="bg-dark-300 rounded-lg p-4">
                <summary className="font-bold cursor-pointer">
                  Posso mudar de plano depois?
                </summary>
                <p className="text-sm text-gray-400 mt-2">
                  Sim! Você pode fazer upgrade ou downgrade entre Pro e Elite a qualquer momento.
                  Ajustamos o valor proporcionalmente.
                </p>
              </details>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
