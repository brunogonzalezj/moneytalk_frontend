import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListOrdered, 
  BarChart3, 
  UserCircle, 
  LogOut, 
  Plus, 
  ChevronLeft 
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import Logo from './Logo';

const Sidebar = () => {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const { logout } = useAuthStore();

  return (
    <div className="w-64 h-full bg-white shadow-lg">
      <div className="flex items-center justify-between h-16 px-4 border-b">
        <Logo />
        <button 
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-2 rounded-md hover:bg-base-200 transition-colors"
          aria-label="Cerrar menú"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <nav className="px-2 py-4">
        <ul className="space-y-1">
          <li>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-700 hover:bg-base-200'
                }`
              }
            >
              <LayoutDashboard size={18} className="mr-3" />
              Panel Principal
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/transactions" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-700 hover:bg-base-200'
                }`
              }
            >
              <ListOrdered size={18} className="mr-3" />
              Transacciones
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/transactions/new" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-700 hover:bg-base-200'
                }`
              }
            >
              <Plus size={18} className="mr-3" />
              Nueva Transacción
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/reports" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-700 hover:bg-base-200'
                }`
              }
            >
              <BarChart3 size={18} className="mr-3" />
              Reportes
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/profile" 
              className={({ isActive }) => 
                `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-700 hover:bg-base-200'
                }`
              }
            >
              <UserCircle size={18} className="mr-3" />
              Perfil
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t">
        <button 
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-base-200 transition-colors"
        >
          <LogOut size={18} className="mr-3" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;