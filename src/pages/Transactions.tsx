import { useEffect, useState } from 'react';
import { 
  Search, CalendarDays, Edit, Trash2, ChevronLeft, ChevronRight, 
  Filter, Plus, Download 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTransactionStore, Transaction, TransactionType } from '../stores/transactionStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import formatCurrency from '../utils/formatCurrency';
import ExportDataModal from '../components/transactions/ExportDataModal';

const Transactions = () => {
  const { fetchTransactions, transactions, deleteTransaction, totalPages, currentPage, exportTransactions } = useTransactionStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const categories = [...new Set(transactions.map(t => t.category))];
  
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
  const filteredTransactions = transactions.filter(transaction => {
    if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (selectedType !== 'all' && transaction.type !== selectedType) {
      return false;
    }
    
    if (selectedCategory && transaction.category !== selectedCategory) {
      return false;
    }
    
    if (dateRange.from && new Date(transaction.date) < new Date(dateRange.from)) {
      return false;
    }
    
    if (dateRange.to && new Date(transaction.date) > new Date(dateRange.to)) {
      return false;
    }
    
    return true;
  });
  
  const handlePageChange = (page: number) => {
    fetchTransactions(page);
  };
  
  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      deleteTransaction(id);
    }
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('');
    setDateRange({ from: '', to: '' });
  };
  
  const handleExport = () => setIsExportModalOpen(true);
  const handleConfirmExport = (payload: { fromDate: string; toDate: string; format: 'csv' | 'xlsx' }) => exportTransactions(payload);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Transacciones</h1>
          <p className="text-gray-600 dark:text-gray-300">Ver y administrar todas tus transacciones financieras</p>
        </div>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button 
            variant="outline" 
            icon={<Download size={16} />}
            onClick={handleExport}
          >
            Exportar
          </Button>
          
          <Link to="/transactions/new">
            <Button variant="primary" icon={<Plus size={16} />}>
              Nueva Transacción
            </Button>
          </Link>
        </div>
      </div>
      
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search size={18} className="text-gray-400 dark:text-gray-500" />
              </span>
              <input
                type="text"
                placeholder="Buscar transacciones..."
                className="input input-bordered w-full pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Filter size={16} />}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              Filtrar
            </Button>
            
            {(searchTerm || selectedType !== 'all' || selectedCategory || dateRange.from || dateRange.to) && (
              <Button
                variant="ghost"
                onClick={resetFilters}
              >
                Restablecer
              </Button>
            )}
          </div>
        </div>
        
        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-700 dark:text-gray-300">Tipo</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as TransactionType | 'all')}
              >
                <option value="all">Todos los Tipos</option>
                <option value="INCOME">Ingresos</option>
                <option value="EXPENSE">Gastos</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-gray-700 dark:text-gray-300">Categoría</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Todas las Categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="form-control md:col-span-1">
              <label className="label">
                <span className="label-text font-medium text-gray-700 dark:text-gray-300">Rango de Fechas</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="input input-bordered"
                  max={new Date().toISOString().split('T')[0]}
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  placeholder="Desde"
                />
                <input
                  type="date"
                  className="input input-bordered"
                  max={new Date().toISOString().split('T')[0]}
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  placeholder="Hasta"
                />
              </div>
            </div>
          </div>
        )}
      </Card>
      
      <Card>
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-gray-700 dark:text-gray-300">Fecha</th>
                  <th className="px-4 py-3 text-gray-700 dark:text-gray-300">Descripción</th>
                  <th className="px-4 py-3 text-gray-700 dark:text-gray-300">Categoría</th>
                  <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Monto</th>
                  <th className="px-4 py-3  text-right text-gray-700 dark:text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-3">
                          <CalendarDays size={16} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        {formatDate(transaction.date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{transaction.description}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'INCOME'
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
                          : 'bg-accent-100 dark:bg-accent-900 text-accent-800 dark:text-accent-200'
                      }`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right whitespace-nowrap font-medium ${
                      transaction.type === 'INCOME'
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-accent-500 dark:text-accent-400'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
                          onClick={() => setEditingTransaction(transaction)}
                          aria-label="Editar transacción"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="p-1 rounded-md text-gray-500 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          aria-label="Eliminar transacción"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-500">No se encontraron transacciones con los filtros actuales.</p>
            <button
              onClick={resetFilters}
              className="mt-2 text-primary hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 px-4 py-3">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="px-3 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>
      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialFrom={dateRange.from}
        initialTo={dateRange.to}
        onSubmit={handleConfirmExport}
      />
    </div>
  );
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export default Transactions;