import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  CreditCard, QrCode, Lock, ArrowRight, Shield, AlertTriangle,
} from 'lucide-react';
import { callEdgeFunction } from '@/lib/supabase';
import { Badge, Button, Card, inputClass } from '@/components/ui';
import { LoaderRing } from '@/components/LoaderRing';

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

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [phone, setPhone] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) {
      setError('Link inválido');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `https://qtbkvshbmqlszncxlcuc.supabase.co/functions/v1/lookup-reseller-by-slug?slug=${slug}`,
        );
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

  const plan = useMemo(() => plans.find((p) => p.code === selectedPlan) || plans[0], [plans, selectedPlan]);

  const installmentOptions = useMemo(() => {
    if (!plan || paymentMethod !== 'credit_card') return [1];
    if (plan.code === '1dia' || plan.code === '7dias' || plan.code === 'monthly') return [1];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }, [plan, paymentMethod]);

  const RATES: Record<number, number> = {
    1: 0.0323, 2: 0.076, 3: 0.0904, 4: 0.1097, 5: 0.1228, 6: 0.1323,
    7: 0.1564, 8: 0.1716, 9: 0.1859, 10: 0.1999, 11: 0.2132, 12: 0.2155,
  };

  const totalCents = useMemo(() => {
    if (!plan) return 0;
    if (paymentMethod === 'pix') return Math.ceil(plan.price_cents / (1 - 0.0099));
    if (installments === 1) return Math.ceil(plan.price_cents / (1 - RATES[1])) + 40;
    const rate = RATES[installments] ?? RATES[12];
    const grossUp = plan.price_cents / (1 - rate);
    const markup = (2.2 / 100) * installments * plan.price_cents;
    return Math.ceil(grossUp + markup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, paymentMethod, installments]);

  const installmentValue = useMemo(() => Math.ceil(totalCents / installments), [totalCents, installments]);

  const tokenizeCard = async (): Promise<string> => {
    const [expMonth, expYear] = cardExp.split('/').map((s) => s.trim());
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
    if (!name || !email || !document) {
      toast.error('Preencha seus dados');
      return;
    }
    if (paymentMethod === 'credit_card' && (!cardNumber || !cardName || !cardExp || !cardCvv)) {
      toast.error('Preencha os dados do cartão');
      return;
    }
    setSubmitting(true);
    try {
      let cardToken: string | undefined;
      if (paymentMethod === 'credit_card') cardToken = await tokenizeCard();

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
      const orderId = (result as any).order_id;
      const subId = (result as any).subscription_id;

      if (orderId) {
        toast.success(paymentMethod === 'pix' ? 'PIX gerado' : 'Pagamento processado');
        nav(`/pedido/${orderId}`);
        return;
      }
      if (subId) {
        toast.success('Assinatura criada');
        nav(`/checkout/sucesso?sub=${subId}`);
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
    return (
      <div className="min-h-[60vh] grid place-items-center text-[var(--color-text-muted)]">
        <LoaderRing size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="size-12 rounded-md bg-red-500/10 border border-red-500/20 grid place-items-center mx-auto mb-4">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Ops</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10">
      {/* Reseller banner */}
      {reseller && (
        <Card className="mb-6 p-4 flex items-center gap-3">
          <div className="size-9 rounded-full bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 flex items-center justify-center text-sm font-semibold text-[var(--color-primary)]">
            {reseller.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm">
              Indicado por <span className="font-medium">{reseller.name}</span>
            </div>
            <div className="text-xs text-[var(--color-text-dim)] font-mono">/c/{reseller.slug}</div>
          </div>
          <Badge tone="success">Indicação verificada</Badge>
        </Card>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          {/* PLANS */}
          <Card className="p-6">
            <div className="text-sm font-medium mb-4">1 · Escolha o plano</div>
            <div className="grid sm:grid-cols-2 gap-3">
              {plans.map((p) => (
                <button
                  key={p.code}
                  onClick={() => setSelectedPlan(p.code)}
                  className={
                    'relative text-left p-4 rounded-md border transition-all ' +
                    (selectedPlan === p.code
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : 'border-[var(--color-border)] bg-[var(--color-surface-2)]/50 hover:border-[var(--color-border-hover)]')
                  }
                >
                  {p.is_promo && (
                    <div className="absolute -top-2 right-3">
                      <Badge tone="warning">Promo</Badge>
                    </div>
                  )}
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xl font-semibold tracking-tight mt-1">{formatBRL(p.price_cents)}</div>
                  <div className="text-[11px] text-[var(--color-text-dim)] mt-0.5">
                    {p.recurring ? 'Renova automaticamente' : 'Pagamento único'}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* CUSTOMER */}
          <Card className="p-6">
            <div className="text-sm font-medium mb-4">2 · Seus dados</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
                className={inputClass + ' sm:col-span-2'}
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="seu@email.com"
                className={inputClass}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className={inputClass}
              />
              <input
                value={document}
                onChange={(e) => setDocument(maskCPF(e.target.value))}
                placeholder="CPF"
                className={inputClass + ' sm:col-span-2'}
              />
            </div>
          </Card>

          {/* PAYMENT */}
          <Card className="p-6">
            <div className="text-sm font-medium mb-4">3 · Forma de pagamento</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setPaymentMethod('pix')}
                className={
                  'p-3 rounded-md border text-left flex items-center gap-2.5 ' +
                  (paymentMethod === 'pix'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-2)]/50')
                }
              >
                <QrCode size={16} />
                <div>
                  <div className="text-sm font-medium">PIX</div>
                  <div className="text-[11px] text-[var(--color-text-dim)]">Aprovação imediata</div>
                </div>
              </button>
              <button
                onClick={() => setPaymentMethod('credit_card')}
                className={
                  'p-3 rounded-md border text-left flex items-center gap-2.5 ' +
                  (paymentMethod === 'credit_card'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-2)]/50')
                }
              >
                <CreditCard size={16} />
                <div>
                  <div className="text-sm font-medium">Cartão</div>
                  <div className="text-[11px] text-[var(--color-text-dim)]">Crédito até 12x</div>
                </div>
              </button>
            </div>

            {paymentMethod === 'credit_card' && (
              <div className="space-y-3">
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
                  placeholder="Número do cartão"
                  className={inputClass}
                  maxLength={19}
                />
                <input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  placeholder="Nome impresso no cartão"
                  className={inputClass + ' uppercase'}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={cardExp}
                    onChange={(e) => setCardExp(maskExp(e.target.value))}
                    placeholder="MM/AA"
                    className={inputClass}
                    maxLength={5}
                  />
                  <input
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="CVV"
                    className={inputClass}
                    maxLength={4}
                  />
                </div>
                {installmentOptions.length > 1 && (
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(parseInt(e.target.value))}
                    className={inputClass}
                  >
                    {installmentOptions.map((n) => (
                      <option key={n} value={n}>
                        {n}x de {formatBRL(Math.ceil(totalCents / n))}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* SUMMARY */}
        <Card className="p-6 h-fit lg:sticky lg:top-20">
          <div className="text-sm font-medium mb-4">Resumo</div>
          {plan && (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Plano {plan.name}</span>
                  <span className="font-mono">{formatBRL(plan.price_cents)}</span>
                </div>
                {paymentMethod === 'credit_card' && installments > 1 && (
                  <div className="flex justify-between text-[var(--color-text-muted)]">
                    <span>Taxa parcelamento ({installments}x)</span>
                    <span className="font-mono">{formatBRL(totalCents - plan.price_cents)}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-[var(--color-border)] mt-4 pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-[var(--color-text-muted)]">Total</span>
                  <div className="text-right">
                    <div className="text-2xl font-semibold tracking-tight">
                      {paymentMethod === 'pix' ? formatBRL(plan.price_cents) : formatBRL(totalCents)}
                    </div>
                    {paymentMethod === 'credit_card' && installments > 1 && (
                      <div className="text-xs text-[var(--color-text-dim)]">
                        {installments}x de {formatBRL(installmentValue)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <Button onClick={submit} disabled={submitting} size="lg" className="w-full mt-5">
            {submitting ? (
              <LoaderRing size={16} />
            ) : (
              <>
                <Lock size={14} /> {paymentMethod === 'pix' ? 'Gerar PIX' : 'Pagar agora'}
                <ArrowRight size={14} />
              </>
            )}
          </Button>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-dim)]">
            <Shield size={11} /> Pagamento criptografado via Pagar.me
          </div>
        </Card>
      </div>
    </div>
  );
}

function maskCPF(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11)
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}
function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function maskCardNumber(v: string) {
  return v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}
function maskExp(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}
