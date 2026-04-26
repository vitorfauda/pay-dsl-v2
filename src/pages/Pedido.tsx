import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { QrCode, Copy, AlertTriangle, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Badge, Button, ButtonLink, Card, inputClass } from '@/components/ui';
import { LoaderRing } from '@/components/LoaderRing';

const SUPABASE_URL = 'https://qtbkvshbmqlszncxlcuc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Ymt2c2hibXFsc3puY3hsY3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjgxNjQsImV4cCI6MjA5MTAwNDE2NH0.HJOr2NCBJ1BwSRppQqoYxsszgrX_BY3UAmqmqPhPiTE';

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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
        headers: { Authorization: `Bearer ${ANON_KEY}`, apikey: ANON_KEY },
      });
      const data = await r.json();
      if (!data.ok) {
        setError(data.error === 'order_not_found' ? 'Pedido não encontrado' : data.error || 'Erro');
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

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (!order || order.status !== 'pending' || pollAttempts > 240) return;
    const t = setTimeout(() => {
      fetchOrder(true);
      setPollAttempts((n) => n + 1);
    }, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, pollAttempts]);

  const manualRefresh = async () => {
    setRefreshing(true);
    await fetchOrder(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-[var(--color-text-muted)]">
        <LoaderRing size={28} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="size-12 rounded-md bg-red-500/10 border border-red-500/20 grid place-items-center mx-auto mb-4">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Pedido inválido</h1>
        <p className="text-sm text-[var(--color-text-muted)]">{error || 'Não foi possível carregar.'}</p>
        <p className="text-xs text-[var(--color-text-dim)] mt-2 font-mono">{orderId}</p>
      </div>
    );
  }

  // PAGO
  if (order.status === 'paid') {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-16">
        <Card className="p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--color-primary)]/5" />
          <div className="relative">
            <div className="size-12 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={22} className="text-[var(--color-primary)]" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Pagamento confirmado</h1>
            <p className="mt-3 text-[var(--color-text-muted)]">
              Sua chave de licença foi enviada por <strong className="text-[var(--color-text)]">email</strong> e{' '}
              <strong className="text-[var(--color-text)]">WhatsApp</strong>. Confira sua caixa de entrada (e o spam).
            </p>

            <Card className="mt-6 p-4 text-left text-xs">
              <Row label="Pedido" value={order.order_id} mono />
              <Row label="Cobrança" value={order.charge_id} mono />
              <Row label="Valor" value={formatBRL(order.amount_cents)} />
              {order.paid_at && (
                <Row
                  label="Pago em"
                  value={new Date(order.paid_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                />
              )}
            </Card>

            <ButtonLink href="https://devsemlimites.site/instalar" size="lg" className="mt-6">
              Como instalar a extensão <ArrowRight size={14} />
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  // FALHA
  if (order.status === 'failed' || order.status === 'canceled') {
    return (
      <div className="max-w-[600px] mx-auto px-6 py-16">
        <Card className="p-10 text-center">
          <div className="size-12 rounded-md bg-red-500/10 border border-red-500/20 grid place-items-center mx-auto mb-4">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            {order.status === 'canceled' ? 'Pedido cancelado' : 'Pagamento não autorizado'}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-5">
            {order.error_message || 'Não conseguimos processar este pagamento.'}
          </p>
          <Card className="p-4 text-left text-xs">
            <Row label="Pedido" value={order.order_id} mono />
            <Row label="Cobrança" value={order.charge_id} mono />
            <Row label="Status" value={order.raw_status} />
          </Card>
          <p className="text-xs text-[var(--color-text-dim)] mt-5">
            Em caso de cobrança indevida, contate o suporte com o número do pedido.
          </p>
        </Card>
      </div>
    );
  }

  // PIX PENDENTE
  const pix = order.pix;
  const qrSrc =
    pix?.qr_code_url ||
    (pix?.qr_code
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(pix.qr_code)}`
      : null);

  return (
    <div className="max-w-[600px] mx-auto px-6 py-10">
      <Card className="p-8 text-center">
        <Badge tone="info"><QrCode size={11} /> PIX pendente</Badge>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Pague o PIX</h1>
        <div className="text-3xl font-semibold tracking-tight text-[var(--color-primary)] mt-2 mb-5">
          {formatBRL(order.amount_cents)}
        </div>

        {qrSrc ? (
          <div className="inline-block p-3 rounded-lg bg-white">
            <img src={qrSrc} alt="QR PIX" className="w-56 h-56" />
          </div>
        ) : (
          <div className="w-56 h-56 mx-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] grid place-items-center text-xs text-[var(--color-text-dim)] text-center px-4">
            QR não disponível ainda
            <br />
            (aguardando ambiente PIX)
          </div>
        )}

        {pix?.qr_code && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              Ver código copia e cola
            </summary>
            <div className={'mt-2 ' + inputClass + ' break-all whitespace-normal h-auto py-2 font-mono text-[10px]'}>
              {pix.qr_code}
            </div>
          </details>
        )}

        <Button
          onClick={() => {
            if (pix?.qr_code) {
              navigator.clipboard.writeText(pix.qr_code);
              toast.success('Copiado');
            }
          }}
          className="w-full mt-5"
          disabled={!pix?.qr_code}
        >
          <Copy size={14} /> {pix?.qr_code ? 'Copiar código PIX' : 'Aguardando código…'}
        </Button>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)]">
          <LoaderRing size={12} className="text-[var(--color-primary)]" />
          Verificando pagamento (atualiza sozinho)
        </div>

        <button
          onClick={manualRefresh}
          className="mt-3 text-xs text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
        >
          <RefreshCw size={11} className={refreshing ? 'spin' : ''} /> Atualizar manualmente
        </button>

        <p className="text-xs text-[var(--color-text-dim)] mt-4 leading-relaxed">
          Assim que pagar, esta tela atualiza automaticamente.
          <br />
          Sua chave chega por <strong className="text-[var(--color-text)]">email</strong> e{' '}
          <strong className="text-[var(--color-text)]">WhatsApp</strong>.
        </p>

        {pix?.expires_at && (
          <p className="text-[11px] text-[var(--color-text-dim)] mt-2">
            Vence em {new Date(pix.expires_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
          </p>
        )}

        <div className="mt-5 pt-4 border-t border-[var(--color-border)] text-left text-[11px] space-y-1">
          <div className="text-[var(--color-text-dim)] uppercase tracking-widest mb-1.5">Dados do pedido</div>
          <Row label="Pedido" value={order.order_id} mono dim />
          <Row label="Cobrança" value={order.charge_id} mono dim />
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value, mono = false, dim = false }: { label: string; value: string; mono?: boolean; dim?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-2 py-0.5">
      <span className={dim ? 'text-[var(--color-text-dim)]' : 'text-[var(--color-text-muted)]'}>{label}</span>
      <code className={(mono ? 'font-mono ' : '') + 'text-right break-all text-[var(--color-text)]'}>{value}</code>
    </div>
  );
}
