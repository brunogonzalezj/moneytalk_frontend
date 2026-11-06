import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

type ExportFormat = 'csv' | 'xlsx';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialFrom?: string;
  initialTo?: string;
  onSubmit: (payload: { fromDate: string; toDate: string; format: ExportFormat }) => Promise<void>;
};

const today = new Date().toISOString().split('T')[0];

const ExportDataModal = ({ isOpen, onClose, initialFrom = '', initialTo = '', onSubmit }: Props) => {
  const [fromDate, setFromDate] = useState(initialFrom);
  const [toDate, setToDate] = useState(initialTo);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setError('La fecha inicial no puede ser mayor a la final.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ fromDate, toDate, format });
      onClose();
    } catch (err) {
      console.error(err);
      setError('No se pudo exportar. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFromDate(initialFrom);
    setToDate(initialTo);
    setFormat('csv');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Exportar transacciones">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-gray-200">
            Desde
            <input
              type="date"
              className="input input-bordered mt-1"
              max={today}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>

          <label className="flex flex-col text-sm font-medium text-gray-700 dark:text-gray-200">
            Hasta
            <input
              type="date"
              className="input input-bordered mt-1"
              max={today}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Formato</p>
          <div className="flex gap-3">
            {(['csv', 'xlsx'] as ExportFormat[]).map((option) => (
              <label key={option} className="flex items-center space-x-2 text-sm">
                <input
                  type="radio"
                  name="format"
                  value={option}
                  checked={format === option}
                  onChange={() => setFormat(option)}
                  className="radio radio-primary"
                />
                <span className="uppercase">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Exportar
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ExportDataModal;

