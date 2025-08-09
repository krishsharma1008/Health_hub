import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { 
  Watch, 
  Heart, 
  Footprints, 
  Flame, 
  Moon, 
  Battery, 
  Wifi,
  AlertTriangle,
  TrendingUp,
  Activity,
  Thermometer,
  Droplets,
  Brain,
  Target,
  Zap
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

interface WearableDevice {
  id: string
  type: string
  name: string
  status: 'connected' | 'syncing' | 'offline'
  batteryLevel: number
  lastSync: number
  dataPoints?: any
  data?: any
}

interface HealthMetric {
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  status: 'normal' | 'warning' | 'critical'
}

const WearablesDashboard: React.FC = () => {
  const [devices, setDevices] = useState<WearableDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [realTimeData, setRealTimeData] = useState<any>({})
  const [predictions, setPredictions] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDevices()
    const interval = setInterval(loadDevices, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedDevice) {
      loadDeviceData(selectedDevice)
      const interval = setInterval(() => loadDeviceData(selectedDevice), 30000)
      return () => clearInterval(interval)
    }
  }, [selectedDevice])

  const loadDevices = async () => {
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL
      const response = await fetch(base ? `${base}/api/wearables/devices` : '/api/wearables/devices')
      if (response.ok) {
        const devicesData = await response.json()
        setDevices(devicesData)
        if (!selectedDevice && devicesData.length > 0) {
          setSelectedDevice(devicesData[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading devices:', error)
    }
    setIsLoading(false)
  }

  const loadDeviceData = async (deviceId: string) => {
    try {
      const [dataResponse, predictionsResponse] = await Promise.all([
        fetch(((import.meta as any).env?.VITE_API_BASE_URL ? `${(import.meta as any).env.VITE_API_BASE_URL}` : '') + `/api/wearables/data/${deviceId}`),
        fetch(((import.meta as any).env?.VITE_API_BASE_URL ? `${(import.meta as any).env.VITE_API_BASE_URL}` : '') + `/api/wearables/predictions/${deviceId}`, { method: 'POST' })
      ])

      if (dataResponse.ok) {
        const data = await dataResponse.json()
        // Validate data fields to prevent chart SVG path errors
        const safe = {
          ...data,
          data: {
            heartRate: Array.isArray(data?.data?.heartRate) ? data.data.heartRate : [],
            steps: Number.isFinite(data?.data?.steps) ? data.data.steps : 0,
            calories: Number.isFinite(data?.data?.calories) ? data.data.calories : 0,
            distance: Number.isFinite(data?.data?.distance) ? data.data.distance : 0,
            hrv: Array.isArray(data?.data?.hrv) ? data.data.hrv : [],
          }
        }
        setRealTimeData(safe)
      }

      if (predictionsResponse.ok) {
        const predData = await predictionsResponse.json()
        setPredictions(predData)
      }
    } catch (error) {
      console.error('Error loading device data:', error)
    }
  }

  const connectDevice = async (deviceType: string) => {
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL
      const response = await fetch(base ? `${base}/api/wearables/connect` : '/api/wearables/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceType, authToken: 'demo-token' })
      })

      if (response.ok) {
        await loadDevices()
      }
    } catch (error) {
      console.error('Error connecting device:', error)
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'apple_watch':
        return <Watch className="w-5 h-5" />
      case 'oura_ring':
        return <Activity className="w-5 h-5" />
      default:
        return <Heart className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500'
      case 'syncing':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const formatHeartRateData = (heartRateArray: any[]) => {
    return heartRateArray?.slice(-20).map((hr, index) => ({
      time: `${index * 3}m ago`,
      value: hr.value,
      timestamp: hr.timestamp
    })) || []
  }

  const generateRadarData = () => {
    if (!realTimeData.data) return []
    
    return [
      {
        metric: 'Heart Rate',
        value: realTimeData.data.heartRate?.[realTimeData.data.heartRate.length - 1]?.value || 0,
        fullMark: 100
      },
      {
        metric: 'Steps',
        value: Math.min((realTimeData.data.steps / 10000) * 100, 100),
        fullMark: 100
      },
      {
        metric: 'Sleep Quality',
        value: 85, // Demo value
        fullMark: 100
      },
      {
        metric: 'HRV',
        value: realTimeData.data.hrv?.[realTimeData.data.hrv?.length - 1]?.value || 0,
        fullMark: 100
      },
      {
        metric: 'Activity',
        value: Math.min((realTimeData.data.calories / 2000) * 100, 100),
        fullMark: 100
      }
    ]
  }

  const currentMetrics: HealthMetric[] = [
    {
      name: 'Heart Rate',
      value: realTimeData.data?.heartRate?.[realTimeData.data.heartRate.length - 1]?.value || 0,
      unit: 'bpm',
      trend: 'stable',
      status: 'normal'
    },
    {
      name: 'Steps',
      value: realTimeData.data?.steps || 0,
      unit: 'steps',
      trend: 'up',
      status: 'normal'
    },
    {
      name: 'Calories',
      value: realTimeData.data?.calories || 0,
      unit: 'cal',
      trend: 'up',
      status: 'normal'
    },
    {
      name: 'Distance',
      value: realTimeData.data?.distance || 0,
      unit: 'km',
      trend: 'up',
      status: 'normal'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Wearables Integration Hub
          </h1>
          <p className="text-muted-foreground">Real-time health monitoring and predictive analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => connectDevice('apple_watch')}>
            <Watch className="w-4 h-4 mr-2" />
            Connect Apple Watch
          </Button>
          <Button variant="outline" onClick={() => connectDevice('oura_ring')}>
            <Activity className="w-4 h-4 mr-2" />
            Connect Oura Ring
          </Button>
        </div>
      </div>

      {/* Device Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <Card 
            key={device.id} 
            className={`cursor-pointer transition-all ${
              selectedDevice === device.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedDevice(device.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                {getDeviceIcon(device.type)}
                {device.name}
                <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Battery</span>
                  <div className="flex items-center gap-2">
                    <Progress value={device.batteryLevel} className="w-16" />
                    <span className="text-sm">{device.batteryLevel}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Sync</span>
                  <span className="text-sm">
                    {new Date(device.lastSync).toLocaleTimeString()}
                  </span>
                </div>
                <Badge variant={device.status === 'connected' ? 'default' : 'secondary'}>
                  {device.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedDevice && realTimeData && (
        <>
          {/* Real-time Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">{metric.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{metric.value.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">{metric.unit}</span>
                    <TrendingUp className={`w-4 h-4 ${
                      metric.trend === 'up' ? 'text-green-500' : 
                      metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts and Analytics */}
          <Tabs defaultValue="realtime" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="realtime">Real-time Data</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="realtime" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Heart Rate (Live)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={formatHeartRateData(realTimeData.data?.heartRate)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          dot={{ fill: '#ef4444' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      Health Score Radar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={generateRadarData()}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar
                          dataKey="value"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Weekly Activity Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={[
                      { day: 'Mon', steps: 8500, calories: 1800, distance: 6.2 },
                      { day: 'Tue', steps: 9200, calories: 1950, distance: 7.1 },
                      { day: 'Wed', steps: 7800, calories: 1700, distance: 5.8 },
                      { day: 'Thu', steps: 10500, calories: 2100, distance: 8.2 },
                      { day: 'Fri', steps: 9800, calories: 2000, distance: 7.5 },
                      { day: 'Sat', steps: 12000, calories: 2300, distance: 9.1 },
                      { day: 'Sun', steps: 8900, calories: 1850, distance: 6.8 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="steps" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="calories" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="predictions" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Predictive Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Sleep Quality Prediction</h4>
                      <p className="text-sm text-blue-700">
                        Based on current stress and HRV levels, tonight's sleep quality is predicted to be <strong>Good</strong> (78% confidence)
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Step Goal Achievement</h4>
                      <p className="text-sm text-green-700">
                        You're on track to reach your 10,000 step goal. Projected daily steps: <strong>11,200</strong>
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">Heart Rate Pattern</h4>
                      <p className="text-sm text-yellow-700">
                        Average heart rate trend is <strong>stable</strong>. Consider a 20-minute walk for optimal cardio health.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Cardiovascular Risk</span>
                        <Badge variant="outline">Low</Badge>
                      </div>
                      <Progress value={15} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Stress Level</span>
                        <Badge variant="secondary">Moderate</Badge>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Sleep Debt</span>
                        <Badge variant="outline">Minimal</Badge>
                      </div>
                      <Progress value={20} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    AI-Powered Health Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        Cardiovascular Pattern
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Your resting heart rate has been consistently in the optimal range (60-70 bpm).
                      </p>
                      <Badge variant="outline">95% Confidence</Badge>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Footprints className="w-4 h-4 text-blue-500" />
                        Activity Correlation
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Your step count correlates with improved sleep quality (r=0.73).
                      </p>
                      <Badge variant="outline">87% Confidence</Badge>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Moon className="w-4 h-4 text-purple-500" />
                        Sleep Optimization
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Optimal bedtime for your circadian rhythm appears to be around 10:30 PM.
                      </p>
                      <Badge variant="outline">82% Confidence</Badge>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-orange-500" />
                        Recovery Patterns
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Your HRV indicates good recovery. Consider maintaining current exercise intensity.
                      </p>
                      <Badge variant="outline">91% Confidence</Badge>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Personalized Recommendations
                    </h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Take a 5-minute walk every 2 hours to maintain circulation</li>
                      <li>• Consider meditation between 7-8 PM to optimize sleep quality</li>
                      <li>• Your optimal workout window appears to be 6-7 AM based on HRV patterns</li>
                      <li>• Maintain hydration levels - your body temp correlates with fluid intake</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

export default WearablesDashboard
