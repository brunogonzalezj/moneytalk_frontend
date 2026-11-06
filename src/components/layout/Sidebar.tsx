import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, PiggyBank, RefreshCw, BarChart3, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import Logo from './Logo';

const Sidebar = () => {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-800 shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800">
        <Logo />
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-2 rounded-full hover:bg-white/50 dark:hover:bg-gray-700 transition-all duration-200 text-primary-600 dark:text-primary-300"
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>
      </div>

  
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto bg-white dark:bg-gray-800">
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary-600 dark:hover:text-primary-300'
                }`
              }
            >
              <LayoutDashboard size={20} className="mr-3 transition-transform group-hover:scale-110" />
              Panel Principal
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/transactions"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary-600 dark:hover:text-primary-300'
                }`
              }
            >
              <ListOrdered size={20} className="mr-3 transition-transform group-hover:scale-110" />
              Transacciones
            </NavLink>
          </li>
                    <li>
            <NavLink
              to="/budgets"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary-600 dark:hover:text-primary-300'
                }`
              }
            >
              <PiggyBank size={20} className="mr-3 transition-transform group-hover:scale-110" />
              Presupuestos
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/recurring-payments"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary-600 dark:hover:text-primary-300'
                }`
              }
            >
              <RefreshCw size={20} className="mr-3 transition-transform group-hover:scale-110" />
              Pagos Recurrentes
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary-600 dark:hover:text-primary-300'
                }`
              }
            >
              <BarChart3 size={20} className="mr-3 transition-transform group-hover:scale-110" />
              Reportes
            </NavLink>
          </li>
                  </ul>
      </nav>
    </div>
  );
};

export default Sidebar;