import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { formatTimestamp, type ConfusionDataPoint } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface ConfusionTimelineProps {
  data: ConfusionDataPoint[];
  currentTime: number;
  onTimeClick: (timestamp: number) => void;
  confusionPeaks: Array<{ timestamp: number; level: number; topic: string }>;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const level = data.confusionLevel;
    const colorClass = level < 30 ? 'text-success' : level < 60 ? 'text-warning' : 'text-destructive';
    
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3 animate-fade-in">
        <p className="text-sm font-medium text-foreground">
          {formatTimestamp(data.timestamp)}
        </p>
        <p className={cn('text-lg font-bold', colorClass)}>
          {Math.round(level)}% Confusion
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {data.topic}
        </p>
        {data.behaviors?.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium">Detected: </span>
            {data.behaviors.join(', ')}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const ConfusionTimeline: React.FC<ConfusionTimelineProps> = ({
  data,
  currentTime,
  onTimeClick,
  confusionPeaks,
  className,
}) => {
  // Sample data for performance (every 30 seconds)
  const sampledData = useMemo(() => {
    return data.filter((_, i) => i % 3 === 0);
  }, [data]);

  const handleClick = (data: any) => {
    if (data && data.activePayload) {
      onTimeClick(data.activePayload[0].payload.timestamp);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Confusion Timeline
        </h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            Clear
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-warning" />
            Mild
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            High
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart
          data={sampledData}
          onClick={handleClick}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="confusionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="50%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />

          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Confusion threshold zones */}
          <ReferenceArea y1={60} y2={100} fill="hsl(var(--destructive))" fillOpacity={0.05} />
          <ReferenceArea y1={30} y2={60} fill="hsl(var(--warning))" fillOpacity={0.05} />

          {/* Main area */}
          <Area
            type="monotone"
            dataKey="confusionLevel"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#confusionGradient)"
            animationDuration={1000}
          />

          {/* Current time indicator */}
          <ReferenceLine
            x={currentTime}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeDasharray="4 4"
          />

          {/* Peak markers */}
          {confusionPeaks.map((peak, index) => (
            <ReferenceLine
              key={index}
              x={peak.timestamp}
              stroke="hsl(var(--destructive))"
              strokeWidth={1}
              strokeOpacity={0.5}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Peak markers below chart */}
      <div className="relative h-8 mt-2">
        {confusionPeaks.map((peak, index) => {
          const position = (peak.timestamp / 3600) * 100;
          return (
            <button
              key={index}
              onClick={() => onTimeClick(peak.timestamp)}
              className="absolute -translate-x-1/2 group"
              style={{ left: `${position}%` }}
            >
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse cursor-pointer hover:scale-125 transition-transform" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-card border border-border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                  <p className="font-medium">{formatTimestamp(peak.timestamp)}</p>
                  <p className="text-destructive">{peak.level}% confusion</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
