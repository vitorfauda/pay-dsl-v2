import { Lock, CreditCard, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-12">
      <div className="max-w-[1100px] mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-dim)]">
        <div>© {new Date().getFullYear()} Dev Sem Limites</div>
        <div className="flex flex-wrap items-center justify-center gap-5">
          <span className="flex items-center gap-1.5">
            <Lock size={11} /> SSL criptografado
          </span>
          <span className="flex items-center gap-1.5">
            <CreditCard size={11} /> Pagar.me · Mercado Pago
          </span>
          <a
            href="https://wa.me/5527992660736"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-[var(--color-text)] transition-colors"
          >
            <MessageCircle size={11} /> Suporte
          </a>
          <a
            href="https://devsemlimites.site/termos"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--color-text)] transition-colors"
          >
            Termos
          </a>
        </div>
      </div>
    </footer>
  );
}
