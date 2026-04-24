import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type { Plan, PlanId } from '@/lib/plans';

export type UserData = {
  name: string;
  email: string;
  cpf: string;
  whatsapp: string;
};

export type PixData = {
  payment_id: string;
  qr_code_base64: string;
  qr_code_text: string;
  expires_at?: string;
  whatsapp_valid?: boolean;
  plan_code?: string;
  phone?: string;
  amount?: number;
};

export type AppliedCoupon = {
  code: string;
  discount_cents: number;
  original_cents: number;
  final_cents: number;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
};

interface CheckoutContextValue {
  selectedPlan: Plan | null;
  setSelectedPlan: (p: Plan | null) => void;
  userData: UserData;
  setUserData: (u: Partial<UserData>) => void;
  pixData: PixData | null;
  setPixData: (p: PixData | null) => void;
  coupon: AppliedCoupon | null;
  setCoupon: (c: AppliedCoupon | null) => void;
  reset: () => void;
}

const DEFAULT_USER: UserData = { name: '', email: '', cpf: '', whatsapp: '' };

const CheckoutContext = createContext<CheckoutContextValue | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(() => {
    try {
      const raw = localStorage.getItem('selectedPlan');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [userData, setUserDataState] = useState<UserData>(() => {
    try {
      const raw = localStorage.getItem('userData');
      return raw ? { ...DEFAULT_USER, ...JSON.parse(raw) } : DEFAULT_USER;
    } catch { return DEFAULT_USER; }
  });

  const [pixData, setPixData] = useState<PixData | null>(() => {
    try {
      const raw = localStorage.getItem('pixData');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

  useEffect(() => {
    if (selectedPlan) localStorage.setItem('selectedPlan', JSON.stringify(selectedPlan));
    else localStorage.removeItem('selectedPlan');
  }, [selectedPlan]);

  useEffect(() => {
    localStorage.setItem('userData', JSON.stringify(userData));
  }, [userData]);

  useEffect(() => {
    if (pixData) localStorage.setItem('pixData', JSON.stringify(pixData));
    else localStorage.removeItem('pixData');
  }, [pixData]);

  const setUserData = (u: Partial<UserData>) => setUserDataState(prev => ({ ...prev, ...u }));

  const reset = () => {
    setSelectedPlan(null);
    setUserDataState(DEFAULT_USER);
    setPixData(null);
    setCoupon(null);
    localStorage.removeItem('selectedPlan');
    localStorage.removeItem('userData');
    localStorage.removeItem('pixData');
  };

  return (
    <CheckoutContext.Provider value={{
      selectedPlan, setSelectedPlan,
      userData, setUserData,
      pixData, setPixData,
      coupon, setCoupon,
      reset,
    }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider');
  return ctx;
}

// Helper usado em links que passam plan code via params
export { type PlanId };
