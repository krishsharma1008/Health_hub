import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ArrowLeft, Upload, TrendingUp, TrendingDown, Minus, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { generateFromAi } from '@/lib/api'

const mockLabData = [
  { date: '2024-01', cholesterol: 180, glucose: 95, vitaminD: 25 },
  { date: '2024-02', cholesterol: 175, glucose: 92, vitaminD: 28 },
  { date: '2024-03', cholesterol: 170, glucose: 88, vitaminD: 32 },
  { date: '2024-04', cholesterol: 165, glucose: 90, vitaminD: 35 },
]

const labResults = [
  {
    name: 'Total Cholesterol',
    value: 165,
    unit: 'mg/dL',
    range: '< 200',
    status: 'normal',
    trend: 'down',
    lastTest: '2024-04-15'
  },
  {
    name: 'Blood Glucose',
    value: 90,
    unit: 'mg/dL',
    range: '70-100',
    status: 'normal',
    trend: 'stable',
    lastTest: '2024-04-15'
  },
  {
    name: 'Vitamin D',
    value: 35,
    unit: 'ng/mL',
    range: '30-100',
    status: 'normal',
    trend: 'up',
    lastTest: '2024-04-10'
  },
  {
    name: 'Hemoglobin A1C',
    value: 5.2,
    unit: '%',
    range: '< 5.7',
    status: 'normal',
    trend: 'stable',
    lastTest: '2024-03-20'
  },
  {
    name: 'TSH',
    value: 3.8,
    unit: 'mIU/L',
    range: '0.4-4.0',
    status: 'monitor',
    trend: 'up',
    lastTest: '2024-04-01'
  }
]

export function LabTracker() {
  const [selectedMetric, setSelectedMetric] = useState('cholesterol')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiError, setAiError] = useState('')

  const requestLabInterpretation = async () => {
    setAiError('')
    setAiText('')
    setAiLoading(true)
    try {
      const response = await generateFromAi({
        task: 'lab_interpretation',
        data: { labResults },
      })
      setAiText((response as any).result || '')
    } catch (err: any) {
      setAiError(err?.message || 'Failed to get AI interpretation')
    } finally {
      setAiLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal': return <Badge className="bg-green-100 text-green-800">Normal</Badge>
      case 'monitor': return <Badge className="bg-yellow-100 text-yellow-800">Monitor</Badge>
      case 'high': return <Badge className="bg-red-100 text-red-800">High</Badge>
      case 'low': return <Badge className="bg-blue-100 text-blue-800">Low</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
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
          <h1 className="text-3xl font-bold text-gray-900">Lab Results</h1>
          <p className="text-gray-600">Track your lab values and trends over time</p>
        </div>
      </div>

      <Tabs defaultValue="results" className="space-y-6">
        <TabsList>
          <TabsTrigger value="results">Current Results</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="upload">Upload New</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {labResults.map((result, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{result.name}</CardTitle>
                    {getTrendIcon(result.trend)}
                  </div>
                  <CardDescription>Last tested: {result.lastTest}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold">{result.value}</span>
                      <span className="text-sm text-gray-600">{result.unit}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Normal: {result.range}
                      </span>
                      {getStatusBadge(result.status)}
                    </div>

                    {result.status === 'monitor' && (
                      <div className="p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                        Consider retesting in 3 months
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>AI Interpretation</CardTitle>
              <CardDescription>Personalized explanation and guidance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button onClick={requestLabInterpretation} disabled={aiLoading}>
                  {aiLoading ? 'Interpreting…' : 'Interpret Current Results'}
                </Button>
                {(aiError || aiText) && (
                  <div className="p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                    {aiError ? (
                      <span className="text-red-600">{aiError}</span>
                    ) : (
                      <span>{aiText}</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lab Trends</CardTitle>
              <CardDescription>
                Visualize how your lab values change over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cholesterol">Total Cholesterol</SelectItem>
                    <SelectItem value="glucose">Blood Glucose</SelectItem>
                    <SelectItem value="vitaminD">Vitamin D</SelectItem>
                  </SelectContent>
                </Select>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockLabData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey={selectedMetric} 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Lab Report</CardTitle>
                <CardDescription>
                  Upload a PDF of your lab results for automatic parsing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Button variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Choose PDF File
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Supports most major lab formats
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manual Entry</CardTitle>
                <CardDescription>
                  Enter lab values manually
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Test Name</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select test" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cholesterol">Total Cholesterol</SelectItem>
                        <SelectItem value="glucose">Blood Glucose</SelectItem>
                        <SelectItem value="vitaminD">Vitamin D</SelectItem>
                        <SelectItem value="a1c">Hemoglobin A1C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input placeholder="Enter value" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Test Date</Label>
                  <Input type="date" />
                </div>

                <Button className="w-full">Add Lab Result</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}