import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface OptionCardProps {
  id: string;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  label,
  description,
  selected,
  onClick,
  icon,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full p-5 rounded-2xl border-2 text-left transition-all duration-200',
        'hover:border-primary-300 hover:bg-primary-50/50',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        selected
          ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10'
          : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
              selected ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-500'
            )}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'font-semibold text-lg',
                selected ? 'text-primary-700' : 'text-slate-800'
              )}
            >
              {label}
            </span>
            {selected && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          {description && (
            <p className={cn('mt-1 text-sm', selected ? 'text-primary-600' : 'text-slate-500')}>
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

