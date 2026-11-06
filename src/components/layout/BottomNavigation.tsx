import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, PiggyBank, BarChart3, RefreshCw } from 'lucide-react';

const BottomNavigation = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Backdrop blur effect */}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700"></div>
      
      {/* Navigation items */}
      <nav className="relative px-2 py-2">
        <div className="flex items-center justify-around">
          {/* Dashboard */}
          <NavLink 
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary-100 dark:bg-primary-900 scale-110' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                  <LayoutDashboard size={20} />
                </div>
                <span className="text-xs font-medium mt-1">Inicio</span>
              </>
            )}
          </NavLink>

          {/* Transactions */}
          <NavLink 
            to="/transactions"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary-100 dark:bg-primary-900 scale-110' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                  <ListOrdered size={20} />
                </div>
                <span className="text-xs font-medium mt-1">Lista</span>
              </>
            )}
          </NavLink>

          
          {/* Budgets */}
          <NavLink 
            to="/budgets"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary-100 dark:bg-primary-900 scale-110' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                  <PiggyBank size={20} />
                </div>
                <span className="text-xs font-medium mt-1">Metas</span>
              </>
            )}
          </NavLink>

          {/* Recurring Payments */}
          <NavLink
            to="/recurring-payments"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary-100 dark:bg-primary-900 scale-110' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                  <RefreshCw size={20} />
                </div>
                <span className="text-xs font-medium mt-1">Pagos</span>
              </>
            )}
          </NavLink>

          {/* Reports */}
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary-100 dark:bg-primary-900 scale-110' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                  <BarChart3 size={20} />
                </div>
                <span className="text-xs font-medium mt-1">Reportes</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default BottomNavigation;