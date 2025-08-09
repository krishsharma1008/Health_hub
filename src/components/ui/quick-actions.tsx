import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from './button'
import { Card } from './card'
import { Badge } from './badge'
import { 
  Plus, 
  Mic, 
  Upload, 
  Activity, 
  Heart, 
  Pill, 
  Calendar,
  Camera,
  X,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path?: string
  action?: () => void
  color: string
  bgColor: string
}

export function QuickActions() {
  const [isExpanded, setIsExpanded] = useState(false)
  const navigate = useNavigate()

  const quickActions: QuickAction[] = [
    {
      id: 'log-symptom',
      label: 'Log Symptom',
      icon: Activity,
      path: '/symptoms',
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900'
    },
    {
      id: 'voice-chat',
      label: 'Voice Chat',
      icon: Mic,
      path: '/voice',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900'
    },
    {
      id: 'upload-labs',
      label: 'Upload Labs',
      icon: Upload,
      path: '/labs',
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900'
    },
    {
      id: 'take-photo',
      label: 'Take Photo',
      icon: Camera,
      path: '/',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900'
    },
    {
      id: 'heart-rate',
      label: 'Check Vitals',
      icon: Heart,
      path: '/wearables',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100 dark:bg-pink-950 dark:hover:bg-pink-900'
    },
    {
      id: 'medication',
      label: 'Log Medication',
      icon: Pill,
      path: '/programs',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950 dark:hover:bg-orange-900'
    },
    {
      id: 'appointment',
      label: 'Book Appointment',
      icon: Calendar,
      path: '/providers',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900'
    }
  ]

  const primaryActions = quickActions.slice(0, 3)
  const secondaryActions = quickActions.slice(3)

  const handleActionClick = (action: QuickAction) => {
    if (action.path) {
      navigate(action.path)
    } else if (action.action) {
      action.action()
    }
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-50 md:bottom-6">
        <div className="relative">
          {/* Secondary Actions (expandable) */}
          {isExpanded && (
            <div className="absolute bottom-16 right-0 space-y-3 animate-in slide-in-from-bottom-2 fade-in-0">
              {secondaryActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.id}
                    size="icon"
                    className={cn(
                      "h-12 w-12 rounded-full shadow-lg transition-all duration-200",
                      action.bgColor,
                      action.color
                    )}
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      transform: `translateY(${(secondaryActions.length - index) * -60}px)`
                    }}
                    onClick={() => handleActionClick(action)}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                )
              })}
            </div>
          )}

          {/* Primary Actions (always visible) */}
          <div className="space-y-3">
            {primaryActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.id}
                  size="icon"
                  className={cn(
                    "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
                    action.bgColor,
                    action.color
                  )}
                  onClick={() => handleActionClick(action)}
                >
                  <Icon className="h-6 w-6" />
                </Button>
              )
            })}
          </div>

          {/* Main FAB */}
          <Button
            size="icon"
            className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all duration-200 mt-3"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Plus className="h-6 w-6 text-white" />
            )}
          </Button>
        </div>
      </div>

      {/* Quick Actions Bar (Dashboard) */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Quick Actions</h3>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.id}
                variant="outline"
                className={cn(
                  "h-20 flex-col gap-2 p-2 transition-all duration-200 hover:scale-105",
                  action.bgColor
                )}
                onClick={() => handleActionClick(action)}
              >
                <Icon className={cn("h-6 w-6", action.color)} />
                <span className="text-xs font-medium text-center leading-tight">
                  {action.label}
                </span>
              </Button>
            )
          })}
        </div>
      </Card>
    </>
  )
}
