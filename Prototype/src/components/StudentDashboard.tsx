import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { ConfusionGauge } from './ConfusionGauge';
import { ConfusionTimeline } from './ConfusionTimeline';
import { AdaptiveLearningPanel } from './AdaptiveLearningPanel';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { generateConfusionTimeline, confusionPeaks, formatTimestamp } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { BookOpen, AlertCircle, TrendingDown, Clock, ChevronRight } from 'lucide-react';

interface StudentDashboardProps {
  demoMode: boolean;
  className?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  demoMode,
  className,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showWebcam, setShowWebcam] = useState(true);
  const [resourcePanelOpen, setResourcePanelOpen] = useState(false);
  const [selectedPeak, setSelectedPeak] = useState<typeof confusionPeaks[0] | null>(null);
  const [hasShownNotification, setHasShownNotification] = useState<number[]>([]);

  const confusionData = useMemo(() => generateConfusionTimeline(), []);

  // Get current confusion level based on time
  const currentConfusion = useMemo(() => {
    const dataPoint = confusionData.find(
      (d) => Math.abs(d.timestamp - currentTime) < 15
    );
    return dataPoint || { confusionLevel: 20, behaviors: [], topic: 'Introduction' };
  }, [confusionData, currentTime]);

  // Simulate time progression
  useEffect(() => {
    if (!isPlaying || !demoMode) return;
    
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 10;
        return next > 3600 ? 0 : next;
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isPlaying, demoMode]);

  // Check for confusion peaks and show notifications
  useEffect(() => {
    const peak = confusionPeaks.find(
      (p) => Math.abs(p.timestamp - currentTime) < 50 && !hasShownNotification.includes(p.timestamp)
    );

    if (peak && currentConfusion.confusionLevel > 60) {
      setHasShownNotification((prev) => [...prev, peak.timestamp]);
      toast({
        title: "Help Available",
        description: `We detected confusion with "${peak.topic}". Resources are ready!`,
        action: (
          <Button
            size="sm"
            onClick={() => {
              setSelectedPeak(peak);
              setResourcePanelOpen(true);
            }}
          >
            View
          </Button>
        ),
      });
    }
  }, [currentTime, currentConfusion, hasShownNotification]);

  const handleTimeClick = useCallback((timestamp: number) => {
    setCurrentTime(timestamp);
    const peak = confusionPeaks.find(
      (p) => Math.abs(p.timestamp - timestamp) < 100
    );
    if (peak) {
      setSelectedPeak(peak);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleFeedback = useCallback((type: 'helpful' | 'confused' | 'irrelevant') => {
    toast({
      title: "Thank you for your feedback!",
      description: type === 'helpful' 
        ? "Great! We'll continue providing similar resources."
        : type === 'confused'
        ? "We'll generate additional explanations for you."
        : "We'll adjust our recommendations.",
    });
    setResourcePanelOpen(false);
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <VideoPlayer
            currentTime={currentTime}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            showWebcam={showWebcam}
            demoMode={demoMode}
          />
        </div>

        {/* Confusion Panel */}
        <div className="space-y-4">
          {/* Real-time Confusion Gauge */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="text-base flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  currentConfusion.confusionLevel < 30 ? 'bg-success' :
                  currentConfusion.confusionLevel < 60 ? 'bg-warning' : 'bg-destructive',
                  'animate-pulse'
                )} />
                Real-time Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ConfusionGauge
                level={currentConfusion.confusionLevel}
                behaviors={currentConfusion.behaviors}
              />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Session Time</p>
                  <p className="font-semibold">{formatTimestamp(currentTime)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-warning/10">
                  <AlertCircle className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Peaks Detected</p>
                  <p className="font-semibold">{hasShownNotification.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Current Topic */}
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-accent/10">
                  <BookOpen className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Topic</p>
                  <p className="font-medium text-sm">{currentConfusion.topic}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Help Available Button */}
          {selectedPeak && !resourcePanelOpen && (
            <Button
              onClick={() => setResourcePanelOpen(true)}
              className="w-full gap-2 animate-fade-in"
              variant="default"
            >
              <BookOpen className="w-4 h-4" />
              View Learning Resources
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          )}
        </div>
      </div>

      {/* Confusion Timeline */}
      <Card>
        <CardContent className="pt-4">
          <ConfusionTimeline
            data={confusionData}
            currentTime={currentTime}
            onTimeClick={handleTimeClick}
            confusionPeaks={confusionPeaks}
          />
        </CardContent>
      </Card>

      {/* Confusion Peaks Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
            Confusion Peaks in This Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {confusionPeaks.map((peak, index) => (
              <button
                key={index}
                onClick={() => {
                  handleTimeClick(peak.timestamp);
                  setSelectedPeak(peak);
                  setResourcePanelOpen(true);
                }}
                className={cn(
                  'p-3 rounded-lg border text-left transition-all hover:shadow-md',
                  peak.level > 70 ? 'border-destructive/30 hover:border-destructive' :
                  peak.level > 50 ? 'border-warning/30 hover:border-warning' :
                  'border-border hover:border-primary'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(peak.timestamp)}
                  </span>
                  <span className={cn(
                    'text-xs font-bold',
                    peak.level > 70 ? 'text-destructive' :
                    peak.level > 50 ? 'text-warning' : 'text-primary'
                  )}>
                    {peak.level}%
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground truncate">
                  {peak.topic}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Adaptive Learning Panel */}
      <AdaptiveLearningPanel
        isOpen={resourcePanelOpen}
        onClose={() => setResourcePanelOpen(false)}
        topic={selectedPeak?.topic || 'Current Topic'}
        timestamp={selectedPeak?.timestamp || currentTime}
        onFeedback={handleFeedback}
      />
    </div>
  );
};
