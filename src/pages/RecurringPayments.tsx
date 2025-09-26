import { useEffect, useState } from 'react';
import { Plus, Calendar, Clock, CreditCard as Edit, Trash2, RefreshCw } from 'lucide-react';
import { useBudgetStore, RecurringPayment, RecurringFrequency, RecurringStatus } from '../stores/budgetStore';
import { useForm } from 'react-hook-form';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import formatCurrency from '../utils/formatCurrency';
import axios from 'axios';

interface RecurringPaymentFormValues {
  name: string;
  description: string;
  amount: number;
  frequency: RecurringFrequency;
  nextPaymentDate: string;
  categoryId: number;
}

interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
}

const RecurringPayments = () => {
  const { 
    recurringPayments, 
    isLoading, 
    fetchRecurringPayments, 
    addRecurringPayment, 
    updateRecurringPayment, 
    deleteRecurringPayment,
    getTotalRecurringPayments 
  } = useBudgetStore();
  
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RecurringPaymentFormValues>();

  useEffect(() => {
    fetchRecurringPayments();
    fetchCategories();
  }, [fetchRecurringPayments]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/categories');
      setCategories(response.data.filter((cat: Category) => cat.type === 'EXPENSE'));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const onSubmit = async (data: RecurringPaymentFormValues) => {
    try {
      if (editingPayment) {
        await updateRecurringPayment(editingPayment.id, data);
        setEditingPayment(null);
      } else {
        await addRecurringPayment({
          ...data,
          category: categories.find(c => c.id === data.categoryId)?.name || 'Sin categoría',
          status: 'ACTIVE' as RecurringStatus,
        });
      }
      reset();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving recurring payment:', error);
    }
  };

  const handleEdit = (payment: RecurringPayment) => {
    setEditingPayment(payment);
    reset({
      name: payment.name,
      description: payment.description || '',
      amount: payment.amount,
      frequency: payment.frequency,
      nextPaymentDate: payment.nextPaymentDate,
      categoryId: payment.categoryId,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este pago recurrente?')) {
      deleteRecurringPayment(id);
    }
  };

  const getFrequencyLabel = (frequency: RecurringFrequency) => {
    const labels = {
      DAILY: 'Diario',
      WEEKLY: 'Semanal',
      MONTHLY: 'Mensual',
      YEARLY: 'Anual',
    };
    return labels[frequency];
  };

  const getStatusColor = (status: RecurringStatus) => {
    const colors = {
      ACTIVE: 'bg-primary-100 text-primary-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getNextPaymentDays = (nextPaymentDate: string) => {
    const now = new Date();
    const next = new Date(nextPaymentDate);
    const diffTime = next.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Vencido';
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    return `En ${diffDays} días`;
  };

  const totalMonthlyPayments = getTotalRecurringPayments();

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pagos Recurrentes</h1>
          <p className="text-gray-600">Administra tus pagos automáticos y suscripciones</p>
        </div>
        
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            setEditingPayment(null);
            reset();
            setShowForm(true);
          }}
        >
          Nuevo Pago Recurrente
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <RefreshCw className="h-8 w-8 text-primary-600" />
            </div>
            <p className="text-sm text-gray-500">Total Pagos</p>
            <p className="text-xl font-bold text-gray-800">{recurringPayments.length}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-8 w-8 text-accent-600" />
            </div>
            <p className="text-sm text-gray-500">Gasto Mensual</p>
            <p className="text-xl font-bold text-accent-600">{formatCurrency(totalMonthlyPayments)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Pagos Activos</p>
            <p className="text-xl font-bold text-green-600">
              {recurringPayments.filter(p => p.status === 'ACTIVE').length}
            </p>
          </div>
        </div>
      </Card>

      {/* Payment Form */}
      {showForm && (
        <Card className="mb-6" title={editingPayment ? 'Editar Pago Recurrente' : 'Nuevo Pago Recurrente'}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nombre</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Netflix, Alquiler, Seguro"
                  className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                  {...register('name', { required: 'El nombre es requerido' })}
                />
                {errors.name && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.name.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Categoría</span>
                </label>
                <select
                  className={`select select-bordered w-full ${errors.categoryId ? 'select-error' : ''}`}
                  {...register('categoryId', { 
                    required: 'La categoría es requerida',
                    valueAsNumber: true 
                  })}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.categoryId.message}</span>
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Monto</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Bs</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className={`input input-bordered w-full pl-8 ${errors.amount ? 'input-error' : ''}`}
                    {...register('amount', { 
                      required: 'El monto es requerido',
                      min: { value: 0.01, message: 'El monto debe ser mayor a 0' },
                      valueAsNumber: true
                    })}
                  />
                </div>
                {errors.amount && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.amount.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Frecuencia</span>
                </label>
                <select
                  className={`select select-bordered w-full ${errors.frequency ? 'select-error' : ''}`}
                  {...register('frequency', { required: 'La frecuencia es requerida' })}
                >
                  <option value="">Selecciona frecuencia</option>
                  <option value="DAILY">Diario</option>
                  <option value="WEEKLY">Semanal</option>
                  <option value="MONTHLY">Mensual</option>
                  <option value="YEARLY">Anual</option>
                </select>
                {errors.frequency && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.frequency.message}</span>
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Próximo Pago</span>
                </label>
                <input
                  type="date"
                  className={`input input-bordered w-full ${errors.nextPaymentDate ? 'input-error' : ''}`}
                  min={new Date().toISOString().split('T')[0]}
                  {...register('nextPaymentDate', { required: 'La fecha del próximo pago es requerida' })}
                />
                {errors.nextPaymentDate && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.nextPaymentDate.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Descripción (Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Descripción adicional..."
                  className="input input-bordered w-full"
                  {...register('description')}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingPayment(null);
                  reset();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                {editingPayment ? 'Actualizar' : 'Crear'} Pago Recurrente
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Payments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {recurringPayments.map((payment) => (
          <Card key={payment.id} className="hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{payment.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {payment.category}
                  </span>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(payment)}
                  className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(payment.id)}
                  className="p-1 rounded-md text-gray-500 hover:bg-red-100 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {payment.description && (
              <p className="text-gray-600 text-sm mb-4">{payment.description}</p>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monto</span>
                <span className="text-lg font-bold text-accent-600">
                  {formatCurrency(payment.amount)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Frecuencia</span>
                <span className="text-sm font-medium">
                  {getFrequencyLabel(payment.frequency)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Próximo Pago</span>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {new Date(payment.nextPaymentDate).toLocaleDateString('es-ES')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getNextPaymentDays(payment.nextPaymentDate)}
                  </div>
                </div>
              </div>

              {payment.lastPaymentDate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Último Pago</span>
                  <span className="text-sm text-gray-500">
                    {new Date(payment.lastPaymentDate).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {recurringPayments.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <RefreshCw size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No tienes pagos recurrentes</h3>
          <p className="text-gray-600 mb-4">
            Agrega tus suscripciones y pagos automáticos para un mejor control financiero
          </p>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setShowForm(true)}
          >
            Crear Primer Pago Recurrente
          </Button>
        </Card>
      )}
    </div>
  );
};

export default RecurringPayments;