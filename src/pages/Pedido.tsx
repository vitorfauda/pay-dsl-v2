import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { QrCode, Check, Copy, Loader2, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

const SUPABASE_URL = 'https://qtbkvshbmqlszncxlcuc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Ymt2c2hibXFsc3puY3hsY3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjgxNjQsImV4cCI6MjA5MTAwNDE2NH0.HJOr2NCBJ1BwSRppQqoYxsszgrX_BY3UAmqmqPhPiTE';

function formatBRL(cents: number) { return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

interface OrderData {
  ok: boolean;
  order_id: string;
  charge_id: string;
  status: 'pending' | 'paid' | 'failed' | 'canceled';
  raw_status: string;
  payment_method: string;
  amount_cents: number;
  created_at?: string;
  paid_at?: string;
  pix?: { qr_code: string | null; qr_code_url: string | null; expires_at: string | null } | null;
  error_message?: string | null;
  customer?: { name?: string; email?: string };
  metadata?: Record<string, string>;
}

export default function Pedido() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);

  const fetchOrder = async (silent = false) => {
    if (!orderId) return;
    if (!silent) setLoading(true);
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/get-pagarme-order?order_id=${orderId}`, {
        headers: { 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
      });
      const data = await r.json();
      if (!data.ok) {
        setError(data.error === 'order_not_found' ? 'Pedido não encontrado' : (data.error || 'Erro'));
        setLoading(false);
        return;
      }
      setOrder(data);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => { fetchOrder(); }, [orderId]);

  // Polling enquanto pendente
  useEffect(() => {
    if (!order || order.status !== 'pending') return;
    if (pollAttempts > 240) return; // 240 × 5s = 20min

    const t = setTimeout(() => {
      fetchOrder(true);
      setPollAttempts(n => n + 1);
    }, 5000);
    return () => clearTimeout(t);
  }, [order, pollAttempts]);

  const manualRefresh = async () => {
    setRefreshing(true);
    await fetchOrder(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="size-8 animate-spin text-emerald-500" /></div>;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md text-center">
          <div className="size-16 rounded-2xl bg-red-500/10 grid place-items-center mx-auto mb-4">
            <AlertTriangle className="size-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Pedido inválido</h1>
          <p className="text-text-muted text-sm">{error || 'Não foi possível carregar.'}</p>
          <p className="text-xs text-text-dim mt-2">ID: {orderId}</p>
        </div>
      </div>
    );
  }

  // ──── PAGO ────
  if (order.status === 'paid') {
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
            <Row label="Pedido" value={order.order_id} mono />
            <Row label="Cobrança" value={order.charge_id} mono />
            <Row label="Valor" value={formatBRL(order.amount_cents)} />
            {order.paid_at && <Row label="Pago em" value={new Date(order.paid_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} />}
          </div>
          <a href="https://devsemlimites.site/instalar" className="cta-neon w-full inline-flex items-center justify-center gap-2">
            Como instalar a extensão <ArrowRight className="size-4" />
          </a>
        </motion.div>
      </div>
    );
  }

  // ──── FALHA / CANCELADO ────
  if (order.status === 'failed' || order.status === 'canceled') {
    return (
      <div className="min-h-screen p-6 grid place-items-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full text-center">
          <div className="size-16 rounded-2xl bg-red-500/10 grid place-items-center mx-auto mb-4">
            <AlertTriangle className="size-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {order.status === 'canceled' ? 'Pedido cancelado' : 'Pagamento não autorizado'}
          </h1>
          {order.error_message ? (
            <p className="text-text-muted text-sm mb-4">{order.error_message}</p>
          ) : (
            <p className="text-text-muted text-sm mb-4">Não conseguimos processar este pagamento.</p>
          )}
          <div className="rounded-xl bg-slate-900 p-4 text-left text-xs space-y-1 mb-6">
            <Row label="Pedido" value={order.order_id} mono />
            <Row label="Cobrança" value={order.charge_id} mono />
            <Row label="Status" value={order.raw_status} />
          </div>
          <p className="text-xs text-text-dim">Em caso de cobrança indevida, entre em contato com o suporte e informe o número do pedido.</p>
        </motion.div>
      </div>
    );
  }

  // ──── PIX PENDENTE ────
  const pix = order.pix;
  const qrSrc = pix?.qr_code_url || (pix?.qr_code ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(pix.qr_code)}` : null);

  return (
    <div className="min-h-screen p-6 grid place-items-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
        <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/30 p-8 text-center">
          <QrCode className="size-12 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-1">Pague o PIX</h1>
          <div className="text-2xl font-bold text-emerald-400 mb-5">{formatBRL(order.amount_cents)}</div>

          {qrSrc ? (
            <img src={qrSrc} alt="QR PIX" className="w-64 h-64 mx-auto rounded-xl bg-white p-2" />
          ) : (
            <div className="w-64 h-64 mx-auto rounded-xl bg-slate-900 border border-emerald-500/20 grid place-items-center text-center px-4">
              <span className="text-xs text-text-dim">QR não disponível ainda<br />(aguardando ambiente PIX)</span>
            </div>
          )}

          {pix?.qr_code && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-xs text-text-muted hover:text-text-primary">Ver código copia e cola</summary>
              <div className="mt-2 bg-slate-900 rounded-lg p-3 break-all text-xs font-mono text-text-muted">
                {pix.qr_code}
              </div>
            </details>
          )}

          <div className="mt-4">
            <button
              onClick={() => { if (pix?.qr_code) { navigator.clipboard.writeText(pix.qr_code); toast.success('Copiado!'); } }}
              className="cta-neon w-full inline-flex items-center justify-center gap-2"
              disabled={!pix?.qr_code}
            >
              <Copy className="size-4" />
              {pix?.qr_code ? 'Copiar código PIX' : 'Aguardando código PIX...'}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs">
              <Loader2 className="size-3 animate-spin text-emerald-400" />
              <span className="text-text-muted">Verificando pagamento... (atualiza sozinho)</span>
            </div>

            <button onClick={manualRefresh} className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1">
              <RefreshCw className={`size-3 ${refreshing ? 'animate-spin' : ''}`} /> Atualizar manualmente
            </button>

            <p className="text-xs text-text-dim mt-4">
              Assim que pagar, esta tela atualiza automaticamente.<br />
              Sua chave chega por <strong>email</strong> e <strong>WhatsApp</strong>. ⚡
            </p>

            {pix?.expires_at && (
              <p className="text-[11px] text-text-dim mt-2">
                Vence em: {new Date(pix.expires_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </p>
            )}

            <p className="text-[11px] text-text-dim mt-1">
              💾 Salve esta URL — você pode voltar aqui pra checar o status a qualquer momento.
            </p>

            <div className="mt-5 pt-4 border-t border-white/5 text-left text-[11px] space-y-1">
              <p className="text-text-dim uppercase tracking-wider mb-1.5">Dados do pedido</p>
              <Row label="Pedido" value={order.order_id} mono dim />
              <Row label="Cobrança" value={order.charge_id} mono dim />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ label, value, mono = false, dim = false }: { label: string; value: string; mono?: boolean; dim?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className={`${dim ? 'text-text-dim' : 'text-text-muted'}`}>{label}:</span>
      <code className={`${mono ? 'font-mono' : ''} ${dim ? 'text-text-muted' : 'text-text-primary'} text-right break-all`}>{value}</code>
    </div>
  );
}
