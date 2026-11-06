import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import Card from './Card';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

ChartJS.defaults.font.family = 'Inter, system-ui, sans-serif';

type ChartType = 'line' | 'bar' | 'pie';

interface ChartWrapperProps {
  type: ChartType;
  data: ChartData<'line'> | ChartData<'bar'> | ChartData<'pie'>;
  options?: ChartOptions<'line'> | ChartOptions<'bar'> | ChartOptions<'pie'>;
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  type,
  data,
  options = {},
  title,
  subtitle,
  height = 300,
  className = '',
}) => {
  // Default options
  const defaultOptions: ChartOptions<ChartType> = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { borderWidth: 3 },
      point: { radius: 3, hoverRadius: 6, borderWidth: 2, hoverBorderWidth: 3 },
      bar: { borderRadius: 6 },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
          // Solid swatches in the line color instead of the faint area fill
          ...(type !== 'pie' && {
            generateLabels: (chart: ChartJS) =>
              ChartJS.defaults.plugins.legend.labels.generateLabels(chart).map((label) => ({
                ...label,
                fillStyle: label.strokeStyle,
              })),
          }),
          font: { family: 'Inter, system-ui, sans-serif', size: 13, weight: 600 },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: { family: 'Inter, system-ui, sans-serif', weight: 700 },
        bodyFont: { family: 'Inter, system-ui, sans-serif', weight: 500 },
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          // Format currency for tooltips
          label: function(context: TooltipItem<ChartType>) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            // Pie charts parse to a number; line and bar charts to { x, y }
            const parsed = context.parsed as number | { y: number | null } | null;
            const value = typeof parsed === 'number' ? parsed : parsed?.y ?? 0;
            label += new Intl.NumberFormat('es-BO', {
              style: 'currency',
              currency: 'BOB',
              minimumFractionDigits: 2,
            }).format(value);
            return label;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    scales: type !== 'pie' ? {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: string | number) {
            return new Intl.NumberFormat('es-BO', {
              style: 'currency',
              currency: 'BOB',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(Number(value));
          }
        }
      }
    } : undefined
  };

  // Merge default options with provided options
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins
    }
  };

  // Render appropriate chart type
  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={data as ChartData<'line'>} options={mergedOptions as ChartOptions<'line'>} height={height} />;
      case 'bar':
        return <Bar data={data as ChartData<'bar'>} options={mergedOptions as ChartOptions<'bar'>} height={height} />;
      case 'pie':
        return <Pie data={data as ChartData<'pie'>} options={mergedOptions as ChartOptions<'pie'>} height={height} />;
      default:
        return <Line data={data as ChartData<'line'>} options={mergedOptions as ChartOptions<'line'>} height={height} />;
    }
  };

  return (
    <Card 
      title={title} 
      subtitle={subtitle}
      className={`${className}`}
    >
      <div style={{ height: `${height}px` }} className="w-full">
        {renderChart()}
      </div>
    </Card>
  );
};

export default ChartWrapper;