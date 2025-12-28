import React from 'react'
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
} from 'lucide-react'
interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
}
export function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  const navItems = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
    },
    {
      id: 'pos',
      icon: ScanBarcode,
      label: 'POS Terminal',
    },
    {
      id: 'products',
      icon: Package,
      label: 'Products',
    },
    {
      id: 'stock',
      icon: BoxIcon,
      label: 'Stock Manager',
    },
    {
      id: 'sales',
      icon: ShoppingCart,
      label: 'Sales Entry',
    },
    {
      id: 'purchases',
      icon: CreditCard,
      label: 'Purchases',
    },
    {
      id: 'suppliers',
      icon: Users,
      label: 'Suppliers',
    },
    {
      id: 'reports',
      icon: FileText,
      label: 'Reports',
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
    },
  ]
  return (
    <aside className="w-[240px] lg:w-[60px] bg-tertiary border-r border-border-primary flex flex-col items-center py-6 h-full transition-all duration-300">
      {/* Logo/Brand */}
      <div className="mb-8 w-8 h-8 bg-accent-blue rounded flex items-center justify-center text-white font-bold text-xs shadow-[0_0_15px_rgba(59,130,246,0.3)] shrink-0">
        S
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full flex flex-col gap-2 overflow-y-auto no-scrollbar px-2 lg:px-0">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full h-12 flex items-center lg:justify-center relative group transition-all duration-200 rounded-md px-4 lg:px-0
                ${isActive ? 'text-accent-blue bg-secondary' : 'text-text-muted hover:text-text-primary hover:bg-secondary/50'}
              `}
              aria-label={item.label}
              title={item.label}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-accent-blue rounded-full lg:rounded-none lg:top-0 lg:bottom-0 lg:left-0" />
              )}
              <item.icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className="shrink-0"
              />

              {/* Label for mobile drawer */}
              <span className="ml-3 text-sm font-medium lg:hidden">
                {item.label}
              </span>

              {/* Tooltip for desktop collapsed */}
              <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-secondary text-text-primary text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-border-primary shadow-lg font-mono">
                {item.label}
              </div>
            </button>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-4 w-full items-center mb-4 mt-4 pt-4 border-t border-border-primary shrink-0">
        <button className="text-text-muted hover:text-text-primary transition-colors relative group">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-accent-red rounded-full border-2 border-tertiary"></span>
        </button>
        <button
          onClick={onLogout}
          className="text-text-muted hover:text-accent-red transition-colors group relative"
        >
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  )
}
