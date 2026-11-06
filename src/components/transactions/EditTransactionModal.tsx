import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Transaction } from '../../stores/transactionStore';

type Props = {
  transaction: Transaction | null;
  onClose: () => void;
  onSubmit: (id: string, data: Pick<Transaction, 'description' | 'amount' | 'date'>) => Promise<void>;
};

const EditTransactionModal = ({ transaction, onClose, onSubmit }: Props) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setDate(transaction.date.slice(0, 10));
      setError('');
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    setError('');

    const parsedAmount = Number(amount);
    if (!description.trim()) {
      setError('La descripción es obligatoria.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('El monto debe ser mayor a 0.');
      return;
    }
    if (!date) {
      setError('La fecha es obligatoria.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Same shape NewTransaction sends: local midnight as a full ISO timestamp (Prisma rejects bare dates)
      const isoDate = new Date(`${date}T00:00:00`).toISOString();
      await onSubmit(transaction.id, { description: description.trim(), amount: parsedAmount, date: isoDate });
      onClose();
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={transaction !== null} onClose={onClose} title="Editar transacción">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-gray-200">
          Descripción
          <input
            type="text"
            className="input input-bordered mt-1"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-gray-200">
            Monto (Bs)
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className="input input-bordered mt-1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-gray-200">
            Fecha
            <input
              type="date"
              className="input input-bordered mt-1"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>

        {transaction && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Categoría: <span className="font-semibold">{transaction.category}</span>
          </p>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditTransactionModal;
