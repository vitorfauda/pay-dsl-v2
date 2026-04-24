import { MessageCircle } from 'lucide-react';

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/5527992660736?text=Ol%C3%A1,%20preciso%20de%20ajuda%20com%20a%20compra"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 animate-pulse-glow"
      style={{
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        boxShadow: '0 8px 32px -4px rgba(34,197,94,0.5)',
      }}
      title="Suporte via WhatsApp"
    >
      <MessageCircle size={24} className="text-void" fill="currentColor" />
    </a>
  );
}
