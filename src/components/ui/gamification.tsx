import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Progress } from './progress'
import { Button } from './button'
import { 
  Trophy, 
  Flame, 
  Star, 
  Target, 
  Calendar,
  Award,
  Zap,
  Heart,
  Activity,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  unlocked: boolean
  date?: string
  category: 'health' | 'consistency' | 'milestone' | 'special'
}

interface StreakData {
  current: number
  longest: number
  type: string
  icon: React.ComponentType<{ className?: string }>
}

export function HealthStreak() {
  const [streaks, setStreaks] = useState<StreakData[]>([
    { current: 7, longest: 14, type: 'Daily Check-ins', icon: Calendar },
    { current: 3, longest: 8, type: 'Symptom Logging', icon: Activity },
    { current: 5, longest: 12, type: 'Medication Tracking', icon: Heart },
  ])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Health Streaks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {streaks.map((streak, index) => {
          const Icon = streak.icon
          return (
            <div key={index} className="flex items-center gap-4 p-3 bg-secondary/20 rounded-lg">
              <Icon className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{streak.type}</span>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {streak.current}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Best streak: {streak.longest} days
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first-symptom',
      title: 'Health Journal Starter',
      description: 'Logged your first symptom',
      icon: Activity,
      unlocked: true,
      date: '2024-01-15',
      category: 'milestone'
    },
    {
      id: 'week-streak',
      title: 'Consistent Logger',
      description: 'Maintained a 7-day logging streak',
      icon: Flame,
      unlocked: true,
      date: '2024-01-22',
      category: 'consistency'
    },
    {
      id: 'first-upload',
      title: 'Document Master',
      description: 'Uploaded your first medical document',
      icon: Star,
      unlocked: true,
      date: '2024-01-20',
      category: 'milestone'
    },
    {
      id: 'voice-chat',
      title: 'AI Conversationalist',
      description: 'Had your first voice chat with the AI',
      icon: Zap,
      unlocked: false,
      category: 'special'
    },
    {
      id: 'month-streak',
      title: 'Health Champion',
      description: 'Maintained a 30-day streak',
      icon: Trophy,
      unlocked: false,
      category: 'consistency'
    }
  ])

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const totalCount = achievements.length

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Achievements
          <Badge variant="secondary">{unlockedCount}/{totalCount}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={(unlockedCount / totalCount) * 100} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {achievements.map((achievement) => {
            const Icon = achievement.icon
            return (
              <div
                key={achievement.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all",
                  achievement.unlocked
                    ? "bg-primary/5 border-primary/20"
                    : "bg-muted/20 border-muted opacity-60"
                )}
              >
                <div className={cn(
                  "p-2 rounded-full",
                  achievement.unlocked
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{achievement.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {achievement.description}
                  </div>
                  {achievement.unlocked && achievement.date && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {new Date(achievement.date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function HealthScore() {
  const [score, setScore] = useState(78)
  const [categories, setCategories] = useState([
    { name: 'Activity', score: 85, icon: Activity, color: 'text-green-600' },
    { name: 'Sleep', score: 72, icon: Heart, color: 'text-blue-600' },
    { name: 'Nutrition', score: 80, icon: Star, color: 'text-orange-600' },
    { name: 'Mindfulness', score: 65, icon: Sparkles, color: 'text-purple-600' }
  ])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900'
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900'
    return 'bg-red-100 dark:bg-red-900'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          Health Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className={cn(
            "text-4xl font-bold mb-2",
            getScoreColor(score)
          )}>
            {score}
          </div>
          <div className="text-muted-foreground">Overall Health Score</div>
          <div className={cn(
            "inline-block px-3 py-1 rounded-full text-sm font-medium mt-2",
            getScoreBg(score),
            getScoreColor(score)
          )}>
            {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          {categories.map((category, index) => {
            const Icon = category.icon
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", category.color)} />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <span className={cn("text-sm font-medium", getScoreColor(category.score))}>
                    {category.score}%
                  </span>
                </div>
                <Progress value={category.score} className="h-2" />
              </div>
            )
          })}
        </div>

        {/* Improvement Suggestions */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Improvement Tips</h4>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Try 10 minutes of meditation to boost mindfulness
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Log your sleep schedule for better insights
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function GamificationDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <HealthScore />
      <HealthStreak />
      <Achievements />
    </div>
  )
}
