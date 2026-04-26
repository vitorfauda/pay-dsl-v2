import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckout, type AppliedCoupon } from '@/context/CheckoutContext';
import { callEdgeFunction, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { validateCPF, maskCPF, maskPhone, formatBRL } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Check, X, Tag, QrCode, MessageCircle } from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { Badge, Button, Card, inputClass } from '@/components/ui';
import { toast } from 'sonner';

export default function Checkout() {
  const nav = useNavigate();
  const { selectedPlan, userData, setUserData, coupon, setCoupon, setPixData } = useCheckout();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponsEnabled, setCouponsEnabled] = useState(false);

  useEffect(() => {
    if (!selectedPlan) nav('/');
  }, [selectedPlan, nav]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/app_config?key=eq.coupons_enabled&select=value`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        });
        const data = await r.json();
        const enabled = data?.[0]?.value === 'true';
        setCouponsEnabled(enabled);
        if (!enabled && coupon) setCoupon(null);
      } catch {
        setCouponsEnabled(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!selectedPlan) return null;

  const amountCents = coupon ? coupon.final_cents : selectedPlan.price * 100;

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!userData.name.trim() || userData.name.trim().length < 3) err.name = 'Nome muito curto';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) err.email = 'Email inválido';
    if (!validateCPF(userData.cpf)) err.cpf = 'CPF inválido';
    if (userData.whatsapp.replace(/\D/g, '').length < 10) err.whatsapp = 'WhatsApp inválido';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const data = await callEdgeFunction<any>('validate-coupon', {
        code: couponCode.trim().toUpperCase(),
        plan_code: selectedPlan.code,
      });
      if (!data.valid) throw new Error(data.error || 'Cupom inválido');
      const applied: AppliedCoupon = {
        code: data.code || couponCode.toUpperCase(),
        discount_cents: data.discount_cents || 0,
        original_cents: data.original_cents || selectedPlan.price * 100,
        final_cents: data.final_cents || selectedPlan.price * 100,
        discount_type: data.discount_type || 'percent',
        discount_value: data.discount_value || 0,
      };
      setCoupon(applied);
      toast.success(`Cupom ${applied.code} aplicado`);
      setCouponCode('');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    toast.success('Cupom removido');
  };

  const submit = async () => {
    if (!validate()) {
      toast.error('Revise os campos destacados');
      return;
    }
    setLoading(true);
    try {
      let whatsappValid = true;
      try {
        const vw = await callEdgeFunction<any>('validate-whatsapp', {
          phone: userData.whatsapp.replace(/\D/g, ''),
        });
        whatsappValid = vw?.exists !== false;
      } catch {
        whatsappValid = true;
      }

      const pix = await callEdgeFunction<any>('create-pix-payment', {
        plan_code: selectedPlan.code,
        customer_name: userData.name,
        customer_email: userData.email,
        customer_phone: userData.whatsapp.replace(/\D/g, ''),
        customer_cpf: userData.cpf.replace(/\D/g, ''),
        coupon_code: coupon?.code || null,
      });

      if (!pix?.payment_id && !pix?.id) throw new Error('Falha ao gerar PIX');

      const paymentId = pix.payment_id || pix.id;

      setPixData({
        payment_id: String(paymentId),
        qr_code_base64: pix.qr_code_base64,
        qr_code_text: pix.qr_code_text,
        expires_at: pix.expires_at,
        whatsapp_valid: whatsappValid,
        plan_code: selectedPlan.code,
        phone: userData.whatsapp.replace(/\D/g, ''),
        amount: amountCents,
      });

      nav(`/pix/${paymentId}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const hasDiscount = !!coupon && coupon.discount_cents > 0;

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10">
      <button
        onClick={() => nav('/')}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Voltar aos planos
      </button>

      <h1 className="text-3xl font-semibold tracking-tight">Finalize sua compra</h1>
      <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-10">
        Preencha os dados e pague via PIX. A licença chega no WhatsApp.
      </p>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* FORM */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="text-sm font-medium mb-4">Seus dados</div>
            <div className="space-y-3">
              <Field label="Nome completo" error={errors.name}>
                <input
                  value={userData.name}
                  onChange={(e) => setUserData({ name: e.target.value })}
                  placeholder="João da Silva"
                  className={`${inputClass} ${errors.name ? 'border-red-500/50' : ''}`}
                />
              </Field>
              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ email: e.target.value })}
                  placeholder="seu@email.com"
                  className={`${inputClass} ${errors.email ? 'border-red-500/50' : ''}`}
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="CPF" error={errors.cpf}>
                  <input
                    value={userData.cpf}
                    onChange={(e) => setUserData({ cpf: maskCPF(e.target.value) })}
                    maxLength={14}
                    placeholder="000.000.000-00"
                    className={`${inputClass} ${errors.cpf ? 'border-red-500/50' : ''}`}
                  />
                </Field>
                <Field label="WhatsApp" error={errors.whatsapp}>
                  <input
                    value={userData.whatsapp}
                    onChange={(e) => setUserData({ whatsapp: maskPhone(e.target.value) })}
                    maxLength={15}
                    placeholder="(27) 99999-9999"
                    className={`${inputClass} ${errors.whatsapp ? 'border-red-500/50' : ''}`}
                  />
                </Field>
              </div>
              <p className="text-xs text-[var(--color-text-dim)] flex items-center gap-1 mt-1">
                <MessageCircle size={11} /> Vamos enviar sua licença pra esse número
              </p>
            </div>
          </Card>

          {couponsEnabled && (
            <Card className="p-6">
              <div className="text-sm font-medium mb-4 flex items-center gap-2">
                <Tag size={14} /> Cupom de desconto
              </div>
              {coupon ? (
                <div className="flex items-center justify-between gap-3 p-3 rounded-md bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
                  <div>
                    <div className="font-mono font-medium text-[var(--color-primary)]">{coupon.code}</div>
                    <div className="text-xs text-emerald-400/80">
                      {coupon.discount_type === 'percent'
                        ? `${coupon.discount_value}% off`
                        : formatBRL(coupon.discount_cents)}{' '}
                      aplicado
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-1.5 rounded-md text-[var(--color-text-dim)] hover:text-red-400 hover:bg-white/5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="DEV50"
                    className={`${inputClass} font-mono uppercase`}
                    maxLength={30}
                  />
                  <Button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode}
                    variant="secondary"
                    className="shrink-0"
                  >
                    {couponLoading ? <LoaderRing size={14} /> : 'Aplicar'}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* CTA mobile */}
          <div className="lg:hidden">
            <PayButton onClick={submit} loading={loading} amount={amountCents} />
          </div>
        </div>

        {/* SUMMARY */}
        <Card className="p-6 h-fit lg:sticky lg:top-20">
          <div className="text-sm font-medium mb-4">Resumo</div>

          <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
            <div className="size-9 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
              <selectedPlan.icon size={16} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <div className="font-medium text-sm">{selectedPlan.title}</div>
              <div className="text-xs text-[var(--color-text-dim)]">{selectedPlan.subtitle}</div>
            </div>
          </div>

          <div className="py-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Subtotal</span>
              <span className="font-mono">{formatBRL(selectedPlan.price * 100)}</span>
            </div>
            {hasDiscount && coupon && (
              <div className="flex justify-between text-emerald-400">
                <span>Desconto {coupon.code}</span>
                <span className="font-mono">−{formatBRL(coupon.discount_cents)}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[var(--color-border)]">
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-sm text-[var(--color-text-muted)]">Total</span>
              <span className="text-2xl font-semibold tracking-tight">{formatBRL(amountCents)}</span>
            </div>
            <div className="hidden lg:block">
              <PayButton onClick={submit} loading={loading} amount={amountCents} compact />
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[var(--color-border)] space-y-2 text-xs text-[var(--color-text-muted)]">
            <Item>Entrega automática via WhatsApp</Item>
            <Item>Aprovação PIX em segundos</Item>
            <Item>Suporte humano via WhatsApp</Item>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs text-[var(--color-text-muted)] mb-1.5">{label}</div>
      {children}
      {error && (
        <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <X size={10} /> {error}
        </div>
      )}
    </label>
  );
}

function PayButton({ onClick, loading, amount, compact }: any) {
  return (
    <Button onClick={onClick} disabled={loading} size={compact ? 'md' : 'lg'} className="w-full">
      {loading ? (
        <LoaderRing size={16} />
      ) : (
        <>
          <QrCode size={14} /> Pagar {formatBRL(amount)} via PIX <ArrowRight size={14} />
        </>
      )}
    </Button>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Check size={12} className="text-[var(--color-primary)]" />
      <span>{children}</span>
    </div>
  );
}
