import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Zap, Shield, Rocket, MessageCircle, Lock, Star, ChevronDown } from 'lucide-react';
import { Hero3D } from '@/components/Hero3D';
import { PLANS } from '@/lib/plans';
import { useCheckout } from '@/context/CheckoutContext';
import { useState } from 'react';
import type { Plan } from '@/lib/plans';

const features = [
  { icon: Zap, title: 'Prompts ilimitados', desc: 'Crie e itere sem contar quantas vezes.' },
  { icon: Lock, title: 'Não consome créditos', desc: 'Sua conta Lovable fica intacta.' },
  { icon: Rocket, title: 'Instalação em 2 min', desc: 'Arrasta no Chrome e pronto.' },
  { icon: Shield, title: 'Pagamento único', desc: 'Licença vitalícia disponível.' },
];

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
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden min-h-[80vh] md:min-h-[88vh] flex items-center py-12 sm:py-16">
        <div className="mesh-blob" style={{ width: 600, height: 600, top: '-10%', left: '-10%', background: '#22c55e' }} />
        <div className="mesh-blob" style={{ width: 500, height: 500, bottom: '-10%', right: '-5%', background: '#22d3ee' }} />

        <div className="hidden md:block">
          <Hero3D />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl"
          >
            <div className="badge-pulse mb-5">Oferta de lançamento</div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.05] mb-5">
              Lovable<br />
              <span className="text-gradient">sem limites</span>
            </h1>

            <p className="text-base sm:text-lg text-text-muted mb-6 leading-relaxed">
              A extensão oficial que libera <strong className="text-text-primary">prompts ilimitados</strong> no Lovable.dev.
              Ative em 2 minutos, pague via PIX e receba a licença no WhatsApp.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <a href="#planos" className="cta-neon inline-flex items-center gap-2">
                <span className="relative z-10 flex items-center gap-2">
                  Ver planos <ArrowRight size={18} />
                </span>
              </a>
              <a href="#faq" className="cta-ghost">Dúvidas?</a>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex gap-1 text-accent-gold">
                {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="currentColor" />)}
              </div>
              <span className="text-text-muted">+800 licenças vendidas</span>
            </div>
          </motion.div>

          <div className="md:hidden relative h-56">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-40 w-40 rounded-full bg-gradient-to-br from-primary to-accent-cyan animate-float shadow-2xl shadow-primary/50" style={{ filter: 'blur(2px)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="section-pad">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="holo-card p-5 text-center"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <f.icon size={18} className="text-primary" />
                </div>
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-text-muted">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PLANOS ============ */}
      <section id="planos" className="section-pad relative">
        <div className="mesh-blob" style={{ width: 700, height: 700, top: '20%', left: '40%', background: '#22c55e', opacity: 0.08 }} />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <div className="text-sm font-semibold text-primary mb-3">ESCOLHA SEU PLANO</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4">
              Comece agora, pague depois
            </h2>
            <p className="text-text-muted">
              PIX com aprovação imediata. Ativação em segundos.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {PLANS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`holo-card p-6 relative flex flex-col ${p.popular ? 'holo-permanent lg:scale-105' : ''} ${p.highlight ? 'ring-1 ring-primary/30' : ''}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold bg-gradient-to-r from-accent-gold to-amber-500 text-void shadow-lg shadow-amber-500/50 whitespace-nowrap">
                    {p.badge}
                  </div>
                )}

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
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-text-muted mt-8 flex items-center gap-4 justify-center flex-wrap">
            <span className="flex items-center gap-1.5"><Shield size={12} className="text-primary" /> Pagamento Mercado Pago</span>
            <span className="flex items-center gap-1.5"><Lock size={12} className="text-primary" /> SSL + dados criptografados</span>
            <span className="flex items-center gap-1.5"><MessageCircle size={12} className="text-primary" /> Entrega via WhatsApp</span>
          </p>
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
