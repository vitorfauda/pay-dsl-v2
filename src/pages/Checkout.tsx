import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCheckout, type AppliedCoupon } from '@/context/CheckoutContext';
import { callEdgeFunction } from '@/lib/supabase';
import { validateCPF, maskCPF, maskPhone, formatBRL } from '@/lib/utils';
import { User, Mail, FileText, Phone, ArrowLeft, ArrowRight, Check, X, Tag, Sparkles, QrCode, MessageCircle } from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { toast } from 'sonner';

export default function Checkout() {
  const nav = useNavigate();
  const { selectedPlan, userData, setUserData, coupon, setCoupon, setPixData } = useCheckout();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (!selectedPlan) nav('/');
  }, [selectedPlan, nav]);

  if (!selectedPlan) return null;

  const amountCents = coupon ? coupon.final_cents : selectedPlan.price * 100;
  const amountDisplay = amountCents / 100;

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
      toast.success(`Cupom ${applied.code} aplicado!`);
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
    if (!validate()) { toast.error('Revise os campos destacados'); return; }
    setLoading(true);
    try {
      // Validação não-bloqueante do WhatsApp
      let whatsappValid = true;
      try {
        const vw = await callEdgeFunction<any>('validate-whatsapp', {
          phone: userData.whatsapp.replace(/\D/g, ''),
        });
        whatsappValid = vw?.exists !== false;
      } catch {
        whatsappValid = true; // Se o serviço falhar, não trava
      }

      // Cria PIX
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

      nav('/pix');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const hasDiscount = !!coupon && coupon.discount_cents > 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 relative">
      <div className="mesh-blob" style={{ width: 400, height: 400, top: '10%', left: '30%', background: '#22c55e' }} />

      <button onClick={() => nav('/')} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-6 transition-colors">
        <ArrowLeft size={14} /> Voltar aos planos
      </button>

      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-2">
        Finalize sua compra
      </motion.h1>
      <p className="text-text-muted text-sm mb-8">Preencha os dados e pague via PIX. A licença chega no WhatsApp.</p>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 relative z-10">
        {/* =========== FORM =========== */}
        <div className="space-y-5">
          <section className="holo-card p-6">
            <h3 className="font-display font-bold mb-4 flex items-center gap-2"><User size={16} className="text-primary" /> Seus dados</h3>
            <div className="space-y-3">
              <Field label="Nome completo" icon={User} error={errors.name}>
                <input value={userData.name} onChange={e => setUserData({ name: e.target.value })} placeholder="João da Silva" className={`input-dsl pl-10 ${errors.name ? 'error' : ''}`} />
              </Field>
              <Field label="Email" icon={Mail} error={errors.email}>
                <input type="email" value={userData.email} onChange={e => setUserData({ email: e.target.value })} placeholder="seu@email.com" className={`input-dsl pl-10 ${errors.email ? 'error' : ''}`} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="CPF" icon={FileText} error={errors.cpf}>
                  <input value={userData.cpf} onChange={e => setUserData({ cpf: maskCPF(e.target.value) })} maxLength={14} placeholder="000.000.000-00" className={`input-dsl pl-10 ${errors.cpf ? 'error' : ''}`} />
                </Field>
                <Field label="WhatsApp" icon={Phone} error={errors.whatsapp}>
                  <input value={userData.whatsapp} onChange={e => setUserData({ whatsapp: maskPhone(e.target.value) })} maxLength={15} placeholder="(27) 99999-9999" className={`input-dsl pl-10 ${errors.whatsapp ? 'error' : ''}`} />
                </Field>
              </div>
              <p className="text-[10px] text-text-dim mt-1 flex items-center gap-1">
                <MessageCircle size={10} /> Vamos enviar sua licença pra esse número
              </p>
            </div>
          </section>

          {/* Cupom */}
          <section className="holo-card p-6">
            <h3 className="font-display font-bold mb-4 flex items-center gap-2"><Tag size={16} className="text-primary" /> Cupom de desconto</h3>
            {coupon ? (
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-primary/10 border border-primary/30">
                <div>
                  <div className="font-mono font-bold text-primary">{coupon.code}</div>
                  <div className="text-xs text-primary/70">
                    {coupon.discount_type === 'percent' ? `${coupon.discount_value}% off` : formatBRL(coupon.discount_cents)} aplicado
                  </div>
                </div>
                <button onClick={removeCoupon} className="p-2 rounded-lg hover:bg-white/10 text-text-muted hover:text-red-400">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Ex: DEV50"
                  className="input-dsl font-mono uppercase"
                  maxLength={30}
                />
                <button onClick={applyCoupon} disabled={couponLoading || !couponCode} className="cta-ghost !px-6 shrink-0 text-sm">
                  {couponLoading ? <LoaderRing size={14} /> : 'Aplicar'}
                </button>
              </div>
            )}
          </section>

          {/* Botão só em mobile (em desktop tá no sidebar) */}
          <div className="lg:hidden">
            <PaySection amount={amountDisplay} hasDiscount={hasDiscount} coupon={coupon} plan={selectedPlan} onPay={submit} loading={loading} />
          </div>
        </div>

        {/* =========== RESUMO =========== */}
        <aside className="lg:sticky lg:top-20 self-start">
          <div className="holo-card holo-permanent p-6">
            <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${selectedPlan.color}15`, border: `1px solid ${selectedPlan.color}35` }}>
                <selectedPlan.icon size={18} style={{ color: selectedPlan.color }} />
              </div>
              <div>
                <div className="font-display font-bold">{selectedPlan.title}</div>
                <div className="text-xs text-text-muted">{selectedPlan.subtitle}</div>
              </div>
            </div>

            <div className="py-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotal</span>
                <span className="font-mono font-tabular">{formatBRL(selectedPlan.price * 100)}</span>
              </div>
              {hasDiscount && coupon && (
                <div className="flex justify-between text-primary">
                  <span>Desconto {coupon.code}</span>
                  <span className="font-mono font-tabular">-{formatBRL(coupon.discount_cents)}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between items-baseline mb-4">
                <span className="font-semibold">Total</span>
                <span className="text-3xl font-display font-bold font-tabular text-primary">{formatBRL(amountCents)}</span>
              </div>
              <div className="hidden lg:block">
                <PaySection amount={amountDisplay} hasDiscount={hasDiscount} coupon={coupon} plan={selectedPlan} onPay={submit} loading={loading} compact />
              </div>
            </div>

            <div className="mt-6 pt-5 border-t space-y-2 text-xs text-text-muted" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2"><Check size={12} className="text-primary" /> Entrega automática via WhatsApp</div>
              <div className="flex items-center gap-2"><Check size={12} className="text-primary" /> Aprovação PIX em segundos</div>
              <div className="flex items-center gap-2"><Check size={12} className="text-primary" /> Suporte humano via WhatsApp</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PaySection({ amount, hasDiscount, coupon, plan, onPay, loading, compact }: any) {
  return (
    <button onClick={onPay} disabled={loading} className="cta-neon w-full flex items-center justify-center gap-2">
      {loading ? <LoaderRing size={20} /> : (
        <span className="relative z-10 flex items-center gap-2">
          <QrCode size={compact ? 14 : 18} /> Pagar R$ {amount.toFixed(2).replace('.', ',')} via PIX <ArrowRight size={compact ? 14 : 18} />
        </span>
      )}
    </button>
  );
}

function Field({ label, icon: Icon, error, children }: any) {
  return (
    <div>
      <label className="block text-sm text-text-muted mb-2">{label}</label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim z-10" />
        {children}
      </div>
      {error && <div className="text-xs text-red-400 mt-1 flex items-center gap-1"><X size={10} /> {error}</div>}
    </div>
  );
}
