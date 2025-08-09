import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { QuickActions } from './ui/quick-actions'
import { GamificationDashboard } from './ui/gamification'
import { Activity, AlertTriangle, TrendingUp, Calendar, Plus, ArrowRight } from 'lucide-react'
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip as ReTooltip, Legend } from 'recharts'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { generateFromAi } from '@/lib/api'

export function Dashboard() {
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setAiLoading(true)
      setAiError('')
      try {
        const response = await generateFromAi({
          task: 'dashboard_summary',
          data: {
            recentSymptoms: ['Headache', 'Fatigue', 'Sleep Issues'],
            flags: { actionRequired: 2 },
            upcoming: { checkupDays: 28 },
          },
        })
        const text = (response as any).response?.response || (response as any).result || ''
        if (!cancelled) setAiSummary(text)
      } catch (err: any) {
        if (!cancelled) setAiError(err?.message || 'Failed to load AI summary')
      } finally {
        if (!cancelled) setAiLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Health Dashboard</h1>
          <p className="text-muted-foreground">Your personalized health insights and next steps</p>
        </div>
        <Link to="/symptoms">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log Symptoms
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Gamification Section */}
      <GamificationDashboard />

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-orange-800">
                Action Required
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">2</div>
            <p className="text-xs text-orange-700">
              Follow-up on recent symptoms
            </p>
            <Button variant="outline" size="sm" className="mt-3 text-orange-700 border-orange-300">
              View Details
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Health Score
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85/100</div>
            <Progress value={85} className="mt-2" />
            <p className="text-xs text-gray-600 mt-2">
              +5 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Next Checkup
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-gray-600">
              days until annual physical
            </p>
            <Button variant="outline" size="sm" className="mt-3">
              Schedule
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>360° Health Score</CardTitle>
          <CardDescription>Composite across sleep, activity, recovery, nutrition, stress, and cardio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={[
                  { metric: 'Sleep', score: 78 },
                  { metric: 'Activity', score: 72 },
                  { metric: 'Recovery', score: 81 },
                  { metric: 'Nutrition', score: 68 },
                  { metric: 'Stress', score: 59 },
                  { metric: 'Cardio', score: 85 },
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <XAxis type="number" dataKey="x" name="Sleep Quality" unit="/100" />
                  <YAxis type="number" dataKey="y" name="Stress" unit="/100" />
                  <ZAxis type="number" dataKey="z" range={[60, 200]} name="HRV" />
                  <ReTooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                  <Scatter name="Sleep vs Stress" data={[{ x: 82, y: 40, z: 68 }, { x: 70, y: 55, z: 60 }, { x: 60, y: 70, z: 52 }]} fill="#10b981" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Symptoms</CardTitle>
            <CardDescription>
              Your latest symptom entries and analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Headache & Fatigue</p>
                <p className="text-sm text-gray-600">2 days ago</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Analyzed</Badge>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Sleep Issues</p>
                <p className="text-sm text-gray-600">5 days ago</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">In Progress</Badge>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <Link to="/symptoms">
              <Button variant="outline" className="w-full">
                View All Symptoms
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lab Results</CardTitle>
            <CardDescription>
              Latest test results and trends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium">Cholesterol Panel</p>
                <p className="text-sm text-gray-600">Within normal range</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Normal</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium">Vitamin D</p>
                <p className="text-sm text-gray-600">Slightly low</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Monitor</Badge>
            </div>

            <Link to="/labs">
              <Button variant="outline" className="w-full">
                View All Results
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Summary</CardTitle>
          <CardDescription>Personalized overview and quick actions</CardDescription>
        </CardHeader>
        <CardContent>
          {aiLoading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : aiError ? (
            <div className="text-sm text-red-600">{aiError}</div>
          ) : (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">{aiSummary}</div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to keep your health on track
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/symptoms">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="mr-2 h-4 w-4" />
                Log New Symptoms
              </Button>
            </Link>
            
            <Link to="/labs">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                Upload Lab Results
              </Button>
            </Link>
            
            <Link to="/providers">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Find Specialists
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}