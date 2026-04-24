import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-20 min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-7xl sm:text-9xl font-display font-bold text-gradient mb-4">404</div>
        <h1 className="text-2xl font-display font-bold mb-2">Página não encontrada</h1>
        <p className="text-text-muted mb-6">O link que você seguiu está quebrado ou essa página não existe.</p>
        <Link to="/" className="cta-neon inline-flex items-center gap-2">
          <span className="relative z-10 flex items-center gap-2">
            <ArrowLeft size={14} /> Voltar pro início
          </span>
        </Link>
      </div>
    </div>
  );
}
