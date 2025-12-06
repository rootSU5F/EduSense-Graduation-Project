// Mock data for EduSense demonstration

export interface ConfusionDataPoint {
  timestamp: number; // seconds
  confusionLevel: number; // 0-100
  topic: string;
  behaviors: string[];
}

export interface LearningResource {
  id: string;
  type: 'explanation' | 'quiz' | 'code' | 'resource';
  title: string;
  content: string;
  timestamp: number;
  topic: string;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'short';
  question: string;
  options?: string[];
  correctAnswer: string;
}

export interface StudentData {
  id: string;
  anonymizedName: string;
  avgConfusion: number;
  confusionFrequency: number;
  challengingTopics: string[];
}

// Generate confusion timeline data
export const generateConfusionTimeline = (): ConfusionDataPoint[] => {
  const topics = [
    'Introduction to Neural Networks',
    'Backpropagation Algorithm',
    'Gradient Descent Optimization',
    'Activation Functions',
    'Loss Functions',
    'Regularization Techniques',
  ];

  const behaviors = [
    'gaze_aversion',
    'brow_tension',
    'head_tilt',
    'reduced_blink_rate',
    'micro_expressions',
  ];

  const data: ConfusionDataPoint[] = [];
  
  for (let i = 0; i <= 3600; i += 10) {
    // Create natural confusion patterns with peaks
    let baseConfusion = 15 + Math.random() * 10;
    
    // Add confusion peaks at specific points
    if (i >= 300 && i <= 400) baseConfusion = 45 + Math.random() * 20;
    if (i >= 800 && i <= 900) baseConfusion = 65 + Math.random() * 25;
    if (i >= 1500 && i <= 1600) baseConfusion = 75 + Math.random() * 20;
    if (i >= 2200 && i <= 2300) baseConfusion = 55 + Math.random() * 15;
    if (i >= 2800 && i <= 2900) baseConfusion = 70 + Math.random() * 20;
    
    const topicIndex = Math.floor(i / 600) % topics.length;
    const detectedBehaviors = baseConfusion > 40 
      ? behaviors.slice(0, Math.floor(baseConfusion / 20))
      : [];

    data.push({
      timestamp: i,
      confusionLevel: Math.min(100, Math.max(0, baseConfusion)),
      topic: topics[topicIndex],
      behaviors: detectedBehaviors,
    });
  }
  
  return data;
};

export const confusionPeaks = [
  { timestamp: 350, level: 62, topic: 'Backpropagation Algorithm', duration: 100 },
  { timestamp: 850, level: 78, topic: 'Gradient Descent Optimization', duration: 100 },
  { timestamp: 1550, level: 85, topic: 'Activation Functions', duration: 100 },
  { timestamp: 2250, level: 58, topic: 'Loss Functions', duration: 100 },
  { timestamp: 2850, level: 72, topic: 'Regularization Techniques', duration: 100 },
];

export const sampleExplanation = `
## Simplified Explanation: Backpropagation

**What is it?**
Backpropagation is how neural networks learn from their mistakes. Think of it like a teacher grading papers and telling each student exactly what they got wrong.

**Key Concepts:**

• **Forward Pass**: Input goes through the network to produce an output
• **Error Calculation**: Compare output with the correct answer
• **Backward Pass**: Send error signals back through each layer
• **Weight Updates**: Adjust connections based on their contribution to the error

**Analogy:**
Imagine a game of telephone where the message gets distorted. Backpropagation is like going back through each person and telling them exactly how much they changed the message, so they can do better next time.

**Formula (Simplified):**
\`\`\`
new_weight = old_weight - learning_rate × gradient
\`\`\`

The gradient tells us the direction and magnitude of change needed.
`;

export const sampleQuizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    type: 'mcq',
    question: 'What is the primary purpose of backpropagation in neural networks?',
    options: [
      'To speed up forward propagation',
      'To calculate gradients for weight updates',
      'To initialize weights randomly',
      'To normalize input data',
    ],
    correctAnswer: 'To calculate gradients for weight updates',
  },
  {
    id: 'q2',
    type: 'mcq',
    question: 'In backpropagation, gradients flow in which direction?',
    options: [
      'From input to output',
      'From output to input',
      'Randomly throughout the network',
      'Only through the first layer',
    ],
    correctAnswer: 'From output to input',
  },
  {
    id: 'q3',
    type: 'short',
    question: 'Explain in one sentence why the chain rule is essential for backpropagation.',
    correctAnswer: 'The chain rule allows us to compute the gradient of the loss with respect to each weight by multiplying the gradients along the path from the loss to that weight.',
  },
];

