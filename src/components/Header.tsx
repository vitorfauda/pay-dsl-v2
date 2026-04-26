import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]">
      <div className="max-w-[1100px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md overflow-hidden">
            <img src="/logo.png" alt="DSL" className="h-full w-full object-contain" />
          </div>
          <span className="font-semibold tracking-tight">Dev Sem Limites</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-[var(--color-text-dim)]">
          <Lock size={12} />
          <span className="hidden sm:inline">Pagamento criptografado</span>
          <span className="sm:hidden">Seguro</span>
        </div>
      </div>
    </header>
  );
}
