import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListOrdered, 
  BarChart3, 
  UserCircle, 
  Plus
} from 'lucide-react';

const BottomNavigation = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Backdrop blur effect */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-lg border-t border-gray-200"></div>
      
      {/* Navigation items */}
      <nav className="relative px-2 py-2">
        <div className="flex items-center justify-around">
          {/* Dashboard */}
          <NavLink 
            to="/dashboard"
            className={({ isActive }) => 
              `flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                isActive 
                  ? 'text-primary-600' 
                  : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary-100 scale-110' : 'hover:bg-gray-100'
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
                  ? 'text-primary-600' 
                  : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary-100 scale-110' : 'hover:bg-gray-100'
                }`}>
                  <ListOrdered size={20} />
                </div>
                <span className="text-xs font-medium mt-1">Lista</span>
              </>
            )}
          </NavLink>

          {/* Add Transaction - Floating Action Button */}
          <NavLink 
            to="/transactions/new"
            className="flex flex-col items-center justify-center"
          >
            {({ isActive }) => (
              <>
                <div className={`p-3 rounded-full shadow-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary-600 scale-110' 
                    : 'bg-primary-500 hover:bg-primary-600 hover:scale-105'
                }`}>
                  <Plus size={24} className="text-white" />
                </div>
                <span className="text-xs font-medium mt-1 text-primary-600">Agregar</span>
              </>
            )}
          </NavLink>

          {/* Reports */}
          <NavLink 
            to="/reports"
            className={({ isActive }) => 
              `flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                isActive 
                  ? 'text-primary-600' 
                  : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary-100 scale-110' : 'hover:bg-gray-100'
                }`}>
                  <BarChart3 size={20} />
                </div>
                <span className="text-xs font-medium mt-1">Reportes</span>
              </>
            )}
          </NavLink>

          {/* Profile */}
          <NavLink 
            to="/profile"
            className={({ isActive }) => 
              `flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-[60px] ${
                isActive 
                  ? 'text-primary-600' 
                  : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary-100 scale-110' : 'hover:bg-gray-100'
                }`}>
                  <UserCircle size={20} />
                </div>
                <span className="text-xs font-medium mt-1">Perfil</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default BottomNavigation;