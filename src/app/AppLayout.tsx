
'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ConfigProvider } from '@/context/ConfigContext';

export function AppLayout({ children, initialConfig }: { children: React.ReactNode, initialConfig: any }) {
  const pathname = usePathname();
  const isCheckoutPage = pathname === '/checkout';

  // Use config from initialConfig or fallback to siteContent if needed
  const announcementBar = initialConfig?.header?.announcementBar || "🤍​ OFERTA BLACKFRIDAY SOLO HOY –50 % DE DESCUENTO Y ENVIO GRATIS 🤍";

  return (
    <ConfigProvider initialConfig={initialConfig}>
      <div className="flex flex-col min-h-screen">
        <div
          className="py-2 px-4 text-primary-foreground font-button font-bold text-sm overflow-hidden whitespace-nowrap"
          style={{
            backgroundColor: 'black',
          }}
        >
          <p className="animate-marquee inline-block">
            {announcementBar}
          </p>
        </div>
        <Header />
        <main className="flex-grow">{children}</main>
        {!isCheckoutPage && <Footer />}
      </div>
    </ConfigProvider>
  );
}
