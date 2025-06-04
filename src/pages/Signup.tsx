import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { User, KeyRound, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/ui/Button';
import Logo from '../components/layout/Logo';

interface SignupFormValues {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isLoading } = useAuthStore();
  const navigate = useNavigate();
  
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors } 
  } = useForm<SignupFormValues>({
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  const password = watch('password');
  
  const onSubmit = async (data: SignupFormValues) => {
    try {
      await signup(data.email, data.password, data.displayName);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error de registro:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="card bg-white shadow-xl max-w-md w-full p-8 animate-fade-in">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Crear Cuenta</h1>
          <p className="text-gray-600 mt-2">Únete a MoneyTalk hoy</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Nombre</span>
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
                className={`input input-bordered w-full pl-10 ${errors.email ? 'input-error' : ''}`}
                {...register('email', { 
                  required: 'El correo electrónico es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Correo electrónico inválido',
                  },
                })}
              />
            </div>
            {errors.email && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.email.message}</span>
              </label>
            )}
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Contraseña</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <KeyRound size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                className={`input input-bordered w-full pl-10 ${errors.password ? 'input-error' : ''}`}
                {...register('password', { 
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres',
                  },
                })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.password.message}</span>
              </label>
            )}
          </div>
          
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Confirmar Contraseña</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <KeyRound size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                className={`input input-bordered w-full pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                {...register('confirmPassword', { 
                  required: 'Por favor confirma tu contraseña',
                  validate: value => value === password || 'Las contraseñas no coinciden',
                })}
              />
            </div>
            {errors.confirmPassword && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.confirmPassword.message}</span>
              </label>
            )}
          </div>
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Crear Cuenta
          </Button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;