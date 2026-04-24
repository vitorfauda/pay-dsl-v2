import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, MessageCircle, Lock, Shield, ChevronDown } from 'lucide-react';
import { PLANS } from '@/lib/plans';
import { useCheckout } from '@/context/CheckoutContext';
import { useState } from 'react';
import type { Plan } from '@/lib/plans';

const faqs = [
  { q: 'Como recebo a licença após pagar?', a: 'Em até 30 segundos via WhatsApp: sua chave + link pra baixar a extensão + vídeo tutorial.' },
  { q: 'Funciona em conta Free do Lovable?', a: 'Sim! Não precisa ter PRO. Funciona em qualquer conta (Free, PRO ou Team).' },
  { q: 'É seguro? Não vou ser banido?', a: 'Zero relatos de banimento. A extensão opera no seu browser e não modifica sua conta Lovable.' },
  { q: 'Posso pedir reembolso?', a: 'Sim, em até 7 dias após a compra se a licença não tiver sido ativada.' },
  { q: 'Qual a diferença entre os planos?', a: 'Todos liberam prompts ilimitados. A diferença é só a duração: 1 dia, 7 dias, 30 dias ou vitalício (pagamento único).' },
];

export default function Landing() {
  const nav = useNavigate();
  const { setSelectedPlan } = useCheckout();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const choosePlan = (p: Plan) => {
    setSelectedPlan(p);
    nav('/checkout');
  };

  return (
    <>
      {/* ============ PLANOS ============ */}
      <section id="planos" className="relative pt-10 sm:pt-16 pb-16">
        <div className="mesh-blob" style={{ width: 600, height: 600, top: '-10%', left: '-10%', background: '#22c55e' }} />
        <div className="mesh-blob" style={{ width: 500, height: 500, bottom: '0%', right: '-5%', background: '#22d3ee' }} />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-10 sm:mb-14"
          >
            <div className="badge-pulse mb-5">Escolha seu plano</div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 leading-tight">
              Lovable <span className="text-gradient">sem limites</span>
            </h1>
            <p className="text-base sm:text-lg text-text-muted">
              Pague via PIX e receba sua licença no WhatsApp em segundos.
            </p>
          </motion.div>

          {/* Grid de planos */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 max-w-6xl mx-auto pt-6">
            {PLANS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative"
              >
                {/* Badge POPULAR fora do holo-card pra não ser cortado pelo overflow */}
                {p.popular && p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 rounded-full px-4 py-1 text-[10px] font-bold bg-gradient-to-r from-accent-gold to-amber-500 text-void shadow-lg shadow-amber-500/50 whitespace-nowrap">
                    {p.badge}
                  </div>
                )}

                <div
                  className={`holo-card p-6 h-full flex flex-col ${p.popular ? 'holo-permanent lg:scale-105' : ''} ${p.highlight ? 'ring-1 ring-primary/30' : ''}`}
                >
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${p.color}15`, border: `1px solid ${p.color}35` }}>
                    <p.icon size={18} style={{ color: p.color }} />
                  </div>

                  <div className="font-display font-bold text-lg mb-0.5">{p.title}</div>
                  <div className="text-xs text-text-muted mb-4">{p.subtitle}</div>

                  <div className="mb-5">
                    {p.old && (
                      <div className="text-xs text-text-dim line-through">de R$ {p.old}</div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-display font-bold font-tabular">R${p.price}</span>
                      {p.id !== 'lifetime' && <span className="text-text-muted text-xs">{p.id === 'daily' ? '/dia' : p.id === 'weekly' ? '/semana' : '/mês'}</span>}
                    </div>
                    {p.id === 'lifetime' && <div className="text-[10px] text-primary mt-1 font-semibold">PAGAMENTO ÚNICO</div>}
                  </div>

                  <ul className="space-y-1.5 mb-5 flex-1">
                    {p.features.map((feat, j) => (
                      <li key={j} className="flex items-start gap-1.5 text-xs">
                        <Check size={12} className="text-primary mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => choosePlan(p)}
                    className={p.popular || p.highlight ? 'cta-neon w-full text-sm' : 'cta-ghost w-full text-sm'}
                  >
                    <span className="relative z-10">Escolher este</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-xs text-text-muted flex items-center gap-4 justify-center flex-wrap">
              <span className="flex items-center gap-1.5"><Shield size={12} className="text-primary" /> Pagamento Mercado Pago</span>
              <span className="flex items-center gap-1.5"><Lock size={12} className="text-primary" /> Dados criptografados</span>
              <span className="flex items-center gap-1.5"><MessageCircle size={12} className="text-primary" /> Entrega via WhatsApp</span>
            </p>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="section-pad">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="text-sm font-semibold text-primary mb-3">FAQ</div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold">Perguntas frequentes</h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="holo-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold text-sm sm:text-base pr-4">{f.q}</span>
                  <ChevronDown size={18} className={`shrink-0 transition-transform ${openFaq === i ? 'rotate-180 text-primary' : 'text-text-muted'}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-sm text-text-muted">{f.a}</div>
                </motion.div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-sm text-text-muted mb-4">Ainda com dúvida?</p>
            <a href="https://wa.me/5527992660736" target="_blank" rel="noreferrer" className="cta-ghost inline-flex items-center gap-2">
              <MessageCircle size={16} /> Falar com a gente
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
