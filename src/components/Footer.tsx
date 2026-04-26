import { MessageCircle, Lock, CreditCard } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t mt-20 relative z-10" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 font-display font-bold text-lg mb-2">
              <div className="h-8 w-8 rounded-lg overflow-hidden">
                <img src="/logo.png" alt="DSL" className="h-full w-full object-contain" />
              </div>
              Dev Sem Limites
            </div>
            <p className="text-xs text-text-muted max-w-md">
              Extensão oficial pra Lovable ilimitado. Licença vitalícia por pagamento único.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <Lock size={12} className="text-primary" /> SSL + pagamento criptografado
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard size={12} className="text-primary" /> Mercado Pago
            </div>
            <a href="https://wa.me/5527992660736" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary">
              <MessageCircle size={12} /> Suporte WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between gap-4 text-xs text-text-dim" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p>© {new Date().getFullYear()} Dev Sem Limites. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <a href="https://devsemlimites.site" target="_blank" rel="noreferrer" className="hover:text-text-muted">Site oficial</a>
            <a href="#" className="hover:text-text-muted">Termos</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
