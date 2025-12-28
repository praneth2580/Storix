import React, { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { InventoryTable } from './pages/InventoryTable'
import { Login } from './pages/Login'
import { Products } from './pages/Products'
import { SalesEntry } from './pages/SalesEntry'
import { PurchaseEntry } from './pages/PurchaseEntry'
import { Suppliers } from './pages/Suppliers'
import { Settings } from './pages/Settings'
import { POS } from './pages/POS'
import { Reports } from './pages/Reports'
import { Menu } from 'lucide-react'
export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }
  }, [])
  // Apply theme class
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }
  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }
  return (
    <div className="flex h-screen w-full bg-primary text-text-primary overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200 transition-colors duration-200">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-secondary border-b border-border-primary flex items-center px-4 z-50 justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-text-secondary"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-lg">Storix</span>
        </div>
      </div>

      {/* Persistent Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab)
            setIsSidebarOpen(false)
          }}
          onLogout={() => setIsAuthenticated(false)}
        />
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative pt-14 md:pt-0">
        {/* Top decorative line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-border-primary to-transparent z-10 hidden md:block"></div>

        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'pos' && <POS />}
        {activeTab === 'stock' && <InventoryTable />}
        {activeTab === 'products' && <Products />}
        {activeTab === 'sales' && <SalesEntry />}
        {activeTab === 'purchases' && <PurchaseEntry />}
        {activeTab === 'suppliers' && <Suppliers />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'settings' && (
          <Settings theme={theme} onToggleTheme={toggleTheme} />
        )}

        {/* Fallback for undefined routes */}
        {![
          'dashboard',
          'pos',
          'stock',
          'products',
          'sales',
          'purchases',
          'suppliers',
          'reports',
          'settings',
        ].includes(activeTab) && (
            <div className="flex items-center justify-center h-full text-text-muted flex-col gap-4">
              <div className="text-6xl font-mono opacity-20">404</div>
              <div className="text-xl">Module Not Found</div>
              <p className="text-sm max-w-md text-center font-mono">
                Error: The requested module "{activeTab}" could not be loaded.
              </p>
            </div>
          )}
      </main>
    </div>
  )
}
