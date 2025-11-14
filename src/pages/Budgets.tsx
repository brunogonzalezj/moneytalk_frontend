import { useEffect, useState } from 'react';
import { Plus, Target, Calendar, TrendingUp, CreditCard as Edit, Trash2, PiggyBank } from 'lucide-react';
import { useBudgetStore, Budget, BudgetType, BudgetStatus } from '../stores/budgetStore';
import { useForm } from 'react-hook-form';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import formatCurrency from '../utils/formatCurrency';
import axios from 'axios';
import toast from 'react-hot-toast';

interface BudgetFormValues {
  name: string;
  description: string;
  type: BudgetType;
  targetAmount: number;
  targetDate: string;
  categoryId: number;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

const Budgets = () => {
  const { 
    budgets, 
    isLoading, 
    fetchBudgets, 
    addBudget, 
    updateBudget, 
    deleteBudget,
    addToBudget,
    getTotalBudgetAllocations 
  } = useBudgetStore();
  
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [addingToBudget, setAddingToBudget] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BudgetFormValues>();

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await axios.get('http://localhost:3000/api/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error al obtener categorías:', error);
        toast.error('Error al cargar categorías');
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const onSubmit = async (data: BudgetFormValues) => {
    try {
      const budgetData: any = {
        name: data.name,
        description: data.description,
        type: data.type,
        targetAmount: data.targetAmount,
      };

      if (data.targetDate) {
        const dateValue = data.targetDate;
        budgetData.targetDate = dateValue.includes('T')
          ? dateValue
          : new Date(dateValue + 'T00:00:00').toISOString();
      }

      if (editingBudget) {
        await updateBudget(editingBudget.id, budgetData);
        setEditingBudget(null);
      } else {
        await addBudget({
          ...budgetData,
          status: 'ACTIVE' as BudgetStatus,
        });
      }
      reset();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    const dateValue = budget.targetDate ? budget.targetDate.split('T')[0] : '';
    reset({
      name: budget.name,
      description: budget.description || '',
      type: budget.type,
      targetAmount: budget.targetAmount,
      targetDate: dateValue,
      categoryId: 1,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
      deleteBudget(id);
    }
  };

  const handleAddToBudget = async (budgetId: string) => {
    const amount = parseFloat(addAmount);
    if (amount > 0) {
      await addToBudget(budgetId, amount);
      setAddingToBudget(null);
      setAddAmount('');
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getBudgetTypeLabel = (type: BudgetType) => {
    const labels = {
      SAVINGS_GOAL: 'Meta de Ahorro',
      PURCHASE_GOAL: 'Meta de Compra',
      EMERGENCY_FUND: 'Fondo de Emergencia',
      VACATION: 'Vacaciones',
      OTHER: 'Otro',
    };
    return labels[type];
  };

  const getStatusColor = (status: BudgetStatus) => {
    const colors = {
      ACTIVE: 'bg-primary-100 text-primary-800',
      COMPLETED: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const totalAllocations = getTotalBudgetAllocations();

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Presupuestos y Metas</h1>
          <p className="text-gray-600">Administra tus metas de ahorro y presupuestos</p>
        </div>
        
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            setEditingBudget(null);
            reset();
            setShowForm(true);
          }}
        >
          Nuevo Presupuesto
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <PiggyBank className="h-8 w-8 text-primary-600" />
            </div>
            <p className="text-sm text-gray-500">Total Presupuestos</p>
            <p className="text-xl font-bold text-gray-800">{budgets.length}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-8 w-8 text-primary-600" />
            </div>
            <p className="text-sm text-gray-500">Asignación Mensual</p>
            <p className="text-xl font-bold text-primary-600">{formatCurrency(totalAllocations)}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Presupuestos Activos</p>
            <p className="text-xl font-bold text-green-600">
              {budgets.filter(b => b.status === 'ACTIVE').length}
            </p>
          </div>
        </div>
      </Card>

      {/* Budget Form */}
      {showForm && (
        <Card className="mb-6" title={editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nombre</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Vacaciones de verano"
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
                  <span className="label-text font-medium">Tipo</span>
                </label>
                <select
                  className={`select select-bordered w-full ${errors.type ? 'select-error' : ''}`}
                  {...register('type', { required: 'El tipo es requerido' })}
                >
                  <option value="">Selecciona un tipo</option>
                  <option value="SAVINGS_GOAL">Meta de Ahorro</option>
                  <option value="PURCHASE_GOAL">Meta de Compra</option>
                  <option value="EMERGENCY_FUND">Fondo de Emergencia</option>
                  <option value="VACATION">Vacaciones</option>
                  <option value="OTHER">Otro</option>
                </select>
                {errors.type && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.type.message}</span>
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories ? 'Cargando categorías...' : 'Selecciona una categoría'}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.type === 'INCOME' ? 'Ingreso' : 'Gasto'})
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.categoryId.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Monto Objetivo</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Bs</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className={`input input-bordered w-full pl-8 ${errors.targetAmount ? 'input-error' : ''}`}
                    {...register('targetAmount', {
                      required: 'El monto objetivo es requerido',
                      min: { value: 0.01, message: 'El monto debe ser mayor a 0' }
                    })}
                  />
                </div>
                {errors.targetAmount && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.targetAmount.message}</span>
                  </label>
                )}
              </div>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Fecha Objetivo (Opcional)</span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                min={new Date().toISOString().split('T')[0]}
                {...register('targetDate')}
              />
              <label className="label">
                <span className="label-text-alt text-gray-500">
                  Si no especificas una fecha, se establecerá automáticamente a 1 año
                </span>
              </label>
            </div>

            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-medium">Descripción (Opcional)</span>
              </label>
              <textarea
                placeholder="Describe tu meta o presupuesto..."
                className="textarea textarea-bordered w-full"
                rows={3}
                {...register('description')}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingBudget(null);
                  reset();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                {editingBudget ? 'Actualizar' : 'Crear'} Presupuesto
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Budgets List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {budgets.map((budget) => (
          <Card key={budget.id} className="hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{budget.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                    {budget.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getBudgetTypeLabel(budget.type)}
                  </span>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(budget)}
                  className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(budget.id)}
                  className="p-1 rounded-md text-gray-500 hover:bg-red-100 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {budget.description && (
              <p className="text-gray-600 text-sm mb-4">{budget.description}</p>
            )}

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Progreso</span>
                <span className="text-sm font-medium">
                  {formatCurrency(budget.currentAmount)} / {formatCurrency(budget.targetAmount)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage(budget.currentAmount, budget.targetAmount)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {getProgressPercentage(budget.currentAmount, budget.targetAmount).toFixed(1)}% completado
                </span>
                {budget.targetDate && (
                  <span className="text-xs text-gray-500 flex items-center">
                    <Calendar size={12} className="mr-1" />
                    {new Date(budget.targetDate).toLocaleDateString('es-ES')}
                  </span>
                )}
              </div>
            </div>

            {budget.status === 'ACTIVE' && (
              <div className="border-t pt-4">
                {addingToBudget === budget.id ? (
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Bs</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="input input-bordered input-sm w-full pl-8"
                        value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleAddToBudget(budget.id)}
                    >
                      Agregar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAddingToBudget(null);
                        setAddAmount('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    fullWidth
                    icon={<Plus size={14} />}
                    onClick={() => setAddingToBudget(budget.id)}
                  >
                    Agregar Dinero
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {budgets.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <PiggyBank size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No tienes presupuestos</h3>
          <p className="text-gray-600 mb-4">
            Crea tu primer presupuesto para empezar a ahorrar para tus metas
          </p>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setShowForm(true)}
          >
            Crear Primer Presupuesto
          </Button>
        </Card>
      )}
    </div>
  );
};

export default Budgets;