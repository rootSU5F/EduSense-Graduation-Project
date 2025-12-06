import React, { useState } from 'react';
import { X, ThumbsUp, ThumbsDown, HelpCircle, BookOpen, Code, FileText, ExternalLink, Loader2, CheckCircle, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { cn } from '@/lib/utils';
import { formatTimestamp, sampleExplanation, sampleQuizQuestions, sampleCodeExample, sampleResources } from '@/lib/mockData';

interface AdaptiveLearningPanelProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  timestamp: number;
  onFeedback: (type: 'helpful' | 'confused' | 'irrelevant') => void;
}

export const AdaptiveLearningPanel: React.FC<AdaptiveLearningPanelProps> = ({
  isOpen,
  onClose,
  topic,
  timestamp,
  onFeedback,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, topic]);

  if (!isOpen) return null;

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const checkAnswers = () => {
    setShowResults(true);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l border-border shadow-2xl z-50 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HelpCircle className="w-3 h-3" />
            <span>Adaptive Learning Assistant</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            We noticed you might need help
          </h2>
          <p className="text-sm text-muted-foreground">
            with <span className="font-medium text-primary">{topic}</span> at{' '}
            <span className="font-medium">{formatTimestamp(timestamp)}</span>
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-180px)] overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Generating personalized resources...
            </p>
          </div>
        ) : (
          <Tabs defaultValue="explanation" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0">
              <TabsTrigger
                value="explanation"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Explanation
              </TabsTrigger>
              <TabsTrigger
                value="quiz"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <FileText className="w-4 h-4 mr-2" />
                Practice
              </TabsTrigger>
              <TabsTrigger
                value="code"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <Code className="w-4 h-4 mr-2" />
                Code
              </TabsTrigger>
              <TabsTrigger
                value="resources"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Resources
              </TabsTrigger>
            </TabsList>

            <TabsContent value="explanation" className="p-4 space-y-4 animate-fade-in">
              <div className="prose prose-sm max-w-none">
                <div
                  className="text-sm text-foreground leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{
                    __html: sampleExplanation
                      .replace(/## (.*)/g, '<h3 class="text-lg font-semibold text-foreground mt-4 mb-2">$1</h3>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
                      .replace(/• (.*)/g, '<li class="ml-4 text-muted-foreground">$1</li>')
                      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
                      .replace(/```([^`]+)```/g, '<pre class="bg-muted p-3 rounded-lg overflow-x-auto"><code class="text-xs font-mono">$1</code></pre>')
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="quiz" className="p-4 space-y-6 animate-fade-in">
              {sampleQuizQuestions.map((q, index) => (
                <div key={q.id} className="space-y-3 p-4 rounded-lg bg-muted/50">
                  <p className="font-medium text-foreground">
                    {index + 1}. {q.question}
                  </p>
                  
                  {q.type === 'mcq' && q.options && (
                    <div className="space-y-2">
                      {q.options.map((option) => {
                        const isSelected = selectedAnswers[q.id] === option;
                        const isCorrect = showResults && option === q.correctAnswer;
                        const isWrong = showResults && isSelected && option !== q.correctAnswer;
                        
                        return (
                          <button
                            key={option}
                            onClick={() => handleAnswerSelect(q.id, option)}
                            disabled={showResults}
                            className={cn(
                              'w-full text-left p-3 rounded-lg border transition-all text-sm',
                              isSelected && !showResults && 'border-primary bg-primary/5',
                              !isSelected && !showResults && 'border-border hover:border-primary/50',
                              isCorrect && 'border-success bg-success/10 text-success',
                              isWrong && 'border-destructive bg-destructive/10 text-destructive'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {isCorrect && <CheckCircle className="w-4 h-4" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  
                  {q.type === 'short' && (
                    <textarea
                      placeholder="Type your answer..."
                      className="w-full p-3 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                    />
                  )}
                </div>
              ))}
              
              {!showResults && (
                <Button onClick={checkAnswers} className="w-full">
                  Check Answers
                </Button>
              )}
              
              {showResults && (
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-sm text-success font-medium">
                    Great attempt! Review the correct answers above.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="code" className="p-4 animate-fade-in">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">
                    Interactive Code Example
                  </h4>
                  <Button variant="outline" size="sm">
                    <Play className="w-3 h-3 mr-1" />
                    Run Code
                  </Button>
                </div>
                
                <pre className="bg-foreground rounded-lg p-4 overflow-x-auto">
                  <code className="text-xs text-primary-foreground font-mono whitespace-pre">
                    {sampleCodeExample}
                  </code>
                </pre>
                
                <div className="p-3 rounded-lg bg-muted border border-border">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Output:</p>
                  <code className="text-xs font-mono text-foreground">
                    Predictions: [[0.] [1.] [1.] [0.]]
                  </code>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="resources" className="p-4 space-y-3 animate-fade-in">
              {sampleResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {resource.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {resource.source} • {resource.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-primary">
                      {resource.relevance}% match
                    </span>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
        <p className="text-xs text-muted-foreground mb-3 text-center">
          Was this helpful?
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFeedback('helpful')}
            className="gap-1"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            This helped
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFeedback('confused')}
            className="gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Still confused
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFeedback('irrelevant')}
            className="gap-1 text-muted-foreground"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            Not relevant
          </Button>
        </div>
      </div>
    </div>
  );
};
