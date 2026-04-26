import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { CheckoutProvider } from '@/context/CheckoutContext';
import { Layout } from '@/components/Layout';
import Landing from '@/pages/Landing';
import Checkout from '@/pages/Checkout';
import Pix from '@/pages/Pix';
import NotFound from '@/pages/NotFound';
import ResellerCheckout from '@/pages/ResellerCheckout';
import Pedido from '@/pages/Pedido';

export default function App() {
  return (
    <BrowserRouter>
      <CheckoutProvider>
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#0f0f0f',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#fafafa',
            },
          }}
        />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pix" element={<Pix />} />
            <Route path="/pix/:paymentId" element={<Pix />} />
            <Route path="/c/:slug" element={<ResellerCheckout />} />
            <Route path="/pedido/:orderId" element={<Pedido />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </CheckoutProvider>
    </BrowserRouter>
  );
}
