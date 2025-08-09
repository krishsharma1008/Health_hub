import { useState } from 'react'
import { generateFromAi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Slider } from './ui/slider'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SymptomIntake() {
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [currentSymptom, setCurrentSymptom] = useState('')
  const [severity, setSeverity] = useState([5])
  const [duration, setDuration] = useState('')
  const [details, setDetails] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<string>('')
  const [aiError, setAiError] = useState<string>('')

  const addSymptom = () => {
    if (currentSymptom.trim()) {
      setSymptoms([...symptoms, currentSymptom.trim()])
      setCurrentSymptom('')
    }
  }

  const requestAiAnalysis = async () => {
    setAiError('')
    setAiResult('')
    setAiLoading(true)
    try {
      const response = await generateFromAi({
        task: 'symptom_analysis',
        data: {
          symptoms,
          severity: severity[0],
          duration: duration || 'unspecified',
          details,
        },
      })
      setAiResult((response as any).result || '')
    } catch (err: any) {
      setAiError(err?.message || 'Failed to get AI analysis')
    } finally {
      setAiLoading(false)
    }
  }

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Symptom Intake</h1>
          <p className="text-gray-600">Tell us what you're experiencing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Symptoms</CardTitle>
              <CardDescription>
                Add the symptoms you're currently experiencing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter a symptom (e.g., headache, fatigue)"
                  value={currentSymptom}
                  onChange={(e) => setCurrentSymptom(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                />
                <Button onClick={addSymptom}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {symptoms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((symptom, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {symptom}
                      <button
                        onClick={() => removeSymptom(index)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Symptom Details</CardTitle>
              <CardDescription>
                Help us understand your symptoms better
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Overall Severity (1-10)</Label>
                <Slider
                  value={severity}
                  onValueChange={setSeverity}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Mild</span>
                  <span className="font-medium">{severity[0]}/10</span>
                  <span>Severe</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="How long have you had these symptoms?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">A few hours</SelectItem>
                      <SelectItem value="1-day">1 day</SelectItem>
                      <SelectItem value="2-3-days">2-3 days</SelectItem>
                      <SelectItem value="week">About a week</SelectItem>
                      <SelectItem value="weeks">Several weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onset">Onset</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="How did symptoms start?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sudden">Sudden onset</SelectItem>
                      <SelectItem value="gradual">Gradual onset</SelectItem>
                      <SelectItem value="intermittent">Comes and goes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Additional Details</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your symptoms in more detail, including what makes them better or worse..."
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Assessment</CardTitle>
              <CardDescription>
                Based on your input so far
              </CardDescription>
            </CardHeader>
            <CardContent>
              {symptoms.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      Symptoms Logged: {symptoms.length}
                    </p>
                    <p className="text-xs text-blue-700">
                      Severity: {severity[0]}/10
                    </p>
                  </div>
                  
                  <Button className="w-full" onClick={requestAiAnalysis} disabled={aiLoading || symptoms.length === 0}>
                    {aiLoading ? 'Analyzing…' : 'Get Analysis & Recommendations'}
                  </Button>
                  {(aiError || aiResult) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                      {aiError ? (
                        <span className="text-red-600">{aiError}</span>
                      ) : (
                        <span>{aiResult}</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Add symptoms to see preliminary assessment
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Warning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium mb-2">
                  Seek immediate care if you have:
                </p>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• Chest pain or difficulty breathing</li>
                  <li>• Severe headache with vision changes</li>
                  <li>• Signs of stroke or heart attack</li>
                  <li>• Severe allergic reactions</li>
                </ul>
                <Button variant="destructive" size="sm" className="w-full mt-3">
                  Call Emergency Services
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}