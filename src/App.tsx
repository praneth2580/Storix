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
import { getStoredSpreadsheetId, setStoredSpreadsheetId, googleSheetsApi } from './services/googleSheetsApi'

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
  'privacy-policy',
  'terms-of-service',
  'help-spreadsheet-id',
  'landing',
  'login',
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
import { Menu, AlertTriangle, HelpCircle } from 'lucide-react'
import { SnackbarContainer } from './components/Snackbar'
import { NetworkStatus } from './components/NetworkStatus'
import { useAppSelector, useAppDispatch } from './store/hooks'
import { removeSnackbar } from './store/slices/snackbarSlice'
import { getAccounts } from './models/accounts/accounts';
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { TermsOfService } from './pages/TermsOfService'
import { HelpSpreadsheetId } from './pages/HelpSpreadsheetId'
import { LandingPage } from './pages/LandingPage'

export function App() {
  const dispatch = useDispatch()
  const appDispatch = useAppDispatch()
  const { isAuthenticated, activeTab, theme, isSidebarOpen } = useSelector(
    (state: RootState) => state.ui
  )
  const snackbarMessages = useAppSelector(state => state.snackbar.messages)

  const [isSheetBlocked, setIsSheetBlocked] = React.useState(false);
  const [sheetIdInput, setSheetIdInput] = React.useState('');
  const [isVerifyingSheet, setIsVerifyingSheet] = React.useState(false);
  const [uninitializedId, setUninitializedId] = React.useState('');

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
    return 'landing';
  }

  // Initialize theme and checkout auth on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

    // Initialize theme
    if (savedTheme) {
      dispatch(setTheme(savedTheme))
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      dispatch(setTheme('dark'))
    }

    // Initialize OAuth authentication (client ID from .env)
    if (clientId) {
      import('./services/googleAuth').then(({ googleAuth }) => {
        // Immediate check from localStorage
        if (googleAuth.isAuthenticated()) {
          dispatch(setAuthenticated(true));
        }

        googleAuth.initialize(clientId).catch((err) => {
          console.error('Failed to initialize Google Auth:', err);
        });
      });
    }

    // Restore activeTab from URL query parameter
    const tabFromUrl = getTabFromURL();
    dispatch(setActiveTab(tabFromUrl));
    if (!window.location.search.includes('page=')) {
      updateURL(tabFromUrl);
    }
  }, [dispatch])

  // Check Sheet ID validity on auth
  useEffect(() => {
    if (isAuthenticated) {
      const storedId = getStoredSpreadsheetId();
      // Only block if ID is empty or it's the default ID but the user might not have access
      // Let's verify access to whatever is stored.
      setIsSheetBlocked(false); // Reset while checking

      googleSheetsApi.verifySheetAccess(storedId).then(isAccessible => {
        if (!isAccessible) {
          setIsSheetBlocked(true);
        }
      });
    }
  }, [isAuthenticated]);

  const saveAndApplySheetId = (id: string) => {
    setStoredSpreadsheetId(id);
    const savedIds = JSON.parse(localStorage.getItem('saved_google_sheet_ids') || '[]');
    if (!savedIds.includes(id)) {
      localStorage.setItem('saved_google_sheet_ids', JSON.stringify([...savedIds, id]));
    }
    setIsSheetBlocked(false);
    window.location.reload();
  };

  const handleVerifyGlobalSheetId = async () => {
    if (!sheetIdInput.trim()) return;
    setIsVerifyingSheet(true);
    try {
      const id = sheetIdInput.trim();
      const isAccessible = await googleSheetsApi.verifySheetAccess(id);
      if (isAccessible) {
        setStoredSpreadsheetId(id); // Temporarily set it so API calls can read it
        const status = await googleSheetsApi.checkSpreadsheetStatus(id);

        if (status === 'empty') {
          // Auto initialize if empty
          const initSuccess = await googleSheetsApi.initializeSpreadsheet(id, false);
          if (initSuccess) {
            saveAndApplySheetId(id);
          } else {
            alert('Connected, but failed to initialize the required sheets.');
          }
        } else if (status === 'not_empty') {
          // Prompt user to overwrite
          setUninitializedId(id);
        } else {
          alert('Failed to check the spreadsheet status.');
        }
      } else {
        alert('Access Denied. Please ensure the Google Sheet ID is correct and shared with your authenticated Google account.');
      }
    } catch {
      alert('Error verifying Sheet ID.');
    } finally {
      setIsVerifyingSheet(false);
    }
  };

  const handleConfirmOverwrite = async () => {
    if (!uninitializedId) return;
    setIsVerifyingSheet(true);
    try {
      setStoredSpreadsheetId(uninitializedId);
      const success = await googleSheetsApi.initializeSpreadsheet(uninitializedId, true);
      if (success) {
        saveAndApplySheetId(uninitializedId);
      } else {
        alert('Failed to initialize and overwrite the sheet.');
      }
    } catch {
      alert('Error during initialization.');
    } finally {
      setIsVerifyingSheet(false);
      setUninitializedId('');
    }
  };

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

  if (activeTab === 'privacy-policy') {
    return <PrivacyPolicy />
  }

  if (activeTab === 'terms-of-service') {
    return <TermsOfService />
  }

  if (activeTab === 'help-spreadsheet-id') {
    return <HelpSpreadsheetId />
  }

  if (activeTab === 'landing') {
    return <LandingPage />
  }

  if (activeTab === 'login') {
    if (isAuthenticated) {
      // Already authenticated, redirect to dashboard
      dispatch(setActiveTab('dashboard'));
      updateURL('dashboard');
      return null;
    }
    return <Login onLogin={() => {
      dispatch(setAuthenticated(true));
      dispatch(setActiveTab('dashboard'));
      updateURL('dashboard');
    }} />
  }

  if (!isAuthenticated) {
    // If not landing/help/privacy, show landing page as the home for unauthenticated users
    return <LandingPage />
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
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Storix Logo"
            className="h-6 w-auto object-contain"
          />
          <span className="font-bold text-lg">Storix</span>
        </div>
      </div>

      {/* Global Sheet ID Block Modal */}
      {isSheetBlocked && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
          <div className="bg-secondary p-8 rounded-lg shadow-2xl max-w-md w-full border border-accent-blue/50 text-center">
            <div className="w-16 h-16 bg-accent-blue/20 text-accent-blue rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Connect Google Sheets</h2>
            <p className="text-text-muted mb-6 text-sm">
              Your account doesn't have access to the currently configured Google Sheet database. Please enter a valid Google Spreadsheet ID that your account can access to continue.
            </p>
            <a
              href="?page=help-spreadsheet-id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-accent-blue hover:underline text-xs mb-4"
            >
              <HelpCircle size={14} />
              How do I find my Spreadsheet ID?
            </a>
            {uninitializedId ? (
              <div className="space-y-4">
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 mb-4 text-sm text-left">
                  <span className="font-bold flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} /> Warning: Sheet is not empty
                  </span>
                  The Google Sheet you provided already contains data or other sheets. Using it as your database requires deleting existing conflicting sheets (like Products, Sales, etc.) and initializing the system schema.
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setUninitializedId('')}
                    disabled={isVerifyingSheet}
                    className="flex-1 bg-secondary border border-border-primary hover:bg-tertiary text-text-primary font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmOverwrite}
                    disabled={isVerifyingSheet}
                    className="flex-1 bg-accent-red hover:bg-red-600 text-white font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isVerifyingSheet ? 'Initializing...' : 'Delete & Initialize'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Google Spreadsheet ID"
                  value={sheetIdInput}
                  onChange={e => setSheetIdInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyGlobalSheetId()}
                  className="w-full bg-primary border border-border-primary p-3 rounded-md focus:border-accent-blue focus:outline-none font-mono text-center"
                  autoFocus
                />
                <button
                  onClick={handleVerifyGlobalSheetId}
                  disabled={!sheetIdInput.trim() || isVerifyingSheet}
                  className="w-full bg-accent-blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  {isVerifyingSheet ? 'Verifying Access...' : 'Connect Database'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
          onLogout={async () => {
            // Sign out from Google OAuth (client ID from .env)
            if (import.meta.env.VITE_GOOGLE_CLIENT_ID) {
              try {
                const { googleAuth } = await import('./services/googleAuth');
                await googleAuth.signOut();
              } catch (error) {
                console.error('Error signing out:', error);
              }
            }
            // Clear authentication state
            dispatch(setAuthenticated(false));
          }}
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
          'privacy-policy',
          'terms-of-service',
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
