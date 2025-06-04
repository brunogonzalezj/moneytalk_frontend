import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Save, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

interface ProfileFormValues {
  displayName: string;
  email: string;
}

const Profile = () => {
  const { user, updateProfile } = useAuthStore();
  const { enableVoiceHints, setEnableVoiceHints, theme, setTheme } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Configuración del Perfil</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Información Personal">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Nombre de Usuario</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
                    <span className="label-text font-medium">Correo Electrónico</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
                    <span className="label-text-alt text-gray-500">El correo electrónico no se puede cambiar</span>
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
                <h3 className="font-medium text-gray-700 mb-2">Reconocimiento de Voz</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    id="enableVoiceHints"
                    checked={enableVoiceHints}
                    onChange={(e) => setEnableVoiceHints(e.target.checked)}
                  />
                  <label htmlFor="enableVoiceHints" className="ml-2 text-gray-600">
                    Mostrar sugerencias de voz
                  </label>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  Muestra consejos útiles al usar la entrada de voz para agregar transacciones
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Tema</h3>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    className={`flex items-center px-3 py-2 rounded-md ${
                      theme === 'light'
                        ? 'bg-primary-100 text-primary-800 font-medium'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setTheme('light')}
                  >
                    <Sun size={18} className="mr-2" />
                    Claro
                  </button>
                  
                  <button
                    type="button"
                    className={`flex items-center px-3 py-2 rounded-md ${
                      theme === 'dark'
                        ? 'bg-primary-100 text-primary-800 font-medium'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setTheme('dark')}
                  >
                    <Moon size={18} className="mr-2" />
                    Oscuro
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Seguridad</h3>
                <Button
                  variant="outline"
                  fullWidth
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
              <p className="text-gray-600">
                Administra la configuración y preferencias de tu cuenta
              </p>
              
              <Button
                variant="ghost"
                className="text-accent-500 hover:bg-accent-50 hover:text-accent-600 w-full justify-start"
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
    </div>
  );
};

export default Profile;