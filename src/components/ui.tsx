import { cn } from '@/lib/utils';
import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]', className)}>
      {children}
    </div>
  );
}

const sizes = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-sm',
};
const variants = {
  primary: 'bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-hover)] font-medium',
  secondary: 'bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-white/10 border border-[var(--color-border)]',
  ghost: 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5',
};

const baseBtn = 'inline-flex items-center justify-center gap-2 rounded-md transition-all whitespace-nowrap';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return (
    <button className={cn(baseBtn, sizes[size], variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return (
    <a className={cn(baseBtn, sizes[size], variants[variant], className)} {...rest}>
      {children}
    </a>
  );
}

const tones = {
  neutral: 'bg-white/5 text-[var(--color-text-muted)] border-[var(--color-border)]',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 h-5 rounded text-[11px] font-medium border', tones[tone], className)}>
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: { value: string; positive?: boolean };
  icon?: any;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
        {Icon && <Icon size={14} className="text-[var(--color-text-dim)]" />}
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      {delta && (
        <div className={cn('mt-1 text-xs', delta.positive ? 'text-emerald-400' : 'text-red-400')}>
          {delta.positive ? '↑' : '↓'} {delta.value}
        </div>
      )}
    </Card>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-[var(--color-text-muted)] mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-8 py-8 max-w-[1200px] mx-auto', className)}>{children}</div>;
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs text-[var(--color-text-muted)] mb-1.5">{label}</div>
      {children}
      {error && <div className="text-xs text-red-400 mt-1">{error}</div>}
    </label>
  );
}

export const inputClass =
  'w-full h-10 px-3 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-sm placeholder:text-[var(--color-text-dim)] outline-none focus:border-[var(--color-primary)]/50 transition-colors';
