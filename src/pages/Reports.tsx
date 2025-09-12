import { useState, useEffect } from 'react';
import { CalendarRange, FileBarChart, RefreshCw } from 'lucide-react';
import { useTransactionStore, Transaction } from '../stores/transactionStore';
import ChartWrapper from '../components/ui/ChartWrapper';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import formatCurrency from '../utils/formatCurrency';

type DateRange = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

const Reports = () => {
  const { transactions, fetchTransactions } = useTransactionStore();
  const [dateRange, setDateRange] = useState<DateRange>('thisMonth');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
  useEffect(() => {
    const now = new Date();
    let fromDate: Date;
    let toDate: Date = new Date(now);
    
    switch (dateRange) {
      case 'last7days':
        fromDate = new Date(now);
        fromDate.setDate(fromDate.getDate() - 7);
        break;
        
      case 'last30days':
        fromDate = new Date(now);
        fromDate.setDate(fromDate.getDate() - 30);
        break;
        
      case 'thisMonth':
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
        
      case 'lastMonth':
        fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        toDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
        
      case 'thisYear':
        fromDate = new Date(now.getFullYear(), 0, 1);
        toDate = new Date(now.getFullYear(), 11, 31);
        break;
        
      case 'custom':
        fromDate = customRange.from ? new Date(customRange.from) : new Date(0);
        toDate = customRange.to ? new Date(customRange.to) : new Date();
        break;
        
      default:
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }
    
    const filtered = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= fromDate && transactionDate <= toDate;
    });
    
    setFilteredTransactions(filtered);
  }, [dateRange, customRange, transactions]);
  
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netCashflow = totalIncome - totalExpenses;
  
  const expensesByCategory = filteredTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, transaction) => {
      const { category, amount } = transaction;
      acc[category] = (acc[category] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);
    
  const pieChartData = {
    labels: Object.keys(expensesByCategory),
    datasets: [
      {
        data: Object.values(expensesByCategory),
        backgroundColor: [
          '#10b981', '#1e40af', '#f97066', '#3abff8', '#36d399', 
          '#fbbd23', '#f87272', '#6366f1', '#8b5cf6', '#ec4899',
          '#14b8a6', '#84cc16',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Opciones específicas para el gráfico de pie
  const pieChartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const formatted = formatCurrency(Number(value));
            return `${label}: ${formatted}`;
          }
        }
      }
    }
  };

  const getMonthlyData = () => {
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'INCOME') {
        monthlyData[monthYear].income += transaction.amount;
      } else {
        monthlyData[monthYear].expense += transaction.amount;
      }
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    
    return {
      labels: sortedMonths.map(monthYear => {
        const [year, month] = monthYear.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      }),
      incomeData: sortedMonths.map(month => monthlyData[month].income),
      expenseData: sortedMonths.map(month => monthlyData[month].expense),
    };
  };
  
  const monthlyData = getMonthlyData();
  
  const barChartData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Ingresos',
        data: monthlyData.incomeData,
        backgroundColor: '#10b981',
      },
      {
        label: 'Gastos',
        data: monthlyData.expenseData,
        backgroundColor: '#f97066',
      },
    ],
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactions();
    setIsRefreshing(false);
  };
  
  const formatDateRange = () => {
    const now = new Date();
    
    switch (dateRange) {
      case 'last7days':
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return `${formatDate(sevenDaysAgo)} - ${formatDate(now)}`;
        
      case 'last30days':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return `${formatDate(thirtyDaysAgo)} - ${formatDate(now)}`;
        
      case 'thisMonth':
        return new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return lastMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        
      case 'thisYear':
        return new Date().getFullYear().toString();
        
      case 'custom':
        if (customRange.from && customRange.to) {
          return `${formatDate(new Date(customRange.from))} - ${formatDate(new Date(customRange.to))}`;
        }
        return 'Rango Personalizado';
        
      default:
        return '';
    }
  };
  
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reportes Financieros</h1>
          <p className="text-gray-600">Analiza tus patrones de ingresos y gastos</p>
        </div>
        
        <Button
          variant="outline"
          icon={<RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          Actualizar Datos
        </Button>
      </div>
      
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center text-gray-600">
            <CalendarRange size={20} className="mr-2" />
            <span>Rango de Fechas:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1.5 text-sm rounded-md ${
                dateRange === 'last7days'
                  ? 'bg-primary-100 text-primary-800 font-medium'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setDateRange('last7days')}
            >
              Últimos 7 Días
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md ${
                dateRange === 'last30days'
                  ? 'bg-primary-100 text-primary-800 font-medium'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setDateRange('last30days')}
            >
              Últimos 30 Días
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md ${
                dateRange === 'thisMonth'
                  ? 'bg-primary-100 text-primary-800 font-medium'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setDateRange('thisMonth')}
            >
              Este Mes
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md ${
                dateRange === 'lastMonth'
                  ? 'bg-primary-100 text-primary-800 font-medium'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setDateRange('lastMonth')}
            >
              Mes Anterior
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md ${
                dateRange === 'thisYear'
                  ? 'bg-primary-100 text-primary-800 font-medium'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setDateRange('thisYear')}
            >
              Este Año
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md ${
                dateRange === 'custom'
                  ? 'bg-primary-100 text-primary-800 font-medium'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setDateRange('custom')}
            >
              Personalizado
            </button>
          </div>
        </div>
        
        {dateRange === 'custom' && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Desde</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                max={new Date().toISOString().split('T')[0]}
                value={customRange.from}
                onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Hasta</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                max={new Date().toISOString().split('T')[0]}
                value={customRange.to}
                onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
              />
            </div>
          </div>
        )}
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Ingresos Totales</p>
              <h3 className="text-xl font-bold text-primary-600">{formatCurrency(totalIncome)}</h3>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <FileBarChart className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Gastos Totales</p>
              <h3 className="text-xl font-bold text-accent-500">{formatCurrency(totalExpenses)}</h3>
            </div>
            <div className="p-3 bg-accent-100 rounded-full">
              <FileBarChart className="h-6 w-6 text-accent-500" />
            </div>
          </div>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Balance Neto</p>
              <h3 className={`text-xl font-bold ${netCashflow >= 0 ? 'text-primary-600' : 'text-accent-500'}`}>
                {formatCurrency(netCashflow)}
              </h3>
            </div>
            <div className={`p-3 rounded-full ${netCashflow >= 0 ? 'bg-primary-100' : 'bg-accent-100'}`}>
              <FileBarChart className={`h-6 w-6 ${netCashflow >= 0 ? 'text-primary-600' : 'text-accent-500'}`} />
            </div>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartWrapper
          type="pie"
          data={pieChartData}
          title="Distribución de Gastos por Categoría"
          subtitle={formatDateRange()}
          height={350}
          options={pieChartOptions}
        />
        
        <ChartWrapper
          type="bar"
          data={barChartData}
          title="Ingresos vs Gastos"
          subtitle={formatDateRange()}
          height={350}
          options={{
            scales: {
              x: {
                grid: {
                  display: false,
                },
              },
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return formatCurrency(Number(value));
                  },
                },
              },
            },
          }}
        />
      </div>
      
      <Card className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Principales Categorías de Gastos</h3>
        
        {Object.keys(expensesByCategory).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(expensesByCategory)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([category, amount]) => (
                <div key={category} className="flex items-center">
                  <div className="w-1/3">
                    <span className="font-medium text-gray-700">{category}</span>
                  </div>
                  <div className="w-2/3">
                    <div className="flex items-center">
                      <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ 
                            width: `${Math.min(100, (amount / totalExpenses) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="ml-3 text-gray-600 font-medium">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No hay datos de gastos disponibles para el período seleccionado.</p>
        )}
      </Card>
    </div>
  );
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export default Reports;