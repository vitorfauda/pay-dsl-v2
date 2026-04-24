import { Zap, Calendar, TrendingUp, Infinity as InfinityIcon } from 'lucide-react';

export type PlanId = 'daily' | 'weekly' | 'monthly' | 'lifetime';

export type Plan = {
  id: PlanId;
  code: '1dia' | '7dias' | '30dias' | 'vitalicio';
  title: string;
  subtitle: string;
  price: number;
  old?: number;
  icon: any;
  color: string;
  popular: boolean;
  highlight?: boolean;
  features: string[];
  badge?: string;
};

export const PLANS: Plan[] = [
  {
    id: 'daily',
    code: '1dia',
    title: 'Acesso Rápido',
    subtitle: '24 horas de uso livre',
    price: 47,
    icon: Zap,
    color: '#22d3ee',
    popular: false,
    features: [
      'Prompts ilimitados por 24h',
      'Ativação em segundos',
      'Suporte via WhatsApp',
    ],
  },
  {
    id: 'weekly',
    code: '7dias',
    title: 'Acesso Semanal',
    subtitle: '7 dias de uso livre',
    price: 67,
    icon: Calendar,
    color: '#22d3ee',
    popular: false,
    features: [
      'Prompts ilimitados por 7 dias',
      'Ativação em segundos',
      'Suporte via WhatsApp',
    ],
  },
  {
    id: 'monthly',
    code: '30dias',
    title: 'Acesso Mensal',
    subtitle: '30 dias de uso livre',
    price: 97,
    icon: TrendingUp,
    color: '#fbbf24',
    popular: true,
    badge: '🏆 MAIS ESCOLHIDO',
    features: [
      'Prompts ilimitados por 30 dias',
      'Atualizações automáticas',
      'Suporte prioritário',
      'Remoção de marca d\'água',
    ],
  },
  {
    id: 'lifetime',
    code: 'vitalicio',
    title: 'Acesso Vitalício',
    subtitle: 'Pagamento único',
    price: 147,
    old: 197,
    icon: InfinityIcon,
    color: '#22c55e',
    popular: false,
    highlight: true,
    features: [
      'Prompts ilimitados PRA SEMPRE',
      'Todas as atualizações futuras',
      'Suporte VIP',
      'Remoção de marca d\'água',
      'Sem mensalidade',
    ],
  },
];

export function getPlanById(id: PlanId | string): Plan | undefined {
  return PLANS.find(p => p.id === id);
}
