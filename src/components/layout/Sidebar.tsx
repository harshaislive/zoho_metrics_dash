import { Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Projects', href: '/' },
  { name: 'Users', href: '/users' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>
      <nav className="mt-6">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium ${
                isActive
                  ? 'bg-gray-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 