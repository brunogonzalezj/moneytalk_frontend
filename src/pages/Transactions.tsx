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

const Transactions = () => {
  const { fetchTransactions, transactions, deleteTransaction, totalPages, currentPage } = useTransactionStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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
  
  const handleExport = () => {
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto'];
    const csvRows = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.category,
        t.type === 'income' ? 'Ingreso' : 'Gasto',
        t.amount,
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transacciones-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transacciones</h1>
          <p className="text-gray-600">Ver y administrar todas tus transacciones financieras</p>
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
                <Search size={18} className="text-gray-400" />
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
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Tipo</span>
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
                <span className="label-text font-medium">Categoría</span>
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
                <span className="label-text font-medium">Rango de Fechas</span>
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
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3  text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="mr-3">
                          <CalendarDays size={16} className="text-gray-400" />
                        </div>
                        {formatDate(transaction.date)}
                      </div>
                    </td>
                    <td className="px-4 py-3">{transaction.description}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'INCOME' 
                          ? 'bg-primary-100 text-primary-800' 
                          : 'bg-accent-100 text-accent-800'
                      }`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right whitespace-nowrap font-medium ${
                      transaction.type === 'INCOME' 
                        ? 'text-primary-600' 
                        : 'text-accent-500'
                    }`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end space-x-2">
                        <button 
                          className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          onClick={() => setEditingTransaction(transaction)}
                          aria-label="Editar transacción"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="p-1 rounded-md text-gray-500 hover:bg-red-100 hover:text-red-600"
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
          <div className="flex justify-between items-center border-t border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>
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