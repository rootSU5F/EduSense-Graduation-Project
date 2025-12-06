import React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Frown, ArrowUpDown } from 'lucide-react';

interface ConfusionGaugeProps {
  level: number;
  behaviors: string[];
  className?: string;
}

const behaviorIcons: Record<string, { icon: React.ReactNode; label: string }> = {
  gaze_aversion: { icon: <EyeOff className="w-4 h-4" />, label: 'Gaze Aversion' },
  brow_tension: { icon: <Frown className="w-4 h-4" />, label: 'Brow Tension' },
  head_tilt: { icon: <ArrowUpDown className="w-4 h-4" />, label: 'Head Movement' },
  reduced_blink_rate: { icon: <Eye className="w-4 h-4" />, label: 'Reduced Blinking' },
  micro_expressions: { icon: <Frown className="w-4 h-4" />, label: 'Micro Expressions' },
};

const getConfusionColor = (level: number) => {
  if (level < 30) return 'bg-success';
  if (level < 60) return 'bg-warning';
  return 'bg-destructive';
};

const getConfusionLabel = (level: number) => {
  if (level < 30) return 'Clear Understanding';
  if (level < 60) return 'Mild Confusion';
  return 'High Confusion';
};

const getConfusionTextColor = (level: number) => {
  if (level < 30) return 'text-success';
  if (level < 60) return 'text-warning';
  return 'text-destructive';
};

export const ConfusionGauge: React.FC<ConfusionGaugeProps> = ({
  level,
  behaviors,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Gauge */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Current Confusion Level
          </span>
          <span className={cn('text-2xl font-bold', getConfusionTextColor(level))}>
            {Math.round(level)}%
          </span>
        </div>
        
        {/* Gauge Track */}
        <div className="relative h-4 w-full rounded-full overflow-hidden bg-muted">
          {/* Gradient Background */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(to right, hsl(var(--confusion-low)), hsl(var(--confusion-medium)), hsl(var(--confusion-high)))',
            }}
          />
          
          {/* Active Level */}
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              getConfusionColor(level)
            )}
            style={{ width: `${level}%` }}
          />
          
          {/* Animated Pulse at end */}
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all duration-500',
              getConfusionColor(level),
              level > 50 && 'animate-pulse'
            )}
            style={{ left: `calc(${level}% - 6px)` }}
          />
        </div>
        
        {/* Status Label */}
        <div className="flex items-center justify-between text-sm">
          <span className={cn('font-medium', getConfusionTextColor(level))}>
            {getConfusionLabel(level)}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-xs">0%</span>
            <div className="w-16 h-1 rounded-full bg-gradient-to-r from-success via-warning to-destructive" />
            <span className="text-xs">100%</span>
          </div>
        </div>
      </div>

      {/* Detected Behaviors */}
      {behaviors.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Detected Behaviors
          </span>
          <div className="flex flex-wrap gap-2">
            {behaviors.map((behavior) => {
              const info = behaviorIcons[behavior];
              if (!info) return null;
              return (
                <div
                  key={behavior}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium',
                    'bg-secondary text-secondary-foreground',
                    'animate-fade-in'
                  )}
                >
                  {info.icon}
                  <span>{info.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
