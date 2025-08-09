import { cn } from '@/lib/utils'
import { Settings, Bell } from 'lucide-react'

export function Topbar() {
  return (
    <div className={cn('sticky top-0 z-30 w-full border-b bg-white/70 backdrop-blur')}> 
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        <div className="font-semibold tracking-tight">Health Copilot</div>
        <div className="flex items-center gap-3 text-gray-500">
          <Bell className="h-5 w-5" />
          <Settings className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}


