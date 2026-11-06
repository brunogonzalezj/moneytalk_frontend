import React from 'react';
import Card from './Card';

type Tone = 'primary' | 'accent' | 'blue' | 'orange' | 'neutral';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  tone?: Tone;
  // The one figure a page leads with: rendered as a filled card
  featured?: boolean;
}

const tiles: Record<Tone, string> = {
  primary: 'bg-primary-600 shadow-[0_4px_10px_-2px_rgba(5,150,105,0.45)]',
  accent: 'bg-accent-600 shadow-[0_4px_10px_-2px_rgba(231,61,62,0.45)]',
  blue: 'bg-blue-600 shadow-[0_4px_10px_-2px_rgba(37,99,235,0.4)]',
  orange: 'bg-orange-500 shadow-[0_4px_10px_-2px_rgba(249,115,22,0.4)]',
  neutral: 'bg-gray-700 dark:bg-gray-600 shadow-[0_4px_10px_-2px_rgba(16,24,40,0.3)]',
};

const values: Record<Tone, string> = {
  primary: 'text-primary-700 dark:text-primary-400',
  accent: 'text-accent-700 dark:text-accent-400',
  blue: 'text-blue-600 dark:text-blue-400',
  orange: 'text-orange-600 dark:text-orange-400',
  neutral: 'text-gray-900 dark:text-gray-50',
};

const featuredSurfaces: Partial<Record<Tone, { surface: string; label: string }>> = {
  primary: {
    surface: 'bg-primary-700 shadow-[0_2px_4px_rgba(16,24,40,0.1),0_10px_24px_-6px_rgba(4,120,87,0.55)]',
    label: 'text-primary-100',
  },
  accent: {
    surface: 'bg-accent-700 shadow-[0_2px_4px_rgba(16,24,40,0.1),0_10px_24px_-6px_rgba(206,42,43,0.5)]',
    label: 'text-accent-100',
  },
};

const figureClass = 'figure text-3xl lg:text-2xl xl:text-3xl font-extrabold';
// Icons step aside in the 1024–1280px range, where three cards share a narrow row
const tileClass = 'shrink-0 lg:hidden xl:block p-3 rounded-xl';

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, tone = 'neutral', featured = false }) => {
  const feature = featured ? featuredSurfaces[tone] ?? featuredSurfaces.primary! : null;

  if (feature) {
    return (
      <div className={`rounded-xl p-5 text-white transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 ${feature.surface}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`text-sm font-semibold mb-1 ${feature.label}`}>{label}</p>
            <p className={figureClass}>{value}</p>
          </div>
          <div className={`${tileClass} bg-white/15`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card hoverable>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{label}</p>
          <p className={`${figureClass} ${values[tone]}`}>{value}</p>
        </div>
        <div className={`${tileClass} ${tiles[tone]}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
