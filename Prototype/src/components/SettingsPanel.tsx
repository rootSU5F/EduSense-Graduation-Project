import React, { useState } from 'react';
import { Shield, Camera, Eye, Upload, Tag, Sliders, Bell, Lock, Globe, HardDrive, Trash2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  className?: string;
  isInstructor?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  className,
  isInstructor = false,
}) => {
  const [settings, setSettings] = useState({
    individualMode: true,
    webcamEnabled: true,
    dataSharingEnabled: false,
    confusionSensitivity: 50,
    facialExpression: true,
    gazeTracking: true,
    headPose: true,
    notifications: true,
  });

  const [uploadedFiles, setUploadedFiles] = useState<string[]>([
    'Lecture_Slides_Week1.pdf',
    'Neural_Networks_Transcript.srt',
  ]);

  const [topics, setTopics] = useState([
    'Introduction',
    'Backpropagation',
    'Gradient Descent',
    'Activation Functions',
    'Loss Functions',
    'Regularization',
  ]);

  const updateSetting = (key: keyof typeof settings, value: boolean | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Privacy Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Privacy Controls
          </CardTitle>
          <CardDescription>
            Control how your data is processed and shared
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Processing Mode */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {settings.individualMode ? (
                <div className="p-2 rounded-lg bg-success/10">
                  <Lock className="w-5 h-5 text-success" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
              )}
              <div>
                <p className="font-medium text-foreground">
                  {settings.individualMode ? 'Individual Study Mode' : 'Class Analytics Mode'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {settings.individualMode
                    ? 'All processing happens locally on your device'
                    : 'Anonymous analytics shared with instructor'}
                </p>
              </div>
            </div>
            <Switch
              checked={!settings.individualMode}
              onCheckedChange={(checked) => updateSetting('individualMode', !checked)}
            />
          </div>

          {/* Webcam Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Webcam Access</p>
                <p className="text-sm text-muted-foreground">
                  {settings.webcamEnabled ? 'Camera is active' : 'Camera is disabled'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                settings.webcamEnabled ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
              )}>
                {settings.webcamEnabled ? 'Granted' : 'Denied'}
              </span>
              <Switch
                checked={settings.webcamEnabled}
                onCheckedChange={(checked) => updateSetting('webcamEnabled', checked)}
              />
            </div>
          </div>

          {/* Data Sharing */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Data Sharing</p>
                <p className="text-sm text-muted-foreground">
                  Share anonymized learning patterns
                </p>
              </div>
            </div>
            <Switch
              checked={settings.dataSharingEnabled}
              onCheckedChange={(checked) => updateSetting('dataSharingEnabled', checked)}
            />
          </div>

          {/* Privacy Notice */}
          <div className="p-3 rounded-lg border border-success/30 bg-success/5">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-success mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-success mb-1">Your Privacy is Protected</p>
                <p>No video is ever recorded or transmitted. Only anonymized behavioral patterns are analyzed locally.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detection Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            Detection Settings
          </CardTitle>
          <CardDescription>
            Customize confusion detection sensitivity and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sensitivity Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">Confusion Sensitivity</p>
              <span className="text-sm text-muted-foreground">
                {settings.confusionSensitivity < 33 ? 'Low' : settings.confusionSensitivity < 66 ? 'Medium' : 'High'}
              </span>
            </div>
            <Slider
              value={[settings.confusionSensitivity]}
              onValueChange={(value) => updateSetting('confusionSensitivity', value[0])}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Less sensitive</span>
              <span>More sensitive</span>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Detection Features
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Facial Expression Analysis</span>
                </div>
                <Switch
                  checked={settings.facialExpression}
                  onCheckedChange={(checked) => updateSetting('facialExpression', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Gaze Tracking</span>
                </div>
                <Switch
                  checked={settings.gazeTracking}
                  onCheckedChange={(checked) => updateSetting('gazeTracking', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Head Pose Detection</span>
                </div>
                <Switch
                  checked={settings.headPose}
                  onCheckedChange={(checked) => updateSetting('headPose', checked)}
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium">Confusion Notifications</span>
                <p className="text-xs text-muted-foreground">Show alerts when resources are available</p>
              </div>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => updateSetting('notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Course Configuration (Instructor Only) */}
      {isInstructor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Course Configuration
            </CardTitle>
            <CardDescription>
              Manage course materials for the RAG knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Course Materials</p>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drop files here or click to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOCX, TXT, SRT supported
                </p>
              </div>
              
              {/* Uploaded Files */}
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-sm">{file}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Topic Tags */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Topic Tags</p>
                <Button variant="outline" size="sm">
                  <Tag className="w-3 h-3 mr-1" />
                  Add Tag
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    {topic}
                    <button className="ml-1 hover:text-destructive transition-colors">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
