import React, { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { 
  Send, 
  Mic, 
  Upload, 
  Brain, 
  Activity, 
  Heart, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  TrendingUp,
  Zap,
  Camera,
  X
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Citation {
  id: string
  title: string
  citation: string
  relevanceScore: number
  type: string
}

interface ToolResult {
  toolCall: any
  result?: any
  error?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  citations?: Citation[]
  toolResults?: ToolResult[]
  metadata?: any
}

interface VisualizationData {
  type: 'line' | 'scatter' | 'bar' | 'radar' | 'heatmap'
  title: string
  data: Array<{
    label: string
    value: number
    date?: string
  }>
}

const EnhancedChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [currentTask, setCurrentTask] = useState<string>('general_assistant')
  const [visualizations, setVisualizations] = useState<VisualizationData[]>([])
  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [cameraStream])

  const sendMessage = async (messageText?: string, taskType?: string) => {
    const text = messageText || input
    if (!text.trim() && !isRecording) return

    setIsLoading(true)
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: taskType || currentTask,
          data: { query: text },
          chatId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const result = await response.json()
      
      if (!chatId && result.chatId) {
        setChatId(result.chatId)
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formatStructuredResponse(result.response),
        timestamp: Date.now(),
        citations: result.citations || [],
        toolResults: result.toolResults || [],
        metadata: result.metadata
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Extract visualizations if present
      if (result.response.visualizations) {
        setVisualizations(result.response.visualizations)
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setIsLoading(false)
  }

  const formatStructuredResponse = (response: any): string => {
    if (typeof response === 'string') return response
    
    // Handle structured response with 'response' property
    if (response.response && typeof response.response === 'string') {
      return response.response
    }
    
    // Format different response types
    if (response.symptoms) {
      return formatSymptomAnalysis(response)
    } else if (response.results) {
      return formatLabInterpretation(response)
    } else if (response.mealPlan) {
      return formatNutritionPlan(response)
    } else if (response.predictions) {
      return formatPredictiveAnalysis(response)
    }
    
    return JSON.stringify(response, null, 2)
  }

  const formatSymptomAnalysis = (analysis: any): string => {
    let formatted = `## Symptom Analysis\n\n`
    
    if (analysis.symptoms) {
      formatted += `### Symptoms Identified:\n`
      analysis.symptoms.forEach((symptom: any) => {
        formatted += `- **${symptom.name}** (${symptom.severity})\n`
        formatted += `  - Duration: ${symptom.duration}\n`
        formatted += `  - Frequency: ${symptom.frequency}\n`
      })
    }
    
    if (analysis.assessment) {
      formatted += `\n### Assessment:\n`
      formatted += `- **Urgency Level**: ${analysis.assessment.urgency}\n`
      formatted += `- **Follow-up Needed**: ${analysis.assessment.followUpNeeded ? 'Yes' : 'No'}\n`
      
      if (analysis.assessment.recommendations) {
        formatted += `\n### Recommendations:\n`
        analysis.assessment.recommendations.forEach((rec: string) => {
          formatted += `- ${rec}\n`
        })
      }
    }
    
    return formatted
  }

  const formatLabInterpretation = (interpretation: any): string => {
    let formatted = `## Lab Results Interpretation\n\n`
    
    if (interpretation.results) {
      formatted += `### Test Results:\n`
      interpretation.results.forEach((result: any) => {
        formatted += `- **${result.test}**: ${result.value} ${result.unit} (${result.status})\n`
      })
    }
    
    if (interpretation.interpretation) {
      formatted += `\n### Summary:\n${interpretation.interpretation.summary}\n`
      
      if (interpretation.interpretation.recommendations) {
        formatted += `\n### Recommendations:\n`
        interpretation.interpretation.recommendations.forEach((rec: string) => {
          formatted += `- ${rec}\n`
        })
      }
    }
    
    return formatted
  }

  const formatNutritionPlan = (plan: any): string => {
    let formatted = `## Personalized Nutrition Plan\n\n`
    
    if (plan.dailyTargets) {
      formatted += `### Daily Targets:\n`
      formatted += `- Calories: ${plan.dailyTargets.calories}\n`
      formatted += `- Protein: ${plan.dailyTargets.protein}g\n`
      formatted += `- Carbs: ${plan.dailyTargets.carbs}g\n`
      formatted += `- Fat: ${plan.dailyTargets.fat}g\n`
    }
    
    if (plan.mealPlan) {
      formatted += `\n### Meal Plan:\n`
      plan.mealPlan.forEach((meal: any) => {
        formatted += `**${meal.meal}** (${meal.totalCalories} calories)\n`
        meal.foods.forEach((food: any) => {
          formatted += `- ${food.name}: ${food.amount} (${food.calories} cal)\n`
        })
        formatted += `\n`
      })
    }
    
    return formatted
  }

  const formatPredictiveAnalysis = (analysis: any): string => {
    let formatted = `## Predictive Health Analysis\n\n`
    
    if (analysis.predictions) {
      formatted += `### Predictions:\n`
      analysis.predictions.forEach((pred: any) => {
        formatted += `- **${pred.metric}**: ${pred.currentValue} → ${pred.predictedValue} (${Math.round(pred.confidence * 100)}% confidence)\n`
      })
    }
    
    if (analysis.riskFactors) {
      formatted += `\n### Risk Factors:\n`
      analysis.riskFactors.forEach((risk: any) => {
        formatted += `- **${risk.factor}**: ${risk.impact} impact (${risk.modifiable ? 'modifiable' : 'non-modifiable'})\n`
      })
    }
    
    return formatted
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      
      let audioChunks: Blob[] = []
      
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' })
        await sendAudioMessage(audioBlob)
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      setMediaRecorder(null)
      setIsRecording(false)
    }
  }

  const sendAudioMessage = async (audioBlob: Blob) => {
    setIsLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      
      const response = await fetch('/api/ai/voice-chat', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to process audio')
      }
      
      const result = await response.json()
      
      if (result.transcription) {
        await sendMessage(result.transcription)
      }
    } catch (error) {
      console.error('Error processing audio:', error)
    }
    
    setIsLoading(false)
  }

  const uploadDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('document', file)
    formData.append('title', file.name)
    formData.append('type', 'medical_document')

    try {
      const response = await fetch('/api/kb/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        await sendMessage(`I've uploaded a document: ${file.name}. Please analyze and summarize it.`)
      }
    } catch (error) {
      console.error('Upload error:', error)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, // Use back camera by default
        audio: false 
      })
      setCameraStream(stream)
      setShowCamera(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Could not access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return

      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      
      // Upload the captured photo
      const formData = new FormData()
      formData.append('document', file)
      formData.append('title', file.name)
      formData.append('type', 'medical_image')

      try {
        const response = await fetch('/api/kb/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          await sendMessage(`I've captured and uploaded a photo: ${file.name}. Please analyze this medical image.`)
          stopCamera()
        }
      } catch (error) {
        console.error('Upload error:', error)
        alert('Failed to upload photo. Please try again.')
      }
    }, 'image/jpeg', 0.8)
  }

  const TaskSelector = () => (
    <div className="flex gap-2 mb-4 flex-wrap">
      {[
        { id: 'general_assistant', label: 'General', icon: <Brain className="w-4 h-4" /> },
        { id: 'symptom_analysis', label: 'Symptoms', icon: <Activity className="w-4 h-4" /> },
        { id: 'lab_interpretation', label: 'Lab Results', icon: <Target className="w-4 h-4" /> },
        { id: 'nutrition_plan', label: 'Nutrition', icon: <Heart className="w-4 h-4" /> },
        { id: 'predictive_analysis', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
      ].map(task => (
        <Button
          key={task.id}
          variant={currentTask === task.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrentTask(task.id)}
          className="flex items-center gap-2"
        >
          {task.icon}
          {task.label}
        </Button>
      ))}
    </div>
  )

  const CitationsPanel = ({ citations }: { citations: Citation[] }) => (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Sources & Citations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {citations.map((citation, index) => (
          <div key={index} className="p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{citation.title}</span>
              <Badge variant="secondary" className="text-xs">
                {Math.round(citation.relevanceScore * 100)}% match
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{citation.citation}</p>
            <Badge variant="outline" className="text-xs mt-1">
              {citation.type}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )

  const ToolResultsPanel = ({ toolResults }: { toolResults: ToolResult[] }) => (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Actions Performed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {toolResults.map((result, index) => (
          <div key={index} className="p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              {result.error ? (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <span className="font-medium text-sm">
                {result.toolCall.function.name.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {result.error || result.result?.message || 'Action completed successfully'}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )

  const VisualizationPanel = ({ visualizations }: { visualizations: VisualizationData[] }) => (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Health Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="0">
          <TabsList className="grid w-full grid-cols-3">
            {visualizations.slice(0, 3).map((viz, index) => (
              <TabsTrigger key={index} value={index.toString()}>
                {viz.type.toUpperCase()}
              </TabsTrigger>
            ))}
          </TabsList>
          {visualizations.map((viz, index) => (
            <TabsContent key={index} value={index.toString()}>
              <div className="space-y-2">
                <h4 className="font-medium">{viz.title}</h4>
                <div className="h-48 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {viz.type.charAt(0).toUpperCase() + viz.type.slice(1)} chart visualization
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {viz.data.length} data points
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI Health Copilot
        </h1>
        <p className="text-muted-foreground">Advanced health assistant with vector search, structured responses, and real-time analytics</p>
      </div>

      <TaskSelector />

      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Health Consultation
            {chatId && (
              <Badge variant="outline" className="text-xs">
                Session: {chatId.slice(-8)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {message.role === 'assistant' ? (
                          <Brain className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 bg-primary-foreground rounded-full" />
                        )}
                        <span className="text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        {message.metadata?.tokensUsed && (
                          <Badge variant="outline" className="text-xs">
                            {message.metadata.tokensUsed} tokens
                          </Badge>
                        )}
                      </div>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  
                  {message.citations && message.citations.length > 0 && (
                    <CitationsPanel citations={message.citations} />
                  )}
                  
                  {message.toolResults && message.toolResults.length > 0 && (
                    <ToolResultsPanel toolResults={message.toolResults} />
                  )}
                </div>
              ))}
              
              {visualizations.length > 0 && (
                <VisualizationPanel visualizations={visualizations} />
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator className="my-4" />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              title="Upload Document"
            >
              <Upload className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={startCamera}
              title="Take Photo"
            >
              <Camera className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              className={isRecording ? 'bg-red-100 border-red-300' : ''}
              title={isRecording ? 'Stop Recording' : 'Start Voice Recording'}
            >
              <Mic className={`w-4 h-4 ${isRecording ? 'text-red-600' : ''}`} />
            </Button>
            
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about symptoms, lab results, nutrition, or general health questions..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            
            <Button 
              onClick={() => sendMessage()} 
              disabled={isLoading || (!input.trim() && !isRecording)}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={uploadDocument}
            accept=".pdf,.txt,.json,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.webp"
          />
        </CardContent>
      </Card>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Capture Photo</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={stopCamera}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                />
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={stopCamera}
                >
                  Cancel
                </Button>
                <Button
                  onClick={capturePhoto}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
              </div>
            </div>
          </div>
          
          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  )
}

export default EnhancedChat