export const sampleCodeExample = `
import numpy as np

def sigmoid(x):
    """Sigmoid activation function"""
    return 1 / (1 + np.exp(-x))

def sigmoid_derivative(x):
    """Derivative of sigmoid for backpropagation"""
    return x * (1 - x)

# Simple 2-layer neural network
class SimpleNeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        # Initialize weights randomly
        self.weights1 = np.random.randn(input_size, hidden_size) * 0.5
        self.weights2 = np.random.randn(hidden_size, output_size) * 0.5
        
    def forward(self, X):
        """Forward pass through the network"""
        self.hidden = sigmoid(np.dot(X, self.weights1))
        self.output = sigmoid(np.dot(self.hidden, self.weights2))
        return self.output
    
    def backward(self, X, y, learning_rate=0.1):
        """Backpropagation to update weights"""
        # Calculate output layer error
        output_error = y - self.output
        output_delta = output_error * sigmoid_derivative(self.output)
        
        # Calculate hidden layer error
        hidden_error = output_delta.dot(self.weights2.T)
        hidden_delta = hidden_error * sigmoid_derivative(self.hidden)
        
        # Update weights
        self.weights2 += self.hidden.T.dot(output_delta) * learning_rate
        self.weights1 += X.T.dot(hidden_delta) * learning_rate

# Example usage
nn = SimpleNeuralNetwork(2, 4, 1)
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
y = np.array([[0], [1], [1], [0]])  # XOR problem

# Training loop
for i in range(10000):
    nn.forward(X)
    nn.backward(X, y)

print("Predictions:", nn.output.round())
`;

export const sampleResources = [
  {
    id: 'r1',
    title: 'Chapter 4: Backpropagation in Detail',
    type: 'PDF',
    relevance: 95,
    source: 'Course Textbook',
  },
  {
    id: 'r2',
    title: 'Video: Visual Guide to Backpropagation',
    type: 'Video',
    relevance: 88,
    source: '3Blue1Brown',
  },
  {
    id: 'r3',
    title: 'Interactive Backpropagation Playground',
    type: 'Interactive',
    relevance: 82,
    source: 'Course Materials',
  },
  {
    id: 'r4',
    title: 'Practice Problems Set 4',
    type: 'Worksheet',
    relevance: 75,
    source: 'Course Materials',
  },
];

export const generateStudentData = (): StudentData[] => {
  const topics = [
    'Backpropagation',
    'Gradient Descent',
    'Activation Functions',
    'Loss Functions',
    'Regularization',
    'Optimization',
  ];

  return Array.from({ length: 25 }, (_, i) => ({
    id: `student-${i + 1}`,
    anonymizedName: `Student #${i + 1}`,
    avgConfusion: Math.round(20 + Math.random() * 40),
    confusionFrequency: Math.round(2 + Math.random() * 8),
    challengingTopics: topics
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(1 + Math.random() * 3)),
  }));
};

export const classOverviewStats = {
  totalStudents: 28,
  averageConfusion: 34,
  confusionHotspots: 5,
  mostConfusingTopic: 'Backpropagation Algorithm',
  mostConfusingTimestamp: '14:23',
};

// Generate heatmap data (time vs students)
export const generateHeatmapData = () => {
  const timeSlots = Array.from({ length: 36 }, (_, i) => i * 100); // 0 to 3500 seconds
  
  return timeSlots.map(time => {
    let basePercentage = 10 + Math.random() * 15;
    
    // Add peaks
    if (time >= 300 && time <= 400) basePercentage = 35 + Math.random() * 15;
    if (time >= 800 && time <= 900) basePercentage = 55 + Math.random() * 20;
    if (time >= 1500 && time <= 1600) basePercentage = 65 + Math.random() * 20;
    if (time >= 2200 && time <= 2300) basePercentage = 40 + Math.random() * 15;
    if (time >= 2800 && time <= 2900) basePercentage = 50 + Math.random() * 15;
    
    return {
      time,
      percentageConfused: Math.min(100, Math.round(basePercentage)),
      topic: time < 600 ? 'Introduction' :
             time < 1200 ? 'Backpropagation' :
             time < 1800 ? 'Gradient Descent' :
             time < 2400 ? 'Activation Functions' :
             time < 3000 ? 'Loss Functions' : 'Regularization',
    };
  });
};

export const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
