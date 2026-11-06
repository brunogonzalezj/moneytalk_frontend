import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ isOpen, onClose }) => {
  const { changePassword } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<ChangePasswordFormValues>();

  const newPasswordValue = watch('newPassword');

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setIsSubmitting(true);

    try {
      await changePassword(data.currentPassword, data.newPassword);
      reset();
      onClose();
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cambiar Contraseña">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Contraseña Actual</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Lock size={18} />
            </span>
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="Ingresa tu contraseña actual"
              className={`input input-bordered w-full pl-10 pr-10 ${errors.currentPassword ? 'input-error' : ''}`}
              {...register('currentPassword', {
                required: 'La contraseña actual es requerida',
              })}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.currentPassword && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.currentPassword.message}</span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Nueva Contraseña</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Lock size={18} />
            </span>
            <input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Ingresa la nueva contraseña"
              className={`input input-bordered w-full pl-10 pr-10 ${errors.newPassword ? 'input-error' : ''}`}
              {...register('newPassword', {
                required: 'La nueva contraseña es requerida',
                minLength: {
                  value: 6,
                  message: 'La contraseña debe tener al menos 6 caracteres'
                }
              })}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.newPassword && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.newPassword.message}</span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Confirmar Nueva Contraseña</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Lock size={18} />
            </span>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirma la nueva contraseña"
              className={`input input-bordered w-full pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
              {...register('confirmPassword', {
                required: 'Confirma la nueva contraseña',
                validate: value => value === newPasswordValue || 'Las contraseñas no coinciden'
              })}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.confirmPassword.message}</span>
            </label>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cambiar Contraseña
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordForm;