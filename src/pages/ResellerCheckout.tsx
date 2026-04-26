import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Check, Loader2, CreditCard, QrCode, Lock, ArrowRight, Shield, Sparkles, Calendar, User } from 'lucide-react';
import { callEdgeFunction } from '@/lib/supabase';

interface Plan {
  code: string;
  name: string;
  price_cents: number;
  duration_days: number | null;
  recurring: boolean;
  is_promo?: boolean;
}

interface Reseller {
  id: string;
  name: string;
  slug: string;
}

const PAGARME_PUBLIC_KEY = import.meta.env.VITE_PAGARME_PUBLIC_KEY || 'pk_test_QbRvG1UZ5UQYyjEM';

function formatBRL(cents: number) { return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

export default function ResellerCheckout() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('pix');
  const [installments, setInstallments] = useState(1);

  // Customer fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [pixData, setPixData] = useState<null | { qr_code: string; qr_code_url: string; expires_at: string }>(null);
  const [orderInfo, setOrderInfo] = useState<null | { order_id: string; charge_id: string; amount_cents: number }>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [pollAttempts, setPollAttempts] = useState(0);

  // Polling de status quando há orderInfo (PIX gerado, aguardando pagamento)
  useEffect(() => {
    if (!orderInfo || paymentStatus === 'paid' || paymentStatus === 'failed') return;
    if (pollAttempts > 240) return; // 240 × 5s = 20 min, mais que o expires de 1h é desnecessário

    const t = setTimeout(async () => {
      try {
        const r = await fetch(`https://qtbkvshbmqlszncxlcuc.supabase.co/functions/v1/check-payment-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Ymt2c2hibXFsc3puY3hsY3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjgxNjQsImV4cCI6MjA5MTAwNDE2NH0.HJOr2NCBJ1BwSRppQqoYxsszgrX_BY3UAmqmqPhPiTE`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Ymt2c2hibXFsc3puY3hsY3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjgxNjQsImV4cCI6MjA5MTAwNDE2NH0.HJOr2NCBJ1BwSRppQqoYxsszgrX_BY3UAmqmqPhPiTE',
          },
          body: JSON.stringify({ charge_id: orderInfo.charge_id, gateway: 'pagarme' }),
        });
        const data = await r.json();
        if (data?.status === 'paid' || data?.status === 'approved') {
          setPaymentStatus('paid');
          toast.success('Pagamento confirmado! 🎉');
        } else if (data?.status === 'failed' || data?.status === 'canceled') {
          setPaymentStatus('failed');
        }
      } catch { /* silent */ }
      setPollAttempts(n => n + 1);
    }, 5000);

    return () => clearTimeout(t);
  }, [orderInfo, pollAttempts, paymentStatus]);

  // Lookup reseller + plans
  useEffect(() => {
    if (!slug) { setError('Link inválido'); setLoading(false); return; }
    (async () => {
      try {
        const r = await fetch(`https://qtbkvshbmqlszncxlcuc.supabase.co/functions/v1/lookup-reseller-by-slug?slug=${slug}`);
        const data = await r.json();
        if (!data.ok) {
          if (data.error === 'reseller_kyc_pending') setError('Esse revenda ainda está em verificação. Volte em breve.');
          else if (data.error === 'reseller_inactive') setError('Esse revenda não está ativo no momento.');
          else if (data.error === 'reseller_not_found') setError('Link de venda não encontrado.');
          else setError(data.message || 'Erro ao carregar checkout');
          setLoading(false);
          return;
        }
        setReseller(data.reseller);
        setPlans(data.plans);
        setLoading(false);
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
      }
    })();
  }, [slug]);

  const plan = useMemo(() => plans.find(p => p.code === selectedPlan) || plans[0], [plans, selectedPlan]);

  const installmentOptions = useMemo(() => {
    if (!plan || paymentMethod !== 'credit_card') return [1];
    // Pra 1d/7d: 1x apenas. Mensal: 1x. Anual: até 12x
    if (plan.code === '1dia' || plan.code === '7dias' || plan.code === 'monthly') return [1];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }, [plan, paymentMethod]);

  // Pagar.me fee per installments (efetivo, com antecipação)
  const RATES: Record<number, number> = { 1:0.0323, 2:0.0760, 3:0.0904, 4:0.1097, 5:0.1228, 6:0.1323, 7:0.1564, 8:0.1716, 9:0.1859, 10:0.1999, 11:0.2132, 12:0.2155 };

  const totalCents = useMemo(() => {
    if (!plan) return 0;
    if (paymentMethod === 'pix') return Math.ceil(plan.price_cents / (1 - 0.0099));
    if (installments === 1) return Math.ceil(plan.price_cents / (1 - RATES[1])) + 40;
    const rate = RATES[installments] ?? RATES[12];
    const grossUp = plan.price_cents / (1 - rate);
    const markup = (2.2 / 100) * installments * plan.price_cents;
    return Math.ceil(grossUp + markup);
  }, [plan, paymentMethod, installments]);

  const installmentValue = useMemo(() => Math.ceil(totalCents / installments), [totalCents, installments]);

  // Tokenize card via Pagar.me
  const tokenizeCard = async (): Promise<string> => {
    const [expMonth, expYear] = cardExp.split('/').map(s => s.trim());
    const res = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${PAGARME_PUBLIC_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'card',
        card: {
          number: cardNumber.replace(/\s/g, ''),
          holder_name: cardName.trim(),
          exp_month: parseInt(expMonth || '0'),
          exp_year: parseInt('20' + (expYear || '00').slice(-2)),
          cvv: cardCvv,
        },
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || err.errors?.[0]?.message || 'Cartão inválido');
    }
    const data = await res.json();
    return data.id;
  };

  const submit = async () => {
    if (!plan || !reseller) return;
    if (!name || !email || !document) { toast.error('Preencha seus dados'); return; }
    if (paymentMethod === 'credit_card' && (!cardNumber || !cardName || !cardExp || !cardCvv)) {
      toast.error('Preencha os dados do cartão');
      return;
    }
    setSubmitting(true);
    try {
      let cardToken: string | undefined;
      if (paymentMethod === 'credit_card') {
        cardToken = await tokenizeCard();
      }

      const phoneClean = phone.replace(/\D/g, '');
      const result = await callEdgeFunction('pay-create-checkout', {
        slug,
        plan_code: plan.code,
        payment_method: paymentMethod,
        installments: paymentMethod === 'credit_card' ? installments : 1,
        customer: {
          name,
          email,
          document: document.replace(/\D/g, ''),
          phone_ddd: phoneClean.substring(0, 2),
          phone_number: phoneClean.substring(2),
        },
        card_token: cardToken,
      });

      if (!(result as any).ok) throw new Error((result as any).error || 'Falha no pagamento');

      const r = result as any;
      const orderId = r.order_id;

      // PIX → redireciona pra URL persistente
      if (paymentMethod === 'pix' && orderId) {
        toast.success('PIX gerado!');
        nav(`/pedido/${orderId}`);
        return;
      }

      // Cartão (one-shot) também redireciona pra rota persistente
      if (orderId) {
        toast.success('Pagamento processado!');
        nav(`/pedido/${orderId}`);
        return;
      }

      // Subscription (mensal/anual cartão) — TODO: rota /assinatura/:id
      const sub_id = r.subscription_id;
      if (sub_id) {
        toast.success('Assinatura criada!');
        nav(`/checkout/sucesso?sub=${sub_id}`);
        return;
      }

      toast.error('Resposta inesperada do gateway');
    } catch (e: any) {
      toast.error(e.message || 'Erro no pagamento');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="size-8 animate-spin text-emerald-500" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md text-center">
          <div className="size-16 rounded-2xl bg-red-500/10 grid place-items-center mx-auto mb-4">
            <Shield className="size-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Ops!</h1>
          <p className="text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  // ──── Tela de pagamento confirmado ────
  if (paymentStatus === 'paid') {
    return (
      <div className="min-h-screen p-6 grid place-items-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full text-center">
          <div className="size-20 rounded-full bg-emerald-500/20 grid place-items-center mx-auto mb-5">
            <Check className="size-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Pagamento confirmado! 🎉</h1>
          <p className="text-text-muted mb-6">
            Sua chave de licença foi enviada por <strong>email</strong> e <strong>WhatsApp</strong>.<br />
            Confira sua caixa de entrada (e o spam, por garantia).
          </p>
          <div className="rounded-xl bg-slate-900 p-4 text-left text-xs space-y-1 mb-6">
            <div className="flex justify-between"><span className="text-text-dim">Pedido:</span> <code className="text-emerald-400">{orderInfo?.order_id}</code></div>
            <div className="flex justify-between"><span className="text-text-dim">Cobrança:</span> <code className="text-emerald-400">{orderInfo?.charge_id}</code></div>
            {orderInfo?.amount_cents ? <div className="flex justify-between"><span className="text-text-dim">Valor:</span> <span className="font-semibold">{formatBRL(orderInfo.amount_cents)}</span></div> : null}
          </div>
          <a href="https://devsemlimites.site/instalar" className="cta-neon w-full inline-flex items-center justify-center gap-2">
            Como instalar a extensão <ArrowRight className="size-4" />
          </a>
        </motion.div>
      </div>
    );
  }

  // ──── Tela PIX aguardando pagamento ────
  if (pixData) {
    // Fallback: gera QR via API pública se Pagar.me não devolver qr_code_url
    const qrSrc = pixData.qr_code_url
      || (pixData.qr_code ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(pixData.qr_code)}` : null);

    return (
      <div className="min-h-screen p-6 grid place-items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
          <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/30 p-8 text-center">
            <QrCode className="size-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Pague o PIX</h1>
            <p className="text-text-muted text-sm mb-6">Escaneie o QR ou copie o código abaixo</p>

            {qrSrc ? (
              <img src={qrSrc} alt="QR PIX" className="w-64 h-64 mx-auto rounded-xl bg-white p-2" />
            ) : (
              <div className="w-64 h-64 mx-auto rounded-xl bg-slate-900 border border-emerald-500/20 grid place-items-center">
                <span className="text-xs text-text-dim">QR não disponível</span>
              </div>
            )}

            {pixData.qr_code && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-text-muted hover:text-text-primary">Ver código PIX (copia e cola)</summary>
                <div className="mt-2 bg-slate-900 rounded-lg p-3 break-all text-xs font-mono text-text-muted">
                  {pixData.qr_code}
                </div>
              </details>
            )}

            <div className="mt-4">
              <button
                onClick={() => { if (pixData.qr_code) { navigator.clipboard.writeText(pixData.qr_code); toast.success('Copiado!'); } else { toast.error('Código PIX indisponível'); } }}
                className="cta-neon w-full"
                disabled={!pixData.qr_code}
              >
                {pixData.qr_code ? 'Copiar código PIX' : 'Aguardando código...'}
              </button>

              {/* Status de polling */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="size-3 animate-spin text-emerald-400" />
                <span className="text-text-muted">Verificando pagamento...</span>
              </div>

              <p className="text-xs text-text-dim mt-3">
                Assim que pagar, esta tela atualiza sozinha.<br />
                Sua chave chega por <strong>email</strong> e <strong>WhatsApp</strong> automaticamente. ⚡
              </p>

              {pixData.expires_at && (
                <p className="text-[11px] text-text-dim mt-2">
                  Vence em: {new Date(pixData.expires_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                </p>
              )}

              {/* Order info — pra suporte/rastreio */}
              {orderInfo && (
                <div className="mt-5 pt-4 border-t border-white/5 text-left text-[11px] space-y-1">
                  <p className="text-text-dim uppercase tracking-wider mb-1.5">Dados do pedido (guarde pra suporte)</p>
                  <div className="flex justify-between">
                    <span className="text-text-dim">Pedido:</span>
                    <code className="text-text-muted">{orderInfo.order_id}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-dim">Cobrança:</span>
                    <code className="text-text-muted">{orderInfo.charge_id}</code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_420px] gap-6">
          {/* LEFT: Plan + Customer + Card */}
          <div className="space-y-5">
            {/* Plans */}
            <Section icon={Sparkles} title="Escolha o plano">
              <div className="grid grid-cols-2 gap-2">
                {plans.map(p => (
                  <button
                    key={p.code}
                    onClick={() => setSelectedPlan(p.code)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      selectedPlan === p.code
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-white/10 bg-white/5 hover:border-emerald-500/30'
                    }`}
                  >
                    {p.is_promo && (
                      <span className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full">PROMO 🔥</span>
                    )}
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">{formatBRL(p.price_cents)}</div>
                    <div className="text-[11px] text-text-dim mt-1">
                      {p.recurring ? 'Renova automaticamente' : 'Pagamento único'}
                    </div>
                  </button>
                ))}
              </div>
            </Section>

            {/* Customer */}
            <Section icon={User} title="Seus dados">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" className="input-dsl md:col-span-2" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="seu@email.com" className="input-dsl" />
                <input value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" className="input-dsl" />
                <input value={document} onChange={(e) => setDocument(maskCPF(e.target.value))} placeholder="CPF ou CNPJ" className="input-dsl md:col-span-2" />
              </div>
            </Section>

            {/* Payment method */}
            <Section icon={CreditCard} title="Forma de pagamento">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-3 rounded-xl border-2 transition-all ${paymentMethod === 'pix' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}
                >
                  <QrCode className="size-5 mx-auto mb-1 text-emerald-400" />
                  <div className="text-sm font-medium">PIX</div>
                  <div className="text-[10px] text-text-dim">Aprovação imediata</div>
                </button>
                <button
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-3 rounded-xl border-2 transition-all ${paymentMethod === 'credit_card' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}
                >
                  <CreditCard className="size-5 mx-auto mb-1 text-emerald-400" />
                  <div className="text-sm font-medium">Cartão</div>
                  <div className="text-[10px] text-text-dim">Crédito até 12x</div>
                </button>
              </div>

              {paymentMethod === 'credit_card' && (
                <div className="space-y-3">
                  <input value={cardNumber} onChange={(e) => setCardNumber(maskCardNumber(e.target.value))} placeholder="Número do cartão" className="input-dsl" maxLength={19} />
                  <input value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} placeholder="Nome impresso no cartão" className="input-dsl uppercase" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={cardExp} onChange={(e) => setCardExp(maskExp(e.target.value))} placeholder="MM/AA" className="input-dsl" maxLength={5} />
                    <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="CVV" className="input-dsl" maxLength={4} />
                  </div>
                  {installmentOptions.length > 1 && (
                    <select value={installments} onChange={(e) => setInstallments(parseInt(e.target.value))} className="input-dsl">
                      {installmentOptions.map(n => (
                        <option key={n} value={n}>
                          {n}x de {formatBRL(Math.ceil(totalCents / n))}{n === 1 ? '' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </Section>
          </div>

          {/* RIGHT: Order summary */}
          <aside className="lg:sticky lg:top-6 self-start">
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Calendar className="size-5 text-emerald-400" /> Resumo
              </h3>

              {plan && (
                <>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Plano {plan.name}</span>
                      <span>{formatBRL(plan.price_cents)}</span>
                    </div>
                    {paymentMethod === 'credit_card' && installments > 1 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Taxa parcelamento ({installments}x)</span>
                        <span className="text-text-muted">{formatBRL(totalCents - plan.price_cents)}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-white/10 pt-4 mb-6">
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-bold">Total</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-400">
                          {paymentMethod === 'pix' ? formatBRL(plan.price_cents) : formatBRL(totalCents)}
                        </div>
                        {paymentMethod === 'credit_card' && installments > 1 && (
                          <div className="text-xs text-text-dim">{installments}x de {formatBRL(installmentValue)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={submit}
                disabled={submitting}
                className="cta-neon w-full inline-flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="size-4" />
                    {paymentMethod === 'pix' ? 'Gerar PIX' : 'Pagar agora'}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-1 text-xs text-text-dim">
                <Shield className="size-3" />
                Pagamento criptografado via Pagar.me
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── helpers UI ────────────────────────────────────────────────
function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-950/60 border border-white/5 p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Icon className="size-4 text-emerald-400" /> {title}
      </h3>
      {children}
    </div>
  );
}

function maskCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11) return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return d.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}
function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function maskCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}
function maskExp(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}
