import React from 'react';
import { GraduationCap, LayoutDashboard, BarChart3, Settings, Sparkles, Lock, Play } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Switch } from './ui/switch';

interface NavigationProps {
  activeView: 'student' | 'instructor' | 'settings';
  onViewChange: (view: 'student' | 'instructor' | 'settings') => void;
  demoMode: boolean;
  onDemoModeChange: (enabled: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  onViewChange,
  demoMode,
  onDemoModeChange,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                EduSense
              </h1>
              <p className="text-xs text-muted-foreground -mt-0.5">
                Intelligent Learning Assistant
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-muted/50">
            <Button
              variant={activeView === 'student' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('student')}
              className={cn(
                'gap-2',
                activeView === 'student' && 'shadow-sm'
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Student View
            </Button>
            <Button
              variant={activeView === 'instructor' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('instructor')}
              className={cn(
                'gap-2',
                activeView === 'instructor' && 'shadow-sm'
              )}
            >
              <BarChart3 className="w-4 h-4" />
              Instructor View
            </Button>
            <Button
              variant={activeView === 'settings' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('settings')}
              className={cn(
                'gap-2',
                activeView === 'settings' && 'shadow-sm'
              )}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Demo Mode Toggle */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
              <Play className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                Demo Mode
              </span>
              <Switch
                checked={demoMode}
                onCheckedChange={onDemoModeChange}
                className="scale-75"
              />
            </div>

            {/* Privacy Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
              <Lock className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-medium text-success hidden sm:inline">
                Private
              </span>
            </div>

            {/* AI Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary hidden sm:inline">
                AI Powered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 py-2">
            <Button
              variant={activeView === 'student' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('student')}
              className="flex-1"
            >
              <LayoutDashboard className="w-4 h-4" />
            </Button>
            <Button
              variant={activeView === 'instructor' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('instructor')}
              className="flex-1"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button
              variant={activeView === 'settings' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('settings')}
              className="flex-1"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
