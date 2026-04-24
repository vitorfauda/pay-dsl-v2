import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(5,7,13,0.75)' }}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-display font-bold">
          <div className="relative">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center shadow-lg shadow-primary/40">
              <span className="text-void font-black text-sm">D</span>
            </div>
            <div className="absolute inset-0 rounded-lg bg-primary/30 blur-md -z-10" />
          </div>
          <span className="text-text-primary text-base sm:text-lg">Dev Sem Limites</span>
        </Link>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <ShieldCheck size={14} className="text-primary" />
          <span className="hidden sm:inline text-text-muted">Pagamento seguro</span>
          <span className="sm:hidden text-text-muted">Seguro</span>
        </div>
      </div>
    </header>
  );
}
