import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/ui/Button';
import Logo from '../components/layout/Logo';

interface LoginFormValues {
  email: string;
  password: string;
}

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (location.state as any)?.from?.pathname || '/dashboard';
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    try {
      setErrorMessage('');
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (error: any) {
      setErrorMessage(error.message || 'Ocurrió un error durante el inicio de sesión. Por favor, inténtalo de nuevo.');
    }
  };
  
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="card bg-white shadow-xl max-w-md w-full p-8 animate-fade-in">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">¡Bienvenido de nuevo!</h1>
          <p className="text-gray-600 mt-2">Inicia sesión para continuar en MoneyTalk</p>
        </div>
        
        {errorMessage && (
          <div className="alert alert-error mb-6">
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Correo electrónico</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <User size={18} />
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
              <a href="#" className="label-text-alt link link-hover text-primary">
                ¿Olvidaste tu contraseña?
              </a>
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
          
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Iniciar Sesión
          </Button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-gray-600">
            ¿No tienes una cuenta?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
        
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Credenciales de demostración:</p>
          <p>Correo: demo@example.com</p>
          <p>Contraseña: password</p>
        </div>
      </div>
    </div>
  );
};

export default Login;