import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mắt Một Mí Media | Quản Lý Toàn Bộ Thiết Bị Máy Ảnh Cưới',
  description: 'Hệ thống web app quản lý thiết bị, máy ảnh, lens, đèn, phụ kiện quay chụp cưới cho Mắt Một Mí Media. Quét mã QR, quy trình mượn trả 2 bên, kiểm kê tự động.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0B0F17',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className={`${inter.className} bg-[#0B0F17] text-slate-100 antialiased min-h-screen flex flex-col`}>
        <AppProvider>
          <Navbar />
          <main className="flex-1 pb-24 md:pb-12 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
