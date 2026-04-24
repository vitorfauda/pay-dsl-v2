// ============================================================
// Cliente supabase + helper pra chamar edge functions
// ============================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://qtbkvshbmqlszncxlcuc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Ymt2c2hibXFsc3puY3hsY3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjgxNjQsImV4cCI6MjA5MTAwNDE2NH0.HJOr2NCBJ1BwSRppQqoYxsszgrX_BY3UAmqmqPhPiTE';

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

// Consulta status via edge function (MP token fica no backend)
export async function checkPaymentStatus(paymentId: string | number): Promise<{
  status: string;
  status_detail?: string;
}> {
  const data = await callEdgeFunction<any>('check-payment-status', { payment_id: String(paymentId) });
  return { status: data.status, status_detail: data.status_detail };
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };
