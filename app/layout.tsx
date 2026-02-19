import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Lightbulb, Settings, BarChart3 } from 'lucide-react';

const manrope = Manrope({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vivivan EnergyView',
  description: 'Plataforma de analitica energetica de Vivivan',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={manrope.className}>
        <div className="flex h-screen bg-slate-50">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
            <div className="p-5">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo_soluciones_vivivan.png"
                  alt="Vivivan EnergyView"
                  width={46}
                  height={46}
                  className="h-[46px] w-[46px] object-contain"
                  priority
                />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-800/80">Vivivan</p>
                  <h1 className="text-lg font-bold text-cyan-800 leading-tight">EnergyView</h1>
                </div>
              </div>
            </div>
            
            <nav className="flex-1 px-4 space-y-2">
              <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 rounded-lg transition-colors">
                <BarChart3 className="w-4 h-4" />
                Panel Principal
              </Link>
              <Link href="/clients" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 rounded-lg transition-colors">
                <Users className="w-4 h-4" />
                Clientes
              </Link>
              <Link href="/optimizations" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 rounded-lg transition-colors opacity-50 cursor-not-allowed">
                <Lightbulb className="w-4 h-4" />
                Optimizaciones
              </Link>
            </nav>

            <div className="p-4 border-t border-slate-200">
               <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
                Configuración
              </Link>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <header className="bg-white border-b border-slate-200 p-4 md:hidden">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/logo_soluciones_vivivan.png"
                  alt="Vivivan EnergyView"
                  width={34}
                  height={34}
                  className="h-[34px] w-[34px] object-contain"
                  priority
                />
                <h1 className="text-lg font-bold text-cyan-800">Vivivan EnergyView</h1>
              </div>
            </header>
            <div className="p-5 md:p-6 max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
