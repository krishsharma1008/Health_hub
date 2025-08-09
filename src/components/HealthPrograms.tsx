import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ArrowLeft, Play, CheckCircle, Clock, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

const programs = {
  diet: [
    {
      title: 'Mediterranean Diet Plan',
      description: 'Heart-healthy eating pattern based on your cholesterol levels',
      duration: '8 weeks',
      progress: 65,
      status: 'active',
      goals: ['Reduce cholesterol by 15%', 'Increase omega-3 intake', 'Add 5 servings of vegetables daily']
    },
    {
      title: 'Anti-Inflammatory Protocol',
      description: 'Reduce inflammation markers through targeted nutrition',
      duration: '12 weeks',
      progress: 0,
      status: 'recommended',
      goals: ['Eliminate processed foods', 'Add turmeric and ginger', 'Increase antioxidant-rich foods']
    }
  ],
  exercise: [
    {
      title: 'Cardio Fitness Builder',
      description: 'Improve cardiovascular health with progressive training',
      duration: '6 weeks',
      progress: 40,
      status: 'active',
      goals: ['30 min cardio 4x/week', 'Improve VO2 max by 10%', 'Reduce resting heart rate']
    },
    {
      title: 'Strength & Mobility',
      description: 'Build muscle mass and improve flexibility',
      duration: '10 weeks',
      progress: 0,
      status: 'available',
      goals: ['2x strength training/week', 'Daily mobility routine', 'Improve posture']
    }
  ],
  sleep: [
    {
      title: 'Sleep Optimization',
      description: 'Improve sleep quality based on your wearable data',
      duration: '4 weeks',
      progress: 80,
      status: 'active',
      goals: ['7-8 hours nightly', 'Consistent sleep schedule', 'Reduce sleep latency']
    }
  ],
  stress: [
    {
      title: 'Mindfulness & Stress Reduction',
      description: 'Evidence-based techniques to manage stress levels',
      duration: '6 weeks',
      progress: 25,
      status: 'active',
      goals: ['Daily 10-min meditation', 'Practice breathing exercises', 'Reduce cortisol levels']
    }
  ]
}

export function HealthPrograms() {
  const [activeTab, setActiveTab] = useState('diet')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'completed': return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'recommended': return <Badge className="bg-orange-100 text-orange-800">Recommended</Badge>
      default: return <Badge variant="outline">Available</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4 text-green-600" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'recommended': return <Target className="h-4 w-4 text-orange-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Programs</h1>
          <p className="text-gray-600">Personalized programs based on your health data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-900">3</div>
            <p className="text-sm text-blue-700">Active Programs</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-900">1</div>
            <p className="text-sm text-green-700">Completed</p>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-900">2</div>
            <p className="text-sm text-orange-700">Recommended</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">52%</div>
            <p className="text-sm text-gray-600">Avg. Progress</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="diet">Diet</TabsTrigger>
          <TabsTrigger value="exercise">Exercise</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
          <TabsTrigger value="stress">Stress</TabsTrigger>
        </TabsList>

        {Object.entries(programs).map(([category, categoryPrograms]) => (
          <TabsContent key={category} value={category} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {categoryPrograms.map((program, index) => (
                <Card key={index} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(program.status)}
                        <CardTitle className="text-xl">{program.title}</CardTitle>
                      </div>
                      {getStatusBadge(program.status)}
                    </div>
                    <CardDescription>{program.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Duration: {program.duration}</span>
                      <span className="font-medium">{program.progress}% Complete</span>
                    </div>
                    
                    <Progress value={program.progress} className="h-2" />
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Program Goals:</h4>
                      <ul className="space-y-1">
                        {program.goals.map((goal, goalIndex) => (
                          <li key={goalIndex} className="text-sm text-gray-600 flex items-center">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      {program.status === 'active' && (
                        <>
                          <Button size="sm">Continue Program</Button>
                          <Button variant="outline" size="sm">View Progress</Button>
                        </>
                      )}
                      {program.status === 'recommended' && (
                        <Button size="sm">Start Program</Button>
                      )}
                      {program.status === 'available' && (
                        <Button variant="outline" size="sm">Learn More</Button>
                      )}
                      {program.status === 'completed' && (
                        <Button variant="outline" size="sm">View Results</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}