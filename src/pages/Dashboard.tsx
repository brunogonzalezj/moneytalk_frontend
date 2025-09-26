import { useEffect} from 'react';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, CalendarDays, Plus, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTransactionStore } from '../stores/transactionStore';
import { useBudgetStore } from '../stores/budgetStore';
import { useAIStore } from '../stores/aiStore';
import ChartWrapper from '../components/ui/ChartWrapper';
import Card from '../components/ui/Card';
import formatCurrency from '../utils/formatCurrency';
import Button from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';

const Dashboard = () => {
  const { fetchTransactions, transactions, getTodaysSummary, getWeeklyData } = useTransactionStore();
  const { fetchBudgets, fetchRecurringPayments, getTotalBudgetAllocations, getTotalRecurringPayments, getAvailableBalance } = useBudgetStore();
  const { recommendations, isLoading: isLoadingRecommendations, fetchRecommendations } = useAIStore();
  const { user } = useAuthStore();
  
  useEffect(() => {
    // Solo hacer fetch si hay usuario autenticado
    if (user) {
      console.log('Dashboard: Fetching transactions for user:', user.id);
      fetchTransactions();
      fetchBudgets();
      fetchRecurringPayments();
      fetchRecommendations(); // This will check cache automatically
    }
  }, [fetchTransactions, fetchBudgets, fetchRecurringPayments, fetchRecommendations, user]);
  
  const { income, expense, net } = getTodaysSummary();
  const budgetAllocations = getTotalBudgetAllocations();
  const recurringPayments = getTotalRecurringPayments();
  const availableBalance = getAvailableBalance(income, expense);
  const weeklyData = getWeeklyData();

  const chartData = {
    labels: weeklyData.labels,
    datasets: [
      {
        label: 'Ingresos',
        data: weeklyData.income,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Gastos',
        data: weeklyData.expense,
        borderColor: '#f97066',
        backgroundColor: 'rgba(249, 112, 102, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };
  
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">¡{getGreeting()}, {user?.displayName || 'usuario'}!</h1>
          <p className="text-gray-600">Aquí está el resumen de tus finanzas de hoy.</p>
        </div>
        
        <Link to="/transactions/new" className="mt-4 md:mt-0">
          <Button variant="primary" icon={<Plus size={16} />}>
            Nueva Transacción
          </Button>
        </Link>
      </div>
      
      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Ingresos de Hoy</p>
              <h3 className="text-xl font-bold text-gray-800">{formatCurrency(income)}</h3>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <ArrowUpCircle className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Gastos de Hoy</p>
              <h3 className="text-xl font-bold text-gray-800">{formatCurrency(expense)}</h3>
            </div>
            <div className="p-3 bg-accent-100 rounded-full">
              <ArrowDownCircle className="h-6 w-6 text-accent-600" />
            </div>
          </div>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Balance Disponible</p>
              <h3 className={`text-xl font-bold ${availableBalance >= 0 ? 'text-primary-600' : 'text-accent-500'}`}>
                {formatCurrency(availableBalance)}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Después de presupuestos y pagos recurrentes
              </p>
            </div>
            <div className={`p-3 rounded-full ${availableBalance >= 0 ? 'bg-primary-100' : 'bg-accent-100'}`}>
              <TrendingUp className={`h-6 w-6 ${availableBalance >= 0 ? 'text-primary-600' : 'text-accent-600'}`} />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Budget and Recurring Payments Summary */}
      {(budgetAllocations > 0 || recurringPayments > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {budgetAllocations > 0 && (
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Asignación Mensual a Presupuestos</p>
                  <h3 className="text-lg font-bold text-blue-600">{formatCurrency(budgetAllocations)}</h3>
                </div>
                <Link to="/budgets" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Ver Presupuestos →
                </Link>
              </div>
            </Card>
          )}
          
          {recurringPayments > 0 && (
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Pagos Recurrentes Mensuales</p>
                  <h3 className="text-lg font-bold text-orange-600">{formatCurrency(recurringPayments)}</h3>
                </div>
                <Link to="/recurring-payments" className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                  Ver Pagos →
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}
      
      {/* Sección de Gráficos */}
      <div className="mb-6">
        <ChartWrapper
          type="line"
          data={chartData}
          title="Flujo de Efectivo - Últimos 7 Días"
          subtitle="Ingresos vs Gastos"
          height={300}
        />
      </div>
      
     {/* Recomendaciones de IA */}
     <div className="mb-6">
       <div className="flex items-center mb-4">
         <Brain className="h-6 w-6 text-primary-600 mr-2" />
         <h2 className="text-xl font-bold text-gray-800">Recomendaciones Inteligentes</h2>
       </div>
       
       {isLoadingRecommendations ? (
         <div className="bg-white rounded-lg border border-gray-200 p-6">
           <div className="animate-pulse">
             <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
             <div className="h-4 bg-gray-200 rounded w-1/2"></div>
           </div>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {recommendations.map((recommendation) => (
             <Card key={recommendation.id} className="hover:shadow-md transition-shadow">
               <div className="flex items-start">
                 <div className={`p-2 rounded-full mr-3 ${
                   recommendation.type === 'warning' ? 'bg-yellow-100' :
                   recommendation.type === 'success' ? 'bg-green-100' :
                   'bg-blue-100'
                 }`}>
                   <Brain className={`h-4 w-4 ${
                     recommendation.type === 'warning' ? 'text-yellow-600' :
                     recommendation.type === 'success' ? 'text-green-600' :
                     'text-blue-600'
                   }`} />
                 </div>
                 <div className="flex-1">
                   <h3 className="font-semibold text-gray-800 mb-1">{recommendation.title}</h3>
                   <p className="text-sm text-gray-600">{recommendation.description}</p>
                 </div>
               </div>
             </Card>
           ))}
         </div>
       )}
     </div>
      
      {/* Transacciones Recientes */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Transacciones Recientes</h2>
          <Link to="/transactions" className="text-primary hover:underline text-sm font-medium">
            Ver Todas
          </Link>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.slice(0, 5).map((transaction) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-500">No hay transacciones. ¡Comienza agregando una!</p>
              <Link to="/transactions/new" className="mt-4 inline-block">
                <Button variant="primary" size="sm" icon={<Plus size={16} />}>
                  Agregar Transacción
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Funciones auxiliares
const getGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export default Dashboard;