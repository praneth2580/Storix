import { useState } from 'react';
import { Routes, Route, NavLink, Outlet, Navigate } from 'react-router-dom';
import { routeConfig } from './routes';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import DarkModeToggle from './components/DarkModeToggle';

const Layout = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };
  
  return (
    <div
      className={`flex h-screen bg-gray-100 dark:bg-gray-950 ${isNavOpen ? "overflow-hidden" : ""
        }`}
    >
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-2 
      bg-white dark:bg-gray-900
      border-b border-gray-200 dark:border-gray-700
      w-full fixed z-50" id='mobile-top-nav'>
        <button
          className="text-2xl bg-transparent border-none cursor-pointer text-black dark:text-gray-300"
          onClick={toggleNav}
        >
          &#9776;
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav
        className={`
      fixed top-0 left-0 h-full w-64 flex-shrink-0
      bg-white dark:bg-gray-900
      border-r border-gray-200 dark:border-gray-700
      p-5 flex flex-col transition-transform duration-300 ease-in-out
      md:relative md:translate-x-0
      ${isNavOpen ? "translate-x-0 z-50" : "-translate-x-full"}
    `}
      >
        {/* Banner */}
        <div className="flex items-center mb-5">
          <div
            className={`bg-[url(/Storix/banner.png)] w-full h-15 mr-3 bg-cover bg-center rounded`}
          />
        </div>

        {/* Navigation Links */}
        <ul className="list-none p-0 m-0 h-full">
          {routeConfig.filter(route => route.hideInSidebar != true).map((route) => (
            <li key={route.path}>
              <NavLink
                to={route.path}
                className={({ isActive }) =>
                  `
              block p-4 rounded-lg mb-2 transition-colors duration-300
              text-gray-700 dark:text-gray-300
              ${isActive
                    ? "bg-blue-100 dark:bg-blue-900/60 text-blue-500 dark:text-blue-400 font-bold"
                    : "hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-500 dark:hover:text-blue-300"
                  }
            `
                }
                onClick={() => setIsNavOpen(false)}
              >
                {route.name}
              </NavLink>
            </li>
          ))}

          {/* POS Button */}
          <li key="/pos">
            <NavLink
              to="/pos"
              target="_blank"
              rel="noopener noreferrer"
              className={({ isActive }) =>
                `
            block p-4 text-center font-bold rounded-lg mb-2 transition-colors duration-300
            bg-blue-400 dark:bg-blue-600 text-white
            ${isActive
                  ? "bg-blue-500 dark:bg-blue-700"
                  : "hover:bg-blue-500 dark:hover:bg-blue-700"
                }
          `
              }
              onClick={() => setIsNavOpen(false)}
            >
              POS
            </NavLink>
          </li>
        </ul>

        {/* Dark Mode Toggle */}
        <div className="self-start">
          <DarkModeToggle />
        </div>
      </nav>

      {/* Backdrop on mobile */}
      {isNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleNav}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-grow p-5 overflow-y-auto mt-12 md:mt-0 text-gray-800 dark:text-gray-200">
        <Outlet />
      </main>
    </div>
  )
};

const ProtectedRoute = ({
  isAllowed,
  children,
}: {
  isAllowed: boolean;
  children: React.ReactNode;
}) => {
  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function App() {
  const [isScriptIDPresent, setIsScriptIDPresent] = useState<boolean>(true);

  // Check localStorage for 'hideGettingStarted' on initial load
  useState<() => void>(() => {
    const scriptId: string | null = localStorage.getItem('VITE_GOOGLE_SCRIPT_ID');
    if (scriptId === '' || !scriptId) {
      setIsScriptIDPresent(false);
    }
  });

  // Effect to listen for changes in localStorage
  useState<() => void>(() => {
    const handleStorageChange = (): void => {
      const scriptId: string | null = localStorage.getItem('VITE_GOOGLE_SCRIPT_ID');
      setIsScriptIDPresent(scriptId === '' || !scriptId);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  });

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Home route — always allowed */}
        <Route index element={<DashboardPage />} />

        {routeConfig.map((route) => {
          // const Component = pageComponents[route.name];
          const Component = route.component;
          if (!Component || route.path === "/") return null;

          return (
            <Route
              key={route.path}
              path={route.path.substring(1)}
              element={
                <ProtectedRoute isAllowed={isScriptIDPresent}>
                  <Component />
                </ProtectedRoute>
              }
            />
          );
        })}
      </Route>
      <Route
        key='/pos'
        path="pos"
        element={
          <ProtectedRoute isAllowed={isScriptIDPresent}>
            <POSPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;