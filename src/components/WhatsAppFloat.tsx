import { MessageCircle } from 'lucide-react';

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/5527992660736?text=Ol%C3%A1,%20preciso%20de%20ajuda%20com%20a%20compra"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 h-11 w-11 rounded-full flex items-center justify-center bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-hover)] transition-colors shadow-lg"
      title="Suporte via WhatsApp"
    >
      <MessageCircle size={18} fill="currentColor" />
    </a>
  );
}
