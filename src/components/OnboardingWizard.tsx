import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { 
  User, 
  Heart, 
  Watch, 
  MessageSquare, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react'

interface OnboardingWizardProps {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [userData, setUserData] = useState({
    name: '',
    age: '',
    healthGoals: [] as string[],
    devices: [] as string[]
  })

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Health Copilot',
      description: 'Your AI-powered health companion',
      icon: Sparkles
    },
    {
      id: 'profile',
      title: 'Set up your profile',
      description: 'Tell us a bit about yourself',
      icon: User
    },
    {
      id: 'goals',
      title: 'Health goals',
      description: 'What would you like to focus on?',
      icon: Heart
    },
    {
      id: 'devices',
      title: 'Connect devices',
      description: 'Link your wearables and health apps',
      icon: Watch
    },
    {
      id: 'chat',
      title: 'Try voice chat',
      description: 'Experience AI-powered health conversations',
      icon: MessageSquare
    }
  ]

  const healthGoals = [
    'Weight Management',
    'Better Sleep',
    'Stress Reduction',
    'Exercise More',
    'Nutrition',
    'Preventive Care'
  ]

  const deviceOptions = [
    'Apple Watch',
    'iPhone Health',
    'Oura Ring',
    'Fitbit',
    'Google Fit',
    'MyFitnessPal'
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const toggleHealthGoal = (goal: string) => {
    setUserData(prev => ({
      ...prev,
      healthGoals: prev.healthGoals.includes(goal)
        ? prev.healthGoals.filter(g => g !== goal)
        : [...prev.healthGoals, goal]
    }))
  }

  const toggleDevice = (device: string) => {
    setUserData(prev => ({
      ...prev,
      devices: prev.devices.includes(device)
        ? prev.devices.filter(d => d !== device)
        : [...prev.devices, device]
    }))
  }

  const renderStepContent = () => {
    const step = steps[currentStep]

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Health Copilot</h2>
              <p className="text-muted-foreground">
                Your personal AI health assistant that helps you track symptoms, 
                analyze labs, find providers, and achieve your wellness goals.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="text-center p-4 bg-secondary/20 rounded-lg">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <div className="text-sm font-medium">AI Chat</div>
              </div>
              <div className="text-center p-4 bg-secondary/20 rounded-lg">
                <Heart className="w-6 h-6 mx-auto mb-2 text-red-500" />
                <div className="text-sm font-medium">Health Tracking</div>
              </div>
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={userData.name}
                  onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age"
                  value={userData.age}
                  onChange={(e) => setUserData(prev => ({ ...prev, age: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )

      case 'goals':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Select the health areas you'd like to focus on:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {healthGoals.map((goal) => (
                <Button
                  key={goal}
                  variant={userData.healthGoals.includes(goal) ? "default" : "outline"}
                  className="h-auto p-4 text-left justify-start"
                  onClick={() => toggleHealthGoal(goal)}
                >
                  <div className="flex items-center gap-2">
                    {userData.healthGoals.includes(goal) && (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>{goal}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )

      case 'devices':
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Connect your devices for automatic health data sync:
            </p>
            <div className="space-y-3">
              {deviceOptions.map((device) => (
                <Button
                  key={device}
                  variant={userData.devices.includes(device) ? "default" : "outline"}
                  className="w-full justify-between h-12"
                  onClick={() => toggleDevice(device)}
                >
                  <span>{device}</span>
                  {userData.devices.includes(device) && (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              You can connect these later from the settings page
            </p>
          </div>
        )

      case 'chat':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">You're all set!</h3>
              <p className="text-muted-foreground">
                Start chatting with your AI health assistant. Ask about symptoms, 
                upload lab results, or get personalized health recommendations.
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="mr-2">Voice enabled</Badge>
              <Badge variant="secondary" className="mr-2">Real-time analysis</Badge>
              <Badge variant="secondary">HIPAA compliant</Badge>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const CurrentIcon = steps[currentStep].icon as any

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip
            </Button>
            <div className="text-sm text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </div>
          </div>
          <Progress value={(currentStep + 1) / steps.length * 100} className="mb-4" />
          <CardTitle className="flex items-center gap-2 justify-center">
            <CurrentIcon className="w-5 h-5" />
            {steps[currentStep].title}
          </CardTitle>
          <p className="text-muted-foreground">{steps[currentStep].description}</p>
        </CardHeader>
        
        <CardContent>
          {renderStepContent()}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              {currentStep < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 ml-2" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
