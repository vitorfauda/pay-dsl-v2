import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCheckout } from '@/context/CheckoutContext';
import { callEdgeFunction, checkPaymentStatus } from '@/lib/supabase';
import { copyToClipboard, formatBRL, maskPhone } from '@/lib/utils';
import { getPlanById, PLANS } from '@/lib/plans';
import {
  Copy, Check, PartyPopper, Key as KeyIcon, Download, BookOpen, Users as UsersIcon,
  AlertTriangle, MessageCircle, ArrowLeft, Save, X, Clock,
} from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { toast } from 'sonner';

type Status = 'pending' | 'approved' | 'rejected' | 'cancelled';

export default function Pix() {
  const nav = useNavigate();
  const { paymentId: paramId } = useParams<{ paymentId?: string }>();
  const { pixData, setPixData, selectedPlan, setSelectedPlan, reset } = useCheckout();

  const [status, setStatus] = useState<Status>('pending');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [restoring, setRestoring] = useState(false);
  const pollRef = useRef<number | null>(null);

  // WhatsApp fix banner
  const [showWaFix, setShowWaFix] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  // Reidrata estado se url tem id mas context vazio ou com id diferente
  useEffect(() => {
    if (!paramId) {
      // sem id na URL — se tem pixData no context, substitui URL
      if (pixData?.payment_id) {
        nav(`/pix/${pixData.payment_id}`, { replace: true });
      } else {
        nav('/');
      }
      return;
    }

    if (pixData && pixData.payment_id === paramId) return; // ja hidratado

    // Precisa buscar do banco
    setRestoring(true);
    (async () => {
      try {
        const data = await callEdgeFunction<any>('get-pix-payment', { payment_id: paramId });
        if (!data?.ok) throw new Error(data?.error || 'Pagamento nao encontrado');

        // Acha o plan pelo code pra reconstruir selectedPlan
        const plan = PLANS.find(p => p.code === data.plan_code) || null;
        if (plan) setSelectedPlan(plan);

        setPixData({
          payment_id: String(data.payment_id),
          qr_code_base64: data.qr_code_base64,
          qr_code_text: data.qr_code_text,
          expires_at: data.expires_at,
          plan_code: data.plan_code,
          phone: data.customer_phone,
          amount: data.amount_cents,
          whatsapp_valid: true, // assume valido na reidratacao
        });

        // Se ja foi pago no banco, vai direto pro sucesso
        if (data.status === 'approved' || data.status === 'paid') {
          setStatus('approved');
        }
      } catch (e) {
        toast.error('Pagamento não encontrado ou expirou');
        setTimeout(() => nav('/'), 1500);
      } finally {
        setRestoring(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramId]);

  useEffect(() => {
    if (pixData?.whatsapp_valid === false) {
      setShowWaFix(true);
      setNewPhone(maskPhone(pixData.phone || ''));
    }
  }, [pixData]);

  // Polling de status a cada 3s
  useEffect(() => {
    if (!pixData?.payment_id) return;
    if (status !== 'pending') return;

    const poll = async () => {
      try {
        const result = await checkPaymentStatus(pixData.payment_id);
        if (result.status === 'approved') {
          setStatus('approved');
          toast.success('Pagamento confirmado! 🎉');
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (result.status === 'rejected' || result.status === 'cancelled') {
          setStatus(result.status as Status);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch (e) {
        console.error('poll error', e);
      }
    };
    pollRef.current = window.setInterval(poll, 3000);
    poll();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pixData, status]);

  // Countdown (expira_at)
  useEffect(() => {
    if (!pixData?.expires_at) return;
    const update = () => {
      const ms = new Date(pixData.expires_at!).getTime() - Date.now();
      setTimeLeft(Math.max(0, Math.floor(ms / 1000)));
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => clearInterval(id);
  }, [pixData]);

  if (restoring || !pixData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-20 min-h-[60vh] flex flex-col items-center justify-center">
        <LoaderRing size={40} />
        <p className="text-sm text-text-muted mt-4">Carregando seu pagamento...</p>
      </div>
    );
  }

  const handleCopy = async () => {
    await copyToClipboard(pixData.qr_code_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Código PIX copiado!');
  };

  const saveNewPhone = async () => {
    const digits = newPhone.replace(/\D/g, '');
    if (digits.length < 10) { toast.error('Número inválido'); return; }
    setSavingPhone(true);
    try {
      // Valida
      const valid = await callEdgeFunction<any>('validate-whatsapp', { phone: digits });
      if (valid?.exists === false) {
        toast.error('Esse número também não foi encontrado no WhatsApp. Confira novamente.');
        return;
      }
      // Atualiza
      await callEdgeFunction('update-pix-phone', { payment_id: pixData.payment_id, phone: digits });
      setPixData({ ...pixData, phone: digits, whatsapp_valid: true });
      setShowWaFix(false);
      toast.success('Número corrigido!');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingPhone(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ============ TELA DE SUCESSO ============
  if (status === 'approved') {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="holo-card holo-permanent max-w-2xl mx-auto p-8 sm:p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent-cyan/10" />
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-green-500 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-primary/50"
            >
              <PartyPopper size={36} className="text-void" />
            </motion.div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-3">
              Pagamento <span className="text-gradient">confirmado!</span>
            </h1>
            <p className="text-text-muted mb-8">
              Sua licença foi gerada. Verifique seu WhatsApp — enviamos tudo pra lá em segundos.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 text-left mb-8">
              {[
                { icon: KeyIcon, label: 'Chave de licença', desc: 'DSL-XXXX-XXXX-XXXX' },
                { icon: Download, label: 'Arquivo ZIP', desc: 'Extensão pronta pra instalar' },
                { icon: BookOpen, label: 'Tutorial em vídeo', desc: 'Instalação em 2 min' },
                { icon: UsersIcon, label: 'Grupo VIP', desc: 'Suporte + atualizações' },
              ].map((it, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <it.icon size={14} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{it.label}</div>
                    <div className="text-xs text-text-muted">{it.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="https://wa.me/5527992660736"
              target="_blank"
              rel="noreferrer"
              className="cta-neon inline-flex items-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                <MessageCircle size={16} /> Abrir WhatsApp
              </span>
            </a>

            <button
              onClick={() => { reset(); nav('/'); }}
              className="block mx-auto mt-6 text-xs text-text-muted hover:text-primary"
            >
              Voltar ao início
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ============ TELA PIX PENDENTE ============
  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <button onClick={() => nav('/checkout')} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-6 transition-colors">
        <ArrowLeft size={14} /> Voltar
      </button>

      {/* WhatsApp fix banner */}
      {showWaFix && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="holo-card holo-permanent mb-6 p-5 border-2" style={{ borderColor: 'rgba(251,191,36,0.4)' }}>
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle size={18} className="text-accent-gold mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold mb-1">Confirme seu WhatsApp</h4>
              <p className="text-sm text-text-muted">Não encontramos esse número no WhatsApp. Se estiver errado, corrija agora — sua licença vai ser enviada por lá.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={newPhone}
              onChange={e => setNewPhone(maskPhone(e.target.value))}
              maxLength={15}
              placeholder="(27) 99999-9999"
              className="input-dsl flex-1"
            />
            <button onClick={saveNewPhone} disabled={savingPhone} className="cta-neon flex items-center justify-center gap-2 !py-3 text-sm">
              {savingPhone ? <LoaderRing size={14} /> : <span className="relative z-10 flex items-center gap-2"><Save size={12} /> Corrigir</span>}
            </button>
            <button onClick={() => setShowWaFix(false)} className="cta-ghost !py-3 text-sm sm:!px-4"><X size={14} /></button>
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-[1fr_340px] gap-6 max-w-5xl mx-auto">
        {/* QR code + código */}
        <div className="holo-card holo-permanent p-6 sm:p-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-display font-bold mb-1">PIX gerado</h1>
          <p className="text-text-muted text-sm mb-6">Escaneie ou copie o código. Aprovação automática em segundos.</p>

          {pixData.qr_code_base64 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block p-4 rounded-2xl bg-white mb-5 shadow-2xl shadow-primary/20"
            >
              <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code PIX" className="w-56 h-56 sm:w-64 sm:h-64" />
            </motion.div>
          )}

          <div className="mb-5">
            <label className="block text-xs text-text-muted mb-2">Ou copie o PIX copia-e-cola:</label>
            <div className="flex gap-2">
              <input readOnly value={pixData.qr_code_text} className="input-dsl font-mono text-xs" />
              <button onClick={handleCopy} className={`cta-ghost !px-4 shrink-0 transition-all ${copied ? '!bg-primary/20 !border-primary/40' : ''}`}>
                {copied ? <Check size={16} className="text-primary" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-sm p-4 rounded-xl bg-white/5">
            <div className="relative">
              <LoaderRing size={16} />
            </div>
            <span className="text-text-muted">Aguardando pagamento<span className="animate-pulse">...</span></span>
          </div>

          {timeLeft !== null && timeLeft > 0 && (
            <div className="mt-4 text-xs text-text-dim flex items-center justify-center gap-1.5">
              <Clock size={12} /> Expira em <span className="font-mono font-tabular text-accent-gold">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <aside className="space-y-4">
          {selectedPlan && (
            <div className="holo-card p-5">
              <div className="text-xs text-text-muted uppercase tracking-widest mb-2">Seu pedido</div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${selectedPlan.color}15`, border: `1px solid ${selectedPlan.color}35` }}>
                  <selectedPlan.icon size={16} style={{ color: selectedPlan.color }} />
                </div>
                <div>
                  <div className="font-display font-bold text-sm">{selectedPlan.title}</div>
                  <div className="text-xs text-text-muted">{selectedPlan.subtitle}</div>
                </div>
              </div>
              <div className="text-3xl font-display font-bold font-tabular text-primary">
                {formatBRL(pixData.amount || selectedPlan.price * 100)}
              </div>
            </div>
          )}

          <div className="holo-card p-5">
            <h4 className="text-xs text-text-muted uppercase tracking-widest mb-3">Como funciona</h4>
            <ol className="space-y-3 text-sm">
              {[
                'Abra o app do seu banco',
                'Escaneie o QR code ou cole o código',
                'Confirme o pagamento',
                'Receba sua licença no WhatsApp',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">
                    {i + 1}
                  </div>
                  <span className="text-text-muted">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="holo-card p-4">
            <p className="text-xs text-text-muted mb-2">Problemas?</p>
            <a href="https://wa.me/5527992660736" target="_blank" rel="noreferrer" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1.5">
              <MessageCircle size={12} /> Falar com a gente
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
