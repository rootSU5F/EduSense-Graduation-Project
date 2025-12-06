import React, { useState, useMemo } from 'react';
import { Users, AlertTriangle, Clock, TrendingUp, Share2, Eye, ChevronDown, ChevronUp, Lock, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import {
  classOverviewStats,
  generateHeatmapData,
  generateStudentData,
  formatTimestamp,
  confusionPeaks,
} from '@/lib/mockData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface InstructorDashboardProps {
  className?: string;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}> = ({ icon, label, value, trend, trendUp, color = 'primary' }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs font-medium flex items-center gap-1',
              trendUp ? 'text-success' : 'text-destructive'
            )}>
              {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
              {trend}
            </p>
          )}
        </div>
        <div className={cn(
          'p-2 rounded-lg',
          color === 'primary' && 'bg-primary/10 text-primary',
          color === 'warning' && 'bg-warning/10 text-warning',
          color === 'destructive' && 'bg-destructive/10 text-destructive',
          color === 'success' && 'bg-success/10 text-success',
        )}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const getHeatmapColor = (percentage: number) => {
  if (percentage < 20) return 'bg-success/20';
  if (percentage < 40) return 'bg-success/40';
  if (percentage < 60) return 'bg-warning/60';
  if (percentage < 80) return 'bg-destructive/60';
  return 'bg-destructive/80';
};

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({
  className,
}) => {
  const [selectedHotspot, setSelectedHotspot] = useState<typeof confusionPeaks[0] | null>(null);
  const [expandedStudents, setExpandedStudents] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'confusion' | 'frequency'>('confusion');

  const heatmapData = useMemo(() => generateHeatmapData(), []);
  const studentData = useMemo(() => generateStudentData(), []);

  const sortedStudents = useMemo(() => {
    return [...studentData].sort((a, b) => {
      if (sortBy === 'confusion') return b.avgConfusion - a.avgConfusion;
      return b.confusionFrequency - a.confusionFrequency;
    });
  }, [studentData, sortBy]);

  const toggleStudent = (id: string) => {
    setExpandedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium">{formatTimestamp(data.time)}</p>
          <p className="text-muted-foreground">{data.topic}</p>
          <p className={cn(
            'font-bold',
            data.percentageConfused > 50 ? 'text-destructive' : 'text-warning'
          )}>
            {data.percentageConfused}% confused
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Students Monitored"
          value={classOverviewStats.totalStudents}
          trend="+2 from last week"
          trendUp={true}
          color="primary"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg. Confusion"
          value={`${classOverviewStats.averageConfusion}%`}
          trend="-5% from last session"
          trendUp={true}
          color="success"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Confusion Hotspots"
          value={classOverviewStats.confusionHotspots}
          color="warning"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Peak Confusion"
          value={classOverviewStats.mostConfusingTimestamp}
          color="destructive"
        />
      </div>

      {/* Confusion Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Class Confusion Heatmap</CardTitle>
            <Button variant="outline" size="sm">
              <Filter className="w-3 h-3 mr-1" />
              Filter
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Aggregated confusion levels across all students over time
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={heatmapData}>
              <XAxis
                dataKey="time"
                tickFormatter={formatTimestamp}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval={5}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="percentageConfused"
                radius={[4, 4, 0, 0]}
                onClick={(data) => {
                  const peak = confusionPeaks.find(
                    (p) => Math.abs(p.timestamp - data.time) < 100
                  );
                  if (peak) setSelectedHotspot(peak);
                }}
              >
                {heatmapData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.percentageConfused > 50
                        ? 'hsl(var(--destructive))'
                        : entry.percentageConfused > 30
                        ? 'hsl(var(--warning))'
                        : 'hsl(var(--success))'
                    }
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Heatmap Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-success" />
              0-30% (Low)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-warning" />
              31-50% (Medium)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-destructive" />
              51-100% (High)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Confusion Details Panel */}
      {selectedHotspot && (
        <Card className="border-destructive/50 animate-fade-in">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Confusion Hotspot Details
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedHotspot(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Timestamp</p>
                <p className="font-semibold">{formatTimestamp(selectedHotspot.timestamp)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold">{selectedHotspot.duration}s</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Topic</p>
                <p className="font-semibold">{selectedHotspot.topic}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peak Level</p>
                <p className="font-semibold text-destructive">{selectedHotspot.level}%</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" className="gap-1">
                <Eye className="w-3 h-3" />
                Preview Remediation
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Share2 className="w-3 h-3" />
                Share with Class
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Engagement Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Student Engagement</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Lock className="w-3 h-3 text-success" />
                <span className="text-xs text-muted-foreground">
                  No video feeds stored - only behavioral analytics
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={sortBy === 'confusion' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('confusion')}
              >
                By Confusion
              </Button>
              <Button
                variant={sortBy === 'frequency' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setSortBy('frequency')}
              >
                By Frequency
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sortedStudents.slice(0, 10).map((student) => (
              <div
                key={student.id}
                className="border border-border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleStudent(student.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {student.anonymizedName.split('#')[1]}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground text-sm">
                        {student.anonymizedName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.confusionFrequency} confusion events
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={cn(
                        'text-sm font-semibold',
                        student.avgConfusion > 50 ? 'text-destructive' :
                        student.avgConfusion > 30 ? 'text-warning' : 'text-success'
                      )}>
                        {student.avgConfusion}%
                      </p>
                      <p className="text-xs text-muted-foreground">avg confusion</p>
                    </div>
                    {expandedStudents.includes(student.id) ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                
                {expandedStudents.includes(student.id) && (
                  <div className="px-3 pb-3 pt-1 bg-muted/30 border-t border-border animate-fade-in">
                    <p className="text-xs text-muted-foreground mb-2">Challenging Topics:</p>
                    <div className="flex flex-wrap gap-1">
                      {student.challengingTopics.map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
