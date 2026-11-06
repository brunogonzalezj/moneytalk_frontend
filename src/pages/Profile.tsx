import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Save, Moon, Sun, Monitor, BookOpen } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useTransactionStore } from '../stores/transactionStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ChangePasswordForm from '../components/ChangePasswordForm';
import NotificationSettings from '../components/NotificationSettings';
import ExportDataModal from '../components/transactions/ExportDataModal';

interface ProfileFormValues {
  displayName: string;
  email: string;
}

const Profile = () => {
  const { user, updateProfile } = useAuthStore();
  const { enableVoiceHints, setEnableVoiceHints, theme, setTheme } = useUIStore();
  const { exportTransactions } = useTransactionStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<ProfileFormValues>({
    defaultValues: {
      displayName: user?.displayName || '',
      email: user?.email || '',
    },
  });
  
  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    
    try {
      await updateProfile({
        displayName: data.displayName,
      });
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportData = async (payload: { fromDate: string; toDate: string; format: 'csv' | 'xlsx' }) => {
    await exportTransactions(payload);
  };
  
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Configuración del Perfil</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Información Personal">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary-200 dark:border-primary-800"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center">
                      <User size={40} className="text-primary-600 dark:text-primary-300" />
                    </div>
                  )}
                  {user?.provider === 'google' && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className="font-medium text-gray-800 dark:text-gray-200">{user?.displayName || user?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                  {user?.provider === 'google' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 mt-1">
                      Cuenta Google
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-gray-700 dark:text-gray-300">Nombre de Usuario</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <User size={18} />
                    </span>
                    <input
                      type="text"
                      placeholder="Tu Nombre"
                      className={`input input-bordered w-full pl-10 ${errors.displayName ? 'input-error' : ''}`}
                      {...register('displayName', { 
                        required: 'El nombre es requerido',
                      })}
                    />
                  </div>
                  {errors.displayName && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.displayName.message}</span>
                    </label>
                  )}
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      className="input input-bordered w-full pl-10"
                      disabled
                      {...register('email')}
                    />
                  </div>
                  <label className="label">
                    <span className="label-text-alt text-gray-500 dark:text-gray-400">El correo electrónico no se puede cambiar</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  icon={<Save size={16} />}
                >
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card title="Preferencias">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Reconocimiento de Voz</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    id="enableVoiceHints"
                    checked={enableVoiceHints}
                    onChange={(e) => setEnableVoiceHints(e.target.checked)}
                  />
                  <label htmlFor="enableVoiceHints" className="ml-2 text-gray-600 dark:text-gray-300">
                    Mostrar sugerencias de voz
                  </label>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Muestra consejos útiles al usar la entrada de voz para agregar transacciones
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Tema</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                      theme === 'light'
                        ? 'bg-primary-100 text-primary-800 font-medium border-primary-200 dark:bg-primary-900 dark:text-primary-200'
                        : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setTheme('light')}
                  >
                    <Sun size={16} className="mr-2" />
                    Claro
                  </button>

                  <button
                    type="button"
                    className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                      theme === 'dark'
                        ? 'bg-primary-100 text-primary-800 font-medium border-primary-200 dark:bg-primary-900 dark:text-primary-200'
                        : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setTheme('dark')}
                  >
                    <Moon size={16} className="mr-2" />
                    Oscuro
                  </button>

                  <button
                    type="button"
                    className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                      theme === 'auto'
                        ? 'bg-primary-100 text-primary-800 font-medium border-primary-200 dark:bg-primary-900 dark:text-primary-200'
                        : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => setTheme('auto')}
                  >
                    <Monitor size={16} className="mr-2" />
                    Automático
                  </button>
                </div>
                {theme === 'auto' && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                    El tema se ajusta automáticamente a la configuración de tu sistema
                  </p>
                )}
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Seguridad</h3>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowChangePasswordModal(true)}
                >
                  Cambiar Contraseña
                </Button>

                <Button
                  variant="outline"
                  className="mt-2"
                  fullWidth
                >
                  Autenticación de Dos Factores
                </Button>
              </div>
            </div>
          </Card>
          
          <Card className="mt-6" title="Cuenta">
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Administra la configuración y preferencias de tu cuenta
              </p>
              
              <Button
                variant="ghost"
                className="text-primary-500 hover:bg-primary-50 hover:text-primary-600 w-full justify-start"
                icon={<BookOpen size={16} />}
                onClick={() => window.open('/manual', '_blank')}
              >
                Ver Manual
              </Button>
              
              <Button
                variant="ghost"
                className="text-accent-500 hover:bg-accent-50 hover:text-accent-600 w-full justify-start"
                onClick={() => setShowExportModal(true)}
              >
                Exportar Todos los Datos
              </Button>
              
              <Button
                variant="ghost"
                className="text-accent-500 hover:bg-accent-50 hover:text-accent-600 w-full justify-start"
              >
                Eliminar Cuenta
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="lg:col-span-1">
        <NotificationSettings />
      </div>

      <ChangePasswordForm
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onSubmit={handleExportData}
      />
    </div>
  );
};

export default Profile;