import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCheckout } from '@/context/CheckoutContext';
import { callEdgeFunction, checkPaymentStatus } from '@/lib/supabase';
import { copyToClipboard, formatBRL, maskPhone } from '@/lib/utils';
import { PLANS } from '@/lib/plans';
import {
  Copy, Check, Key as KeyIcon, Download, BookOpen, Users as UsersIcon,
  AlertTriangle, MessageCircle, ArrowLeft, Save, X, Clock, CheckCircle2,
} from 'lucide-react';
import { LoaderRing } from '@/components/LoaderRing';
import { Badge, Button, ButtonLink, Card, inputClass } from '@/components/ui';
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

  const [showWaFix, setShowWaFix] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    if (!paramId) {
      if (pixData?.payment_id) {
        nav(`/pix/${pixData.payment_id}`, { replace: true });
      } else {
        nav('/');
      }
      return;
    }
    if (pixData && pixData.payment_id === paramId) return;

    setRestoring(true);
    (async () => {
      try {
        const data = await callEdgeFunction<any>('get-pix-payment', { payment_id: paramId });
        if (!data?.ok) throw new Error(data?.error || 'Pagamento nao encontrado');
        const plan = PLANS.find((p) => p.code === data.plan_code) || null;
        if (plan) setSelectedPlan(plan);
        setPixData({
          payment_id: String(data.payment_id),
          qr_code_base64: data.qr_code_base64,
          qr_code_text: data.qr_code_text,
          expires_at: data.expires_at,
          plan_code: data.plan_code,
          phone: data.customer_phone,
          amount: data.amount_cents,
          whatsapp_valid: true,
        });
        if (data.status === 'approved' || data.status === 'paid') setStatus('approved');
      } catch {
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

  useEffect(() => {
    if (!pixData?.payment_id || status !== 'pending') return;
    const poll = async () => {
      try {
        const result = await checkPaymentStatus(pixData.payment_id);
        if (result.status === 'approved') {
          setStatus('approved');
          toast.success('Pagamento confirmado');
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (result.status === 'rejected' || result.status === 'cancelled') {
          setStatus(result.status as Status);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {}
    };
    pollRef.current = window.setInterval(poll, 3000);
    poll();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pixData, status]);

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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-[var(--color-text-muted)]">
        <LoaderRing size={32} />
        <p className="text-sm mt-4">Carregando seu pagamento…</p>
      </div>
    );
  }

  const handleCopy = async () => {
    await copyToClipboard(pixData.qr_code_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('Código PIX copiado');
  };

  const saveNewPhone = async () => {
    const digits = newPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error('Número inválido');
      return;
    }
    setSavingPhone(true);
    try {
      const valid = await callEdgeFunction<any>('validate-whatsapp', { phone: digits });
      if (valid?.exists === false) {
        toast.error('Esse número também não foi encontrado no WhatsApp');
        return;
      }
      await callEdgeFunction('update-pix-phone', { payment_id: pixData.payment_id, phone: digits });
      setPixData({ ...pixData, phone: digits, whatsapp_valid: true });
      setShowWaFix(false);
      toast.success('Número corrigido');
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

  // SUCESSO
  if (status === 'approved') {
    return (
      <div className="max-w-[700px] mx-auto px-6 py-16">
        <Card className="p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--color-primary)]/5" />
          <div className="relative">
            <div className="size-12 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={22} className="text-[var(--color-primary)]" />
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">Pagamento confirmado</h1>
            <p className="mt-3 text-[var(--color-text-muted)]">
              Sua licença foi gerada. Verifique seu WhatsApp — enviamos tudo pra lá em segundos.
            </p>

            <div className="grid sm:grid-cols-2 gap-2 text-left mt-8">
              {[
                { icon: KeyIcon, label: 'Chave de licença', desc: 'DSL-XXXX-XXXX-XXXX' },
                { icon: Download, label: 'Arquivo ZIP', desc: 'Extensão pronta' },
                { icon: BookOpen, label: 'Tutorial em vídeo', desc: 'Instalação em 2 min' },
                { icon: UsersIcon, label: 'Grupo VIP', desc: 'Suporte e novidades' },
              ].map((it, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]/50"
                >
                  <div className="size-8 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                    <it.icon size={13} className="text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{it.label}</div>
                    <div className="text-xs text-[var(--color-text-dim)]">{it.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <ButtonLink
              href="https://wa.me/5527992660736"
              target="_blank"
              rel="noreferrer"
              size="lg"
              className="mt-8"
            >
              <MessageCircle size={16} /> Abrir WhatsApp
            </ButtonLink>

            <button
              onClick={() => {
                reset();
                nav('/');
              }}
              className="block mx-auto mt-5 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            >
              Voltar ao início
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // PENDING
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10">
      <button
        onClick={() => nav('/checkout')}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-6"
      >
        <ArrowLeft size={14} /> Voltar
      </button>

      {showWaFix && (
        <Card className="mb-6 p-5 border-amber-500/30">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium mb-0.5">Confirme seu WhatsApp</div>
              <p className="text-sm text-[var(--color-text-muted)]">
                Não encontramos esse número no WhatsApp. Se estiver errado, corrija agora — sua
                licença será enviada por lá.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={newPhone}
              onChange={(e) => setNewPhone(maskPhone(e.target.value))}
              maxLength={15}
              placeholder="(27) 99999-9999"
              className={inputClass + ' flex-1'}
            />
            <Button onClick={saveNewPhone} disabled={savingPhone}>
              {savingPhone ? <LoaderRing size={14} /> : (
                <>
                  <Save size={13} /> Corrigir
                </>
              )}
            </Button>
            <Button onClick={() => setShowWaFix(false)} variant="ghost">
              <X size={14} />
            </Button>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <Card className="p-8 text-center">
          <Badge tone="info">PIX gerado</Badge>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Escaneie ou copie o código</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-6">
            Aprovação automática em segundos
          </p>

          {pixData.qr_code_base64 && (
            <div className="inline-block p-3 rounded-lg bg-white mb-5">
              <img
                src={`data:image/png;base64,${pixData.qr_code_base64}`}
                alt="QR Code PIX"
                className="w-56 h-56 sm:w-64 sm:h-64"
              />
            </div>
          )}

          <div className="text-left mb-5">
            <div className="text-xs text-[var(--color-text-muted)] mb-1.5">PIX copia-e-cola</div>
            <div className="flex gap-2">
              <input readOnly value={pixData.qr_code_text} className={inputClass + ' font-mono text-xs'} />
              <Button onClick={handleCopy} variant="secondary" className="shrink-0">
                {copied ? <Check size={14} className="text-[var(--color-primary)]" /> : <Copy size={14} />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-sm p-3 rounded-md bg-[var(--color-surface-2)]/60 border border-[var(--color-border)] text-[var(--color-text-muted)]">
            <LoaderRing size={14} className="text-[var(--color-primary)]" />
            <span>Aguardando pagamento…</span>
          </div>

          {timeLeft !== null && timeLeft > 0 && (
            <div className="mt-4 text-xs text-[var(--color-text-dim)] flex items-center justify-center gap-1.5">
              <Clock size={11} /> Expira em{' '}
              <span className="font-mono text-amber-400">{formatTime(timeLeft)}</span>
            </div>
          )}
        </Card>

        <aside className="space-y-3">
          {selectedPlan && (
            <Card className="p-5">
              <div className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest mb-2">
                Seu pedido
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="size-9 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                  <selectedPlan.icon size={15} className="text-[var(--color-primary)]" />
                </div>
                <div>
                  <div className="text-sm font-medium">{selectedPlan.title}</div>
                  <div className="text-xs text-[var(--color-text-dim)]">{selectedPlan.subtitle}</div>
                </div>
              </div>
              <div className="text-2xl font-semibold tracking-tight">
                {formatBRL(pixData.amount || selectedPlan.price * 100)}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <div className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest mb-3">
              Como funciona
            </div>
            <ol className="space-y-2.5 text-sm">
              {[
                'Abra o app do seu banco',
                'Escaneie o QR code ou cole o código',
                'Confirme o pagamento',
                'Receba sua licença no WhatsApp',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-[var(--color-text-muted)]">
                  <span className="size-5 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center shrink-0 text-[10px] font-mono text-[var(--color-text-dim)]">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-[var(--color-text-muted)] mb-2">Problemas?</div>
            <a
              href="https://wa.me/5527992660736"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1.5"
            >
              <MessageCircle size={11} /> Falar com a gente
            </a>
          </Card>
        </aside>
      </div>
    </div>
  );
}
