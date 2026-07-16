import { NavLink } from 'react-router-dom';

interface SidebarProps {
  onLogout: () => void;
}

const links = [
  { to: '/', label: 'Dashboard', icon: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { to: '/clients', label: 'Clients', icon: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )},
  { to: '/offers', label: 'Offers', icon: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )},
  { to: '/import', label: 'Import', icon: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )},
];

export default function Sidebar({ onLogout }: SidebarProps) {
  return (
    <aside className="h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex flex-col items-center py-6 border-b border-gray-100">
        <img src="/guardian-logo.png" alt="Guardian" className="w-28 h-auto" />
      </div>

      {/* Menu Grid */}
      <nav className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                  isActive
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`
              }
              style={({ isActive }) => isActive ? { backgroundColor: '#1D4F91' } : undefined}
            >
              <span className="mb-2">{link.icon}</span>
              <span className="text-xs font-medium text-center leading-tight">{link.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Extra icons */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { src: '/WeberIcons/Picture1.png', alt: 'Service' },
            { src: '/WeberIcons/Picture2.png', alt: 'E-Catalog' },
            { src: '/WeberIcons/Picture3.png', alt: 'Maintenance' },
            { src: '/WeberIcons/Picture4.png', alt: 'Parts' },
            { src: '/WeberIcons/Picture5.png', alt: 'Inspection' },
            { src: '/WeberIcons/Picture6.png', alt: 'Process' },
            { src: '/WeberIcons/Picture7.png', alt: 'Academy' },
          ].map((item) => (
            <div
              key={item.alt}
              className="flex items-center justify-center p-2 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-default aspect-square"
            >
              <img src={item.src} alt={item.alt} className="w-full h-full object-contain" />
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log out
        </button>
      </div>
    </aside>
  );
}
