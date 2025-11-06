import { useState } from 'react';
import { Button } from './ui/button';
import { Menu, LogOut, ShoppingCart, BookOpen, Package, Calendar, FileText, FileCheck } from 'lucide-react';
import { User } from '../App';
import OrdersTab from './tabs/OrdersTab';
import MenuTab from './tabs/MenuTab';
import WarehouseTab from './tabs/WarehouseTab';
import ScheduleTab from './tabs/ScheduleTab';
import ReportsTab from './tabs/ReportsTab';
import LogsTab from './tabs/LogsTab';

type MainLayoutProps = {
  user: User;
  onLogout: () => void;
};

type TabId = 'orders' | 'menu' | 'warehouse' | 'schedule' | 'reports' | 'logs';

const TABS = [
  { id: 'orders' as TabId, label: 'Zamówienia', icon: ShoppingCart },
  { id: 'menu' as TabId, label: 'Menu', icon: BookOpen },
  { id: 'warehouse' as TabId, label: 'Magazyn', icon: Package },
  { id: 'schedule' as TabId, label: 'Grafik', icon: Calendar },
  { id: 'reports' as TabId, label: 'Raporty', icon: FileText },
  { id: 'logs' as TabId, label: 'Logi', icon: FileCheck },
];

export default function MainLayout({ user, onLogout }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabId>('orders');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return <OrdersTab user={user} />;
      case 'menu':
        return <MenuTab user={user} />;
      case 'warehouse':
        return <WarehouseTab user={user} />;
      case 'schedule':
        return <ScheduleTab user={user} />;
      case 'reports':
        return <ReportsTab user={user} />;
      case 'logs':
        return <LogsTab user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50" style={{ width: '1024px', height: '768px', margin: '0 auto' }}>
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-amber-800">Madziarynka Cafe</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div>{user.name}</div>
            <div className="text-sm text-gray-500">
              {user.role === 'admin' ? 'Administrator' : 'Pracownik'}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Wyloguj
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
            <nav className="flex-1 p-3">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-amber-100 text-amber-800'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
