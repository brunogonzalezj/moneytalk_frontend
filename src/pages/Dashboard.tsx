import { useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, CalendarDays, Plus, Brain, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTransactionStore } from '../stores/transactionStore';
import { useBudgetStore } from '../stores/budgetStore';
import { useAIStore } from '../stores/aiStore';
import ChartWrapper from '../components/ui/ChartWrapper';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import formatCurrency from '../utils/formatCurrency';
import Button from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';

const Dashboard = () => {
  const { fetchAllTransactionsForCalculations, transactions, getTodaysSummary, getWeeklyData, getTotalBalance } = useTransactionStore();
  const { fetchBudgets, fetchRecurringPayments, getTotalBudgetAllocations, getTotalRecurringPayments } = useBudgetStore();
  const { recommendations, isLoading: isLoadingRecommendations, fetchRecommendations } = useAIStore();
  const { user } = useAuthStore();
  
  useEffect(() => {
    // Solo hacer fetch si hay usuario autenticado
    if (user) {
      console.log('Dashboard: Fetching transactions for user:', user.id);
      fetchAllTransactionsForCalculations(); // Cargar TODAS las transacciones para cálculos
      fetchBudgets();
      fetchRecurringPayments();
      fetchRecommendations(); // This will check cache automatically
    }
  }, [fetchAllTransactionsForCalculations, fetchBudgets, fetchRecurringPayments, fetchRecommendations, user]);
  
  const { income: todayIncome, expense: todayExpense } = getTodaysSummary();
  const { net: totalNet } = getTotalBalance();
  const budgetAllocations = getTotalBudgetAllocations();
  const totalRecurringPayments = getTotalRecurringPayments();
  // Usar el mismo cálculo que los reportes: Balance Neto = Ingresos - Gastos
  const netBalance = totalNet;
  const weeklyData = getWeeklyData();

  const handleReloadRecommendations = async () => {
    await fetchRecommendations(true);
  };

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
      <div className="rise flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6" style={{ ['--i' as string]: 0 }}>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">¡{getGreeting()}, {user?.displayName || 'usuario'}!</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">Aquí está el resumen de tus finanzas de hoy.</p>
        </div>
        
        <Link to="/transactions/new" className="shrink-0">
          <Button variant="primary" icon={<Plus size={16} />}>
            Nueva Transacción
          </Button>
        </Link>
      </div>
      
      {/* Tarjetas de Resumen */}
      <div className="rise grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6" style={{ ['--i' as string]: 1 }}>
        <StatCard label="Ingresos de Hoy" value={formatCurrency(todayIncome)} icon={ArrowUpCircle} tone="primary" />
        <StatCard label="Gastos de Hoy" value={formatCurrency(todayExpense)} icon={ArrowDownCircle} tone="accent" />
        <StatCard label="Balance Neto" value={formatCurrency(netBalance)} icon={TrendingUp} tone={netBalance >= 0 ? 'primary' : 'accent'} featured />
      </div>

      {/* Budget and Recurring Payments Summary */}
      {(budgetAllocations > 0 || totalRecurringPayments > 0) && (
        <div className="rise grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6" style={{ ['--i' as string]: 2 }}>
          {budgetAllocations > 0 && (
            <Card hoverable>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Asignación Mensual a Presupuestos</p>
                  <h3 className="figure text-2xl font-extrabold text-blue-600 dark:text-blue-400">{formatCurrency(budgetAllocations)}</h3>
                </div>
                <Link to="/budgets" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-semibold whitespace-nowrap">
                  Ver Presupuestos →
                </Link>
              </div>
            </Card>
          )}
          
          {totalRecurringPayments > 0 && (
            <Card hoverable>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Pagos Recurrentes Mensuales</p>
                  <h3 className="figure text-2xl font-extrabold text-orange-600 dark:text-orange-400">{formatCurrency(totalRecurringPayments)}</h3>
                </div>
                <Link to="/recurring-payments" className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 text-sm font-semibold whitespace-nowrap">
                  Ver Pagos →
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}
      
      {/* Sección de Gráficos */}
      <div className="rise mb-6" style={{ ['--i' as string]: 3 }}>
        <ChartWrapper
          type="line"
          data={chartData}
          title="Flujo de Efectivo - Últimos 7 Días"
          subtitle="Ingresos vs Gastos"
          height={300}
        />
      </div>
      
     {/* Recomendaciones de IA */}
     <div className="rise mb-6" style={{ ['--i' as string]: 4 }}>
       <div className="flex items-center justify-between mb-4">
         <div className="flex items-center">
           <Brain className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-2" />
           <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-50">Recomendaciones Inteligentes</h2>
         </div>
         <Button
           variant="outline"
           size="sm"
           icon={<RefreshCw size={16} className={isLoadingRecommendations ? 'animate-spin' : ''} />}
           onClick={handleReloadRecommendations}
           disabled={isLoadingRecommendations}
         >
           Recargar
         </Button>
       </div>
       
       {isLoadingRecommendations ? (
         <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
           <div className="animate-pulse">
             <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
             <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
           </div>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {recommendations.map((recommendation) => (
             <Card key={recommendation.id} hoverable>
               <div className="flex items-start">
                 <div className={`p-2 rounded-lg mr-3 shrink-0 ${
                   recommendation.type === 'warning' ? 'bg-yellow-500' :
                   recommendation.type === 'success' ? 'bg-primary-600' :
                   'bg-blue-600'
                 }`}>
                   <Brain className="h-4 w-4 text-white" />
                 </div>
                 <div className="flex-1">
                   <h3 className="font-bold text-gray-900 dark:text-gray-50 mb-1">{recommendation.title}</h3>
                   <p className="text-sm text-gray-600 dark:text-gray-300">{recommendation.description}</p>
                 </div>
               </div>
             </Card>
           ))}
         </div>
       )}
     </div>
      
      {/* Transacciones Recientes */}
      <div className="rise mb-6" style={{ ['--i' as string]: 5 }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-50">Transacciones Recientes</h2>
          <Link to="/transactions" className="text-primary-700 dark:text-primary-400 hover:underline underline-offset-4 text-sm font-semibold">
            Ver Todas
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.06),0_4px_12px_-2px_rgba(16,24,40,0.08)]">
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="hidden lg:table-cell px-4 py-3">Categoría</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.slice(0, 5).map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="mr-3 hidden lg:block">
                            <CalendarDays size={16} className="text-gray-400 dark:text-gray-500" />
                          </div>
                          {formatDate(transaction.date)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        <div>{transaction.description}</div>
                        <span className={`lg:hidden mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            transaction.type === 'INCOME'
                              ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
                              : 'bg-accent-100 dark:bg-accent-900 text-accent-800 dark:text-accent-200'
                          }`}>
                            {transaction.category}
                          </span>
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          transaction.type === 'INCOME'
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
                            : 'bg-accent-100 dark:bg-accent-900 text-accent-800 dark:text-accent-200'
                        }`}>
                          {transaction.category}
                        </span>
                      </td>
                      <td className={`figure px-4 py-3 text-right whitespace-nowrap font-bold ${
                        transaction.type === 'INCOME'
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-accent-500 dark:text-accent-400'
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
              <p className="text-gray-500 dark:text-gray-400">No hay transacciones. ¡Comienza agregando una!</p>
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