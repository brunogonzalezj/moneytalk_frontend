import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarRange, FileBarChart, RefreshCw } from 'lucide-react';
import { summaryKey, useTransactionStore } from '../stores/transactionStore';
import { addDaysIso, formatShortDate, parseIsoDate, presetRange, todayIso } from '../utils/date';
import ChartWrapper from '../components/ui/ChartWrapper';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import formatCurrency from '../utils/formatCurrency';

type DateRange = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

const Reports = () => {
  const fetchSummary = useTransactionStore((state) => state.fetchSummary);
  const [dateRange, setDateRange] = useState<DateRange>('thisMonth');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Inclusive calendar range; a custom range without start covers the last 10 years
  const { from, to } = useMemo(() => {
    if (dateRange !== 'custom') return presetRange(dateRange);
    const end = customRange.to || todayIso();
    return { from: customRange.from || addDaysIso(end, -3650), to: end };
  }, [dateRange, customRange]);

  const summary = useTransactionStore((state) => state.summaries[summaryKey(from, to, 'month')]);
  const isInvalidRange = from > to;

  useEffect(() => {
    if (!isInvalidRange) void fetchSummary(from, to, 'month');
  }, [fetchSummary, from, to, isInvalidRange, summary]);

  const totalIncome = summary?.totals.income ?? 0;
  const totalExpenses = summary?.totals.expense ?? 0;
  const netCashflow = summary?.totals.balance ?? 0;

  // Already sorted by total on the server
  const expensesByCategory = useMemo(
    () =>
      Object.fromEntries(
        (summary?.byCategory ?? []).filter((c) => c.type === 'EXPENSE').map((c) => [c.name, c.total])
      ) as Record<string, number>,
    [summary]
  );

  const pieChartData = {
    labels: Object.keys(expensesByCategory),
    datasets: [
      {
        data: Object.values(expensesByCategory),
        backgroundColor: [
          '#10b981', // Verde primario
          '#f87171', // Rojo primario
          '#34d399', // Verde claro
          '#fb7185', // Rojo claro
          '#6366f1', // Índigo
          '#8b5cf6', // Violeta
          '#fbbf24', // Amarillo
          '#60a5fa', // Azul cielo
          '#34d399', // Verde menta
          '#f9a8d4', // Rosa
          '#fed7aa', // Naranja
        ],
        borderColor: '#374151', // Borde gris oscuro
        borderWidth: 2,
      },
    ],
  };
  
  // Opciones específicas para el gráfico de pie
  const pieChartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#9ca3af', // Texto gris para modo oscuro
          padding: 15,
          font: {
            size: 12,
          },
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0];
              const total = dataset.data.reduce((a: number, b: number) => a + b, 0);
              return data.labels.map((label: string, i: number) => {
                const value = dataset.data[i];
                const percentage = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: dataset.backgroundColor[i],
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.95)', // Fondo oscuro semitransparente
        titleColor: '#f3f4f6', // Texto claro
        bodyColor: '#d1d5db', // Texto gris claro
        borderColor: '#4b5563', // Borde gris
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            const formatted = formatCurrency(Number(value));
            return [
              `${label}: ${formatted}`,
              `${percentage}% del total`
            ];
          }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  const monthlyData = useMemo(() => {
    // Months without movements are left out, as before
    const months = (summary?.series ?? []).filter((point) => point.income > 0 || point.expense > 0);
    return {
      labels: months.map((point) => format(parseIsoDate(point.period), 'MMM yyyy', { locale: es })),
      incomeData: months.map((point) => point.income),
      expenseData: months.map((point) => point.expense),
    };
  }, [summary]);
  
  const barChartData = {
    labels: monthlyData.labels,
    datasets: [
      {
        label: 'Ingresos',
        data: monthlyData.incomeData,
        backgroundColor: '#10b981', // Verde primario
        borderColor: '#059669', // Verde más oscuro para el borde
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: 'Gastos',
        data: monthlyData.expenseData,
        backgroundColor: '#f87171', // Rojo primario
        borderColor: '#dc2626', // Rojo más oscuro para el borde
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Drops cached aggregates so the effect above refetches this range
    useTransactionStore.setState({ summaries: {} });
    await fetchSummary(from, to, 'month');
    setIsRefreshing(false);
  };
  
  const formatDateRange = () => {
    const thisMonth = presetRange('thisMonth');
    switch (dateRange) {
      case 'thisMonth':
        return format(parseIsoDate(thisMonth.from), 'MMMM yyyy', { locale: es });
      case 'lastMonth':
        return format(parseIsoDate(from), 'MMMM yyyy', { locale: es });
      case 'thisYear':
        return from.slice(0, 4);
      case 'custom':
        if (!customRange.from && !customRange.to) return 'Rango personalizado';
        return `${formatShortDate(from, true)} - ${formatShortDate(to, true)}`;
      default:
        return `${formatShortDate(from, true)} - ${formatShortDate(to, true)}`;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">Reportes Financieros</h1>
          <p className="text-gray-600 dark:text-gray-400">Analiza tus patrones de ingresos y gastos</p>
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
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <CalendarRange size={20} className="mr-2" />
            <span className="whitespace-nowrap font-semibold">Rango de Fechas:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1.5 text-sm rounded-md ${
                dateRange === 'last7days'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 font-medium'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setDateRange('last7days')}
            >
              Últimos 7 Días
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md ${
                dateRange === 'last30days'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 font-medium'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setDateRange('last30days')}
            >
              Últimos 30 Días
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md ${
                dateRange === 'thisMonth'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 font-medium'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setDateRange('thisMonth')}
            >
              Este Mes
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md ${
                dateRange === 'lastMonth'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 font-medium'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setDateRange('lastMonth')}
            >
              Mes Anterior
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md ${
                dateRange === 'thisYear'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 font-medium'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => setDateRange('thisYear')}
            >
              Este Año
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md ${
                dateRange === 'custom'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 font-medium'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Ingresos Totales" value={formatCurrency(totalIncome)} icon={FileBarChart} tone="primary" />
        <StatCard label="Gastos Totales" value={formatCurrency(totalExpenses)} icon={FileBarChart} tone="accent" />
        <StatCard label="Balance Neto" value={formatCurrency(netCashflow)} icon={FileBarChart} tone={netCashflow >= 0 ? 'primary' : 'accent'} featured />
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
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top' as const,
                labels: {
                  color: '#9ca3af', // Texto gris para modo oscuro
                  padding: 15,
                  font: {
                    size: 12,
                  },
                }
              },
              tooltip: {
                backgroundColor: 'rgba(31, 41, 55, 0.95)', // Fondo oscuro semitransparente
                titleColor: '#f3f4f6', // Texto claro
                bodyColor: '#d1d5db', // Texto gris claro
                borderColor: '#4b5563', // Borde gris
                borderWidth: 1,
                padding: 12,
                callbacks: {
                  label: function(context: any) {
                    let label = context.dataset.label || '';
                    if (label) {
                      label += ': ';
                    }
                    label += formatCurrency(context.parsed.y);
                    return label;
                  }
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  color: '#9ca3af', // Texto gris para modo oscuro
                  font: {
                    size: 11
                  }
                }
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(75, 85, 99, 0.3)', // Líneas de grid sutiles en modo oscuro
                },
                ticks: {
                  color: '#9ca3af', // Texto gris para modo oscuro
                  font: {
                    size: 11
                  },
                  callback: function(value: string | number) {
                    return formatCurrency(Number(value));
                  },
                },
              },
            },
          }}
        />
      </div>
      
      <Card className="mb-6">
        <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-50 mb-4">Principales Categorías de Gastos</h3>

        {Object.keys(expensesByCategory).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(expensesByCategory)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([category, amount]) => (
                <div key={category} className="flex items-center">
                  <div className="w-1/3">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{category}</span>
                  </div>
                  <div className="w-2/3">
                    <div className="flex items-center">
                      <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 dark:bg-primary-500 rounded-full"
                          style={{
                            width: `${Math.min(100, (amount / totalExpenses) * 100)}%`
                          }}
                        />
                      </div>
                      <span className="ml-3 text-gray-600 dark:text-gray-400 font-medium">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay datos de gastos disponibles para el período seleccionado.</p>
        )}
      </Card>
    </div>
  );
};

export default Reports;