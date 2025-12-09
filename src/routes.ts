import DashboardPage from "./pages/DashboardPage";
import ProductPage from "./pages/ProductPage";
import StockPage from "./pages/StockPage";
import SalesPage from "./pages/SalesPage";
import PurchasesPage from "./pages/PurchasesPage";
import SuppliersPage from "./pages/SuppliersPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";
import AboutPage from "./pages/AboutPage";
import CustomerPage from "./pages/CustomerPage";
import InvoicePage from "./pages/InvoicePage";

export interface RouteItem {
  path: string;
  name: string;
  icon: string;
  hideInSidebar?: boolean;
  component: React.ComponentType;
}

export const routeConfig: RouteItem[] = [
  {
    path: '/',
    name: 'Dashboard',
    icon: '/logo.png',
    component: DashboardPage,
  },
  {
    path: '/product',
    name: 'Product',
    icon: '/logo.png',
    component: ProductPage,
  },
  {
    path: '/customer',
    name: 'Customer',
    icon: '/logo.png',
    component: CustomerPage,
  },
  {
    path: '/stock',
    name: 'Stock',
    icon: '/logo.png',
    component: StockPage,
  },
  {
    path: '/sales',
    name: 'Sales',
    icon: '/logo.png',
    component: SalesPage,
  },
  {
    path: '/purchases',
    name: 'Purchases',
    icon: '/logo.png',
    component: PurchasesPage,
  },
  {
    path: '/suppliers',
    name: 'Suppliers',
    icon: '/logo.png',
    component: SuppliersPage,
  },
  {
    path: '/reports',
    name: 'Reports',
    icon: '/logo.png',
    component: ReportsPage,
  },
  {
    path: '/settings',
    name: 'Settings',
    icon: '/logo.png',
    component: SettingsPage,
  },
  {
    path: '/help',
    name: 'Help',
    icon: '/logo.png',
    component: HelpPage,
  },
  {
    path: '/about',
    name: 'About',
    icon: '/logo.png',
    component: AboutPage,
  },
  {
    path: '/invoice/:OI',
    name: 'Invoice',
    icon: '/logo.png',
    hideInSidebar: true,
    component: InvoicePage,
  },
];
