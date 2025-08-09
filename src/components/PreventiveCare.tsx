import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { Progress } from './ui/progress'
import { ArrowLeft, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const preventiveCare = {
  screenings: [
    {
      name: 'Annual Physical Exam',
      description: 'Comprehensive health checkup',
      frequency: 'Yearly',
      lastDone: '2023-04-15',
      nextDue: '2024-04-15',
      status: 'overdue',
      priority: 'high'
    },
    {
      name: 'Mammogram',
      description: 'Breast cancer screening',
      frequency: 'Every 2 years',
      lastDone: '2023-06-20',
      nextDue: '2025-06-20',
      status: 'current',
      priority: 'medium'
    },
    {
      name: 'Colonoscopy',
      description: 'Colorectal cancer screening',
      frequency: 'Every 10 years',
      lastDone: '2020-03-10',
      nextDue: '2030-03-10',
      status: 'current',
      priority: 'medium'
    },
    {
      name: 'Bone Density Scan',
      description: 'Osteoporosis screening',
      frequency: 'Every 2 years',
      lastDone: null,
      nextDue: '2024-12-31',
      status: 'due',
      priority: 'medium'
    }
  ],
  vaccines: [
    {
      name: 'COVID-19 Booster',
      description: 'Updated COVID-19 vaccination',
      lastDone: '2023-09-15',
      nextDue: '2024-09-15',
      status: 'due',
      priority: 'high'
    },
    {
      name: 'Flu Shot',
      description: 'Annual influenza vaccination',
      lastDone: '2023-10-01',
      nextDue: '2024-10-01',
      status: 'due',
      priority: 'medium'
    },
    {
      name: 'Tdap',
      description: 'Tetanus, diphtheria, pertussis',
      lastDone: '2019-05-20',
      nextDue: '2029-05-20',
      status: 'current',
      priority: 'low'
    }
  ]
}

export function PreventiveCare() {
  const [completedItems, setCompletedItems] = useState<string[]>([])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue': return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
      case 'due': return <Badge className="bg-orange-100 text-orange-800">Due Soon</Badge>
      case 'current': return <Badge className="bg-green-100 text-green-800">Current</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'due': return <Clock className="h-4 w-4 text-orange-600" />
      case 'current': return <CheckCircle className="h-4 w-4 text-green-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-orange-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-500'
    }
  }

  const toggleCompleted = (itemName: string) => {
    setCompletedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const overdueCount = [...preventiveCare.screenings, ...preventiveCare.vaccines]
    .filter(item => item.status === 'overdue').length
  
  const dueCount = [...preventiveCare.screenings, ...preventiveCare.vaccines]
    .filter(item => item.status === 'due').length

  const totalItems = preventiveCare.screenings.length + preventiveCare.vaccines.length
  const currentItems = [...preventiveCare.screenings, ...preventiveCare.vaccines]
    .filter(item => item.status === 'current').length
  
  const completionRate = Math.round((currentItems / totalItems) * 100)

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
          <h1 className="text-3xl font-bold text-gray-900">Preventive Care</h1>
          <p className="text-gray-600">Stay on top of your health screenings and vaccinations</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-900">{overdueCount}</div>
                <p className="text-sm text-red-700">Overdue</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-900">{dueCount}</div>
                <p className="text-sm text-orange-700">Due Soon</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-900">{currentItems}</div>
                <p className="text-sm text-green-700">Up to Date</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completion</span>
                <span className="text-sm font-medium">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Screenings */}
      <Card>
        <CardHeader>
          <CardTitle>Health Screenings</CardTitle>
          <CardDescription>
            Age and gender-appropriate health screenings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {preventiveCare.screenings.map((screening, index) => (
              <div 
                key={index} 
                className={`p-4 border-l-4 bg-gray-50 rounded-r-lg ${getPriorityColor(screening.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      checked={completedItems.includes(screening.name)}
                      onCheckedChange={() => toggleCompleted(screening.name)}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(screening.status)}
                        <h3 className="font-medium">{screening.name}</h3>
                        {getStatusBadge(screening.status)}
                      </div>
                      <p className="text-sm text-gray-600">{screening.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Frequency: {screening.frequency}</span>
                        {screening.lastDone && (
                          <span>Last: {screening.lastDone}</span>
                        )}
                        <span>Next: {screening.nextDue}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vaccinations */}
      <Card>
        <CardHeader>
          <CardTitle>Vaccinations</CardTitle>
          <CardDescription>
            Recommended vaccines based on your age and health status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {preventiveCare.vaccines.map((vaccine, index) => (
              <div 
                key={index} 
                className={`p-4 border-l-4 bg-gray-50 rounded-r-lg ${getPriorityColor(vaccine.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      checked={completedItems.includes(vaccine.name)}
                      onCheckedChange={() => toggleCompleted(vaccine.name)}
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(vaccine.status)}
                        <h3 className="font-medium">{vaccine.name}</h3>
                        {getStatusBadge(vaccine.status)}
                      </div>
                      <p className="text-sm text-gray-600">{vaccine.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {vaccine.lastDone && (
                          <span>Last: {vaccine.lastDone}</span>
                        )}
                        <span>Next: {vaccine.nextDue}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}