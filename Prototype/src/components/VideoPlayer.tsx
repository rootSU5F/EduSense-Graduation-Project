import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Camera, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { formatTimestamp } from '@/lib/mockData';

interface VideoPlayerProps {
  currentTime: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  showWebcam: boolean;
  demoMode: boolean;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  currentTime,
  isPlaying,
  onPlayPause,
  onSeek,
  showWebcam,
  demoMode,
  className,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const totalDuration = 3600; // 1 hour
  const progress = (currentTime / totalDuration) * 100;

  return (
    <div className={cn('relative rounded-xl overflow-hidden bg-foreground/95 shadow-xl', className)}>
      {/* Video Placeholder */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-foreground/90 to-foreground">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <Play className="w-10 h-10 text-primary-foreground/80" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-primary-foreground/90">
                Neural Networks Lecture
              </h3>
              <p className="text-sm text-primary-foreground/60">
                Introduction to Deep Learning - Week 3
              </p>
            </div>
          </div>
        </div>

        {/* Webcam Preview Overlay */}
        {showWebcam && (
          <div className="absolute bottom-4 right-4 w-40 h-30 rounded-lg overflow-hidden border-2 border-primary/50 shadow-lg animate-fade-in">
            <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
              <div className="text-center space-y-2">
                <Camera className="w-6 h-6 mx-auto text-muted-foreground" />
                <span className="text-xs text-muted-foreground block">
                  {demoMode ? 'Demo Mode' : 'Live Feed'}
                </span>
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs text-success">Active</span>
                </div>
              </div>
            </div>
            
            {/* Privacy indicator on webcam */}
            <div className="absolute top-1 left-1 flex items-center gap-1 bg-card/80 backdrop-blur-sm rounded px-1.5 py-0.5">
              <Lock className="w-2.5 h-2.5 text-success" />
              <span className="text-[10px] text-success font-medium">Local</span>
            </div>
          </div>
        )}

        {/* Privacy Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-3 py-1.5 animate-fade-in">
          <Lock className="w-3.5 h-3.5 text-success" />
          <span className="text-xs font-medium text-foreground">
            Processing Locally
          </span>
        </div>

        {/* Demo Mode Badge */}
        {demoMode && (
          <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm rounded-full px-3 py-1.5 animate-fade-in">
            <span className="text-xs font-medium text-primary-foreground">
              Demo Mode
            </span>
          </div>
        )}
      </div>

      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/90 to-transparent p-4">
        {/* Progress Bar */}
        <div 
          className="w-full h-1.5 rounded-full bg-primary-foreground/20 cursor-pointer mb-3 group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            onSeek(Math.round(percentage * totalDuration));
          }}
        >
          <div 
            className="h-full rounded-full bg-primary relative transition-all"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPlayPause}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>

            <span className="text-sm text-primary-foreground/80 font-medium">
              {formatTimestamp(currentTime)} / {formatTimestamp(totalDuration)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
