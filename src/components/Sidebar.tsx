import React, { useState } from 'react'
import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  Bell,
  ShoppingCart,
  CreditCard,
  Users,
  BoxIcon,
  ScanBarcode,
  FileText,
  ChevronRight,
  ChevronLeft,
  Search,
  User,
  FileSearch,
} from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
}

type NavGroup = {
  title: string;
  items: {
    id: string;
    icon: React.ElementType;
    label: string;
  }[];
}

export function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navGroups: NavGroup[] = [
    {
      title: 'Operations',
      items: [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'pos', icon: ScanBarcode, label: 'POS Terminal' },
      ]
    },
    {
      title: 'Inventory',
      items: [
        { id: 'products', icon: Package, label: 'Products' },
        { id: 'stock', icon: BoxIcon, label: 'Stock Manager' },
        { id: 'customers', icon: User, label: 'Customers' },
        { id: 'suppliers', icon: Users, label: 'Suppliers' },
      ]
    },
    {
      title: 'Finance',
      items: [
        { id: 'sales', icon: ShoppingCart, label: 'Sales Entry' },
        { id: 'purchases', icon: CreditCard, label: 'Purchases' },
        { id: 'reports', icon: FileText, label: 'Reports' },
      ]
    },
    {
      title: 'System',
      items: [
        { id: 'logs', icon: FileSearch, label: 'System Logs' },
        { id: 'settings', icon: Settings, label: 'Settings' },
      ]
    }
  ];

  return (
    <aside
      className={`
        bg-secondary/95 backdrop-blur-sm border-r border-border-primary 
        flex flex-col h-full transition-all duration-300 ease-in-out z-50
        ${isExpanded ? 'w-[260px]' : 'w-[240px] lg:w-[72px]'}
      `}
    >
      {/* Brand Section */}
      <div className={`h-16 flex items-center px-4 border-b border-border-primary/50 border-gray-500 relative ${isExpanded ? 'justify-between' : 'justify-center lg:justify-center justify-between'}`}>
        <div className={`flex items-center transition-all duration-300 overflow-hidden ${isExpanded ? 'gap-3' : 'gap-3 lg:gap-0'}`}>
          <img 
            src="/logo.png" 
            alt="Storix Logo" 
            className="w-8 h-8 object-contain shrink-0"
          />
          <span className={`font-bold text-lg tracking-tight text-text-primary transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 opacity-100 w-auto'}`}>
            Storix
          </span>
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-tertiary border border-border-primary rounded-full items-center justify-center text-text-muted hover:text-accent-blue transition-colors shadow-sm z-50"
        >
          {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 no-scrollbar">
        {navGroups.map((group, groupIndex) => (
          <div key={group.title}>
            {/* Group Title - Only show if expanded or on mobile */}
            <div className={`
              px-3 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-wider transition-all duration-300
              ${isExpanded ? 'opacity-100 translate-x-0' : 'lg:opacity-0 lg:-translate-x-4 opacity-100 translate-x-0'}
            `}>
              {group.title}
            </div>

            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={`
                      w-full relative group
                      flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
                      ${isExpanded ? 'gap-3' : 'gap-3 lg:gap-0 lg:justify-center'}
                      ${isActive
                        ? 'bg-accent-blue/10 text-accent-blue shadow-sm'
                        : 'text-text-muted hover:text-text-primary hover:bg-tertiary/80'}
                    `}
                    title={!isExpanded ? item.label : undefined}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent-blue rounded-r-md lg:hidden" />
                    )}

                    <item.icon
                      size={20}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`shrink-0 transition-transform duration-200 ${hoveredItem === item.id && !isActive ? 'scale-110' : ''}`}
                    />

                    <span className={`
                      text-sm font-medium transition-all duration-300 origin-left overflow-hidden whitespace-nowrap
                      ${isExpanded ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 opacity-100 w-auto'}
                    `}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-border-primary bg-tertiary/30">
        <button className={`
            w-full flex items-center px-3 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-tertiary transition-colors group
            ${isExpanded ? 'justify-start gap-3' : 'justify-center lg:justify-center lg:gap-0 justify-start gap-3'}
         `}>
          <Bell size={20} className="shrink-0" />
          <span className={`text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap ${isExpanded ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 opacity-100 w-auto'}`}>
            Notifications
          </span>
          <span className="w-2 h-2 bg-accent-red rounded-full absolute top-3 right-3 lg:static lg:ml-auto"></span>
        </button>

        <button
          onClick={onLogout}
          className={`
             w-full flex items-center px-3 py-2 mt-1 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors group
             ${isExpanded ? 'justify-start gap-3' : 'justify-center lg:justify-center lg:gap-0 justify-start gap-3'}
           `}
        >
          <LogOut size={20} className="shrink-0" />
          <span className={`text-sm font-medium transition-all duration-300 whitespace-nowrap overflow-hidden ${isExpanded ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0 opacity-100 w-auto'}`}>
            Log Out
          </span>
        </button>
      </div>
    </aside>
  )
}
