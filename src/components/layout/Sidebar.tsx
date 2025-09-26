import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, PiggyBank, RefreshCw, BarChart3, CircleUser as UserCircle, LogOut, Plus, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import Logo from './Logo';

const Sidebar = () => {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const { logout, user } = useAuthStore();

  return (
    <div className="w-64 h-full bg-white shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
        <Logo />
        <button 
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-2 rounded-full hover:bg-white/50 transition-all duration-200 text-primary-600"
          aria-label="Cerrar menú"
        >
          <X size={20} />
        </button>
      </div>

      {/* User Info - Mobile Only */}
      <div className="md:hidden px-4 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="avatar placeholder">
            <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center">
              <span className="text-sm font-medium">
                {user?.displayName 
                  ? user.displayName.substring(0, 2).toUpperCase() 
                  : user?.email?.substring(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.displayName || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          <li>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary-500 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
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
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                }`
              }
            >
              <ListOrdered size={20} className="mr-3 transition-transform group-hover:scale-110" />
              Transacciones
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/transactions/new" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary-500 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                }`
              }
            >
              <Plus size={20} className="mr-3 transition-transform group-hover:scale-110" />
              Nueva Transacción
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/reports" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary-500 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                }`
              }
            >
              <BarChart3 size={20} className="mr-3 transition-transform group-hover:scale-110" />
              Reportes
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/profile" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary-500 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                }`
              }
            >
              <UserCircle size={20} className="mr-3 transition-transform group-hover:scale-110" />
              Perfil
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button 
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
        >
          <LogOut size={20} className="mr-3 transition-transform group-hover:scale-110" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;