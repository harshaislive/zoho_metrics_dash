import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Projects', href: '/projects' },
  { name: 'Users', href: '/users' },
];

export default function Header() {
  const location = useLocation();
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <ChartBarIcon className="h-8 w-8 text-primary-500" />
              <span className="ml-2 text-xl font-bold font-serif text-neutral-900">Zoho Metrics</span>
            </div>
            <nav className="ml-8 flex space-x-8">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-b-2 border-accent-earth text-accent-earth'
                        : 'text-neutral-600 hover:text-accent-earth'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
              Zoho Analytics
            </span>
          </div>
        </div>
      </div>
    </header>
  );
} 