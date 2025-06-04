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
  ChartOptions
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

type ChartType = 'line' | 'bar' | 'pie';

interface ChartWrapperProps {
  type: ChartType;
  data: ChartData<any>;
  options?: ChartOptions<any>;
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
  const defaultOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          // Format currency for tooltips
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(context.parsed.y);
            }
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
          callback: function(value) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
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
        return <Line data={data} options={mergedOptions} height={height} />;
      case 'bar':
        return <Bar data={data} options={mergedOptions} height={height} />;
      case 'pie':
        return <Pie data={data} options={mergedOptions} height={height} />;
      default:
        return <Line data={data} options={mergedOptions} height={height} />;
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