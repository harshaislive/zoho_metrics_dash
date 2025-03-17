import { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {children}
      </main>
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          Zoho Metrics Dashboard © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
} 