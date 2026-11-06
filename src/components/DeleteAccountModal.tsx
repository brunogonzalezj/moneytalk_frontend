import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { useAuthStore } from '../stores/authStore';
import { getErrorMessage } from '../api/errors';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Permanent account deletion. Email accounts confirm with their password;
 * Google accounts (no password) confirm by typing their email.
 */
const DeleteAccountModal = ({ isOpen, onClose }: Props) => {
  const user = useAuthStore((state) => state.user);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const usesGoogle = user?.provider === 'google';

  const handleClose = () => {
    setConfirmation('');
    setError('');
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!confirmation.trim()) {
      setError(usesGoogle ? 'Escribe tu correo para confirmar' : 'Escribe tu contraseña para confirmar');
      return;
    }
    setIsDeleting(true);
    setError('');
    try {
      await deleteAccount(usesGoogle ? { email: confirmation.trim() } : { password: confirmation });
      navigate('/login', { replace: true });
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'No se pudo eliminar la cuenta'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Eliminar cuenta">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex gap-3 rounded-lg bg-accent-50 dark:bg-accent-900/30 p-3 text-sm text-accent-800 dark:text-accent-200">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>
            Se eliminarán de forma permanente tu cuenta, transacciones, metas de ahorro y pagos recurrentes. Esta acción no se
            puede deshacer.
          </p>
        </div>

        <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-gray-200">
          {usesGoogle ? (
            <span>
              Escribe tu correo <span className="font-semibold">{user?.email}</span> para confirmar
            </span>
          ) : (
            'Escribe tu contraseña para confirmar'
          )}
          <input
            type={usesGoogle ? 'email' : 'password'}
            autoComplete={usesGoogle ? 'off' : 'current-password'}
            className="input input-bordered mt-1"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" isLoading={isDeleting}>
            Eliminar definitivamente
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DeleteAccountModal;
