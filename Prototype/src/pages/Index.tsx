import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { StudentDashboard } from '@/components/StudentDashboard';
import { InstructorDashboard } from '@/components/InstructorDashboard';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  const [activeView, setActiveView] = useState<'student' | 'instructor' | 'settings'>('student');
  const [demoMode, setDemoMode] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        activeView={activeView}
        onViewChange={setActiveView}
        demoMode={demoMode}
        onDemoModeChange={setDemoMode}
      />

      <main className="container mx-auto px-4 py-6">
        {activeView === 'student' && (
          <StudentDashboard demoMode={demoMode} />
        )}
        
        {activeView === 'instructor' && (
          <InstructorDashboard />
        )}
        
        {activeView === 'settings' && (
          <SettingsPanel isInstructor={true} />
        )}
      </main>

      <Toaster />
    </div>
  );
};

export default Index;
