import { User, Package, Heart, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout, mobileOpen, setMobileOpen }: SidebarProps) {
  const menuItems = [
    { id: 'profile', icon: User, label: 'My Profile' },
    { id: 'orders', icon: Package, label: 'Orders' },
    { id: 'favorites', icon: Heart, label: 'Favorites' },
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-100 p-6 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0
    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setMobileOpen(false)}></div>}
      
      <div className={sidebarClasses}>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-orange-200">SE</div>
          <span className="text-xl font-black tracking-tight text-slate-900">Service<span className="text-orange-600">Eats</span></span>
        </div>
        
        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold text-sm ${
                activeTab === item.id ? 'bg-orange-50 text-orange-600 shadow-sm ring-1 ring-orange-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        
        <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium mt-auto text-sm">
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </>
  );
}