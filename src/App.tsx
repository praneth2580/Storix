import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from './store'
import {
  setAuthenticated,
  setActiveTab,
  setTheme,
  toggleTheme,
  setSidebarOpen,
  toggleSidebar,
} from './store/slices/uiSlice'

// Valid tabs for routing
const VALID_TABS = [
  'dashboard',
  'pos',
  'stock',
  'products',
  'sales',
  'purchases',
  'suppliers',
  'customers',
  'reports',
  'logs',
  'settings',
] as const;

type ValidTab = typeof VALID_TABS[number];
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { InventoryTable } from './pages/InventoryTable'
import { Login } from './pages/Login'
import { Products } from './pages/Products'
import { SalesEntry } from './pages/SalesEntry'
import { PurchaseEntry } from './pages/PurchaseEntry'
import { Suppliers } from './pages/Suppliers'
import { Customers } from './pages/Customers'
import { Settings } from './pages/Settings'
import { POS } from './pages/POS'
import { Reports } from './pages/Reports'
import { Logs } from './pages/Logs'
import { Menu } from 'lucide-react'
import { SnackbarContainer } from './components/Snackbar'
import { NetworkStatus } from './components/NetworkStatus'
import { useAppSelector, useAppDispatch } from './store/hooks'
import { removeSnackbar } from './store/slices/snackbarSlice'
import { getAccounts } from './models/accounts/accounts';

export function App() {
  const dispatch = useDispatch()
  const appDispatch = useAppDispatch()
  const { isAuthenticated, activeTab, theme, isSidebarOpen } = useSelector(
    (state: RootState) => state.ui
  )
  const snackbarMessages = useAppSelector(state => state.snackbar.messages)

  // Function to update URL without page reload
  const updateURL = (tab: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', tab);
    window.history.pushState({ page: tab }, '', url.toString());
  }

  // Function to get tab from URL
  const getTabFromURL = (): ValidTab => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('page') as ValidTab | null;
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return 'dashboard';
  }

  // Initialize theme and restore from URL
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const script_id = localStorage.getItem('VITE_GOOGLE_SCRIPT_ID') as string | null;

    if (savedTheme) {
      dispatch(setTheme(savedTheme))
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      dispatch(setTheme('dark'))
    }

    if (script_id) dispatch(setAuthenticated(true))

    // Restore activeTab from URL query parameter
    const tabFromUrl = getTabFromURL();
    dispatch(setActiveTab(tabFromUrl));
    if (!window.location.search.includes('page=')) {
      updateURL(tabFromUrl);
    }
  }, [dispatch])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const tabFromUrl = getTabFromURL();
      dispatch(setActiveTab(tabFromUrl));
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [dispatch])

  // Update URL when activeTab changes (but avoid infinite loop)
  useEffect(() => {
    if (isAuthenticated && activeTab) {
      const currentTabFromUrl = getTabFromURL();
      if (currentTabFromUrl !== activeTab) {
        updateURL(activeTab);
      }
    }
  }, [activeTab, isAuthenticated])

  // Apply theme class
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const handleToggleTheme = () => {
    dispatch(toggleTheme())
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => dispatch(setAuthenticated(true))} />
  }

  return (
    <div className="flex h-screen w-full bg-primary text-text-primary overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200 transition-colors duration-200">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-secondary border-b border-border-primary flex items-center px-4 z-50 justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="text-text-secondary"
          >
            <Menu size={24} />
          </button>
          <img 
            src="/logo.png" 
            alt="Storix Logo" 
            className="h-6 w-auto object-contain"
          />
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
            dispatch(setActiveTab(tab))
            dispatch(setSidebarOpen(false))
            updateURL(tab)
          }}
          onLogout={() => dispatch(setAuthenticated(false))}
        />
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
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
        {activeTab === 'customers' && <Customers />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'logs' && <Logs />}
        {activeTab === 'settings' && (
          <Settings theme={theme} onToggleTheme={handleToggleTheme} />
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
          'customers',
          'reports',
          'logs',
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

      {/* Network Status */}
      <NetworkStatus />
      
      {/* Snackbar Container */}
      <SnackbarContainer
        messages={snackbarMessages}
        onClose={(id) => appDispatch(removeSnackbar(id))}
      />
    </div>
  )
}
