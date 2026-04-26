import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Check, MessageCircle, Lock, Shield, ChevronDown } from 'lucide-react';
import { PLANS } from '@/lib/plans';
import { useCheckout } from '@/context/CheckoutContext';
import type { Plan } from '@/lib/plans';
import { Badge, Button, ButtonLink, Card } from '@/components/ui';

const faqs = [
  { q: 'Como recebo a licença após pagar?', a: 'Em até 30 segundos via WhatsApp: sua chave + link pra baixar a extensão + vídeo tutorial.' },
  { q: 'Funciona em conta Free do Lovable?', a: 'Sim. Não precisa ter PRO. Funciona em qualquer conta (Free, PRO ou Team).' },
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
      {/* HERO + PLANOS */}
      <section className="max-w-[1100px] mx-auto px-6 pt-16 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge tone="success">
            <span className="size-1.5 rounded-full bg-emerald-400 inline-block" />
            Escolha seu plano
          </Badge>
          <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            Lovable <span className="text-[var(--color-primary)]">sem limites</span>
          </h1>
          <p className="mt-5 text-base text-[var(--color-text-muted)]">
            Pague via PIX ou cartão e receba sua licença no WhatsApp em segundos.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={
                'rounded-lg border p-6 flex flex-col ' +
                (p.popular
                  ? 'border-[var(--color-primary)]/40 bg-[var(--color-surface)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)]/60')
              }
            >
              {p.popular && p.badge && (
                <div className="mb-3">
                  <Badge tone="success">{p.badge}</Badge>
                </div>
              )}

              <div className="text-sm text-[var(--color-text-muted)]">{p.title}</div>
              <div className="mt-2 flex items-baseline gap-2">
                {p.old && <span className="text-sm text-[var(--color-text-dim)] line-through">R$ {p.old}</span>}
                <span className="text-3xl font-semibold tracking-tight">R$ {p.price}</span>
                {p.id !== 'lifetime' && (
                  <span className="text-xs text-[var(--color-text-dim)]">
                    {p.id === 'daily' ? '/dia' : p.id === 'weekly' ? '/semana' : '/mês'}
                  </span>
                )}
              </div>
              {p.id === 'lifetime' && (
                <div className="mt-1 text-xs text-[var(--color-primary)] font-medium">Pagamento único</div>
              )}
              <div className="mt-1 text-xs text-[var(--color-text-dim)]">{p.subtitle}</div>

              <ul className="mt-5 space-y-1.5 flex-1">
                {p.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <Check size={12} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => choosePlan(p)}
                variant={p.popular ? 'primary' : 'secondary'}
                className="w-full mt-5"
              >
                Escolher este
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-10 text-xs text-[var(--color-text-dim)] flex flex-wrap justify-center items-center gap-x-5 gap-y-2">
          <span className="flex items-center gap-1.5"><Shield size={11} /> Pagamento seguro</span>
          <span className="flex items-center gap-1.5"><Lock size={11} /> Dados criptografados</span>
          <span className="flex items-center gap-1.5"><MessageCircle size={11} /> Entrega via WhatsApp</span>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-[800px] mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <Badge>FAQ</Badge>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">Dúvidas frequentes</h2>
        </div>

        <div className="space-y-2">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <Card key={i}>
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium pr-4">{f.q}</span>
                  <ChevronDown
                    size={16}
                    className={
                      'shrink-0 transition-transform ' +
                      (open ? 'rotate-180 text-[var(--color-primary)]' : 'text-[var(--color-text-dim)]')
                    }
                  />
                </button>
                {open && (
                  <div className="px-5 pb-5 text-sm text-[var(--color-text-muted)] leading-relaxed">{f.a}</div>
                )}
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <p className="text-sm text-[var(--color-text-muted)] mb-3">Ainda com dúvida?</p>
          <ButtonLink
            href="https://wa.me/5527992660736"
            target="_blank"
            rel="noreferrer"
            variant="secondary"
          >
            <MessageCircle size={14} /> Falar no WhatsApp
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
