import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  Home, 
  MessageSquare, 
  BarChart3, 
  User, 
  Watch,
  Search
} from 'lucide-react'
import { Button } from './button'

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
  { id: 'wearables', label: 'Devices', icon: Watch, path: '/wearables' },
  { id: 'search', label: 'Search', icon: Search, path: '/providers' },
]

export function BottomNavigation() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t bg-background/95 backdrop-blur">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 h-full rounded-none",
                isActive && "text-primary bg-primary/10"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn(
                "text-xs font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
