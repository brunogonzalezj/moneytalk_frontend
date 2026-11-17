import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Download, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import Button from '../ui/Button';

// Chrome's install prompt event (not in the DOM typings yet)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Panel Principal',
  transactions: 'Transacciones',
  new: 'Nueva Transacción',
  reports: 'Reportes',
  budgets: 'Presupuestos',
  'recurring-payments': 'Pagos Recurrentes',
  manual: 'Manual',
  profile: 'Perfil',
};

const titleFor = (pathname: string) => {
  const last = pathname.split('/').filter(Boolean).pop();
  if (!last) return 'Panel Principal';
  return PAGE_TITLES[last] ?? last.charAt(0).toUpperCase() + last.slice(1);
};

const Header = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = titleFor(location.pathname);
  const [isScrolled, setIsScrolled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsUserMenuOpen(false);
  };

  const handleLogout = () => {
    void logout();
    setIsUserMenuOpen(false);
  };

  return (
    <header
      className={`bg-white dark:bg-gray-800 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] flex items-center justify-between transition-shadow ${
        isScrolled ? 'shadow-md dark:shadow-gray-700' : ''
      }`}
    >
      <div className="flex items-center">
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-50">{pageTitle}</h1>
      </div>

      <div className="flex items-center space-x-4">
        {showInstallButton && (
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={16} />}
            onClick={handleInstallClick}
            className="hidden md:flex"
          >
            Instalar App
          </Button>
        )}

        <button
          className="p-2 rounded-full hover:bg-base-200 dark:hover:bg-gray-700 transition-colors relative"
          aria-label="Notificaciones"
        >
          <Bell size={20} className="text-gray-600 dark:text-gray-300" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </button>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Menú de usuario"
          >
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 hidden sm:block">
              {user?.displayName || user?.name || user?.email}
            </span>
            <div className="avatar placeholder">
              {user?.avatar ? (
                <div className="w-10 h-10 rounded-full">
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="bg-gray-600 dark:bg-gray-500 text-white rounded-full w-10 h-10 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                  <User size={18} />
                </div>
              )}
            </div>
            <ChevronDown size={16} className="text-gray-500 hidden sm:block" />
          </button>

          {/* Menú desplegable */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="py-1">
                <button
                  onClick={handleProfileClick}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User size={16} className="mr-3" />
                  Perfil
                </button>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={16} className="mr-3" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;