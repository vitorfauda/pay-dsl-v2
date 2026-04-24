// ============================================================
// Cliente supabase + helper pra chamar edge functions
// ============================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qtbkvshbmqlszncxlcuc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Ymt2c2hibXFsc3puY3hsY3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjgxNjQsImV4cCI6MjA5MTAwNDE2NH0.HJOr2NCBJ1BwSRppQqoYxsszgrX_BY3UAmqmqPhPiTE';

const MP_ACCESS_TOKEN = import.meta.env.VITE_MP_ACCESS_TOKEN || 'APP_USR-5262961042126178-040920-7d759a167b481f9b36ac8e94bbbd56c2-243703076';

export async function callEdgeFunction<T = any>(name: string, body: any): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.message || `Edge function ${name} falhou`);
  }
  return data as T;
}

export async function checkPaymentStatus(paymentId: string | number): Promise<{
  status: string;
  status_detail?: string;
}> {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) throw new Error(`MP API ${res.status}`);
  return await res.json();
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
