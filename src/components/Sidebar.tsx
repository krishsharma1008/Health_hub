import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  Activity, 
  Stethoscope, 
  FileText, 
  Heart, 
  Shield, 
  MapPin,
  Utensils,
  Menu,
  X,
  Brain,
  Watch,
  Mic,
  BarChart3
} from 'lucide-react'
import { Button } from './ui/button'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const navigation = [
  { name: 'AI Copilot', href: '/', icon: Brain },
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Wearables Hub', href: '/wearables', icon: Watch },
  { name: 'Voice Assistant', href: '/voice', icon: Mic },
  { name: 'Symptoms', href: '/symptoms', icon: Stethoscope },
  { name: 'Lab Results', href: '/labs', icon: FileText },
  { name: 'Nutrition', href: '/nutrition', icon: Utensils },
  { name: 'Health Programs', href: '/programs', icon: Heart },
  { name: 'Preventive Care', href: '/preventive', icon: Shield },
  { name: 'Find Providers', href: '/providers', icon: MapPin },
]

export function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation()

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 border-b bg-white/60 backdrop-blur">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Health Copilot</h1>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}