import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="text-center max-w-md">
        <div className="text-7xl font-mono font-semibold tracking-tight text-[var(--color-text-dim)] mb-4">
          404
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Página não encontrada</h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          O link que você seguiu está quebrado ou essa página não existe.
        </p>
        <Link to="/">
          <Button variant="secondary">
            <ArrowLeft size={14} /> Voltar pro início
          </Button>
        </Link>
      </div>
    </div>
  );
}
