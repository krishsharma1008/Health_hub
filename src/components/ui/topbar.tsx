import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Settings, Bell, Search } from 'lucide-react'
import { Input } from './input'
import { Button } from './button'
import { ThemeToggle } from './theme-toggle'
import { Badge } from './badge'

export function Topbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length > 2) {
      // Mock AI-powered search results
      const mockResults = [
        { type: 'provider', title: 'Dr. Sarah Johnson - Cardiology', subtitle: '2.3 miles away' },
        { type: 'symptom', title: 'Headache symptoms', subtitle: 'From your health journal' },
        { type: 'lab', title: 'Recent cholesterol results', subtitle: 'April 15, 2024' },
        { type: 'chat', title: 'Nutrition consultation', subtitle: '3 days ago' }
      ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
      
      setSearchResults(mockResults)
      setShowResults(true)
    } else {
      setShowResults(false)
    }
  }

  return (
    <div className={cn('sticky top-0 z-30 w-full border-b bg-background/70 backdrop-blur')}> 
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo/Brand */}
        <div className="font-semibold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Health Copilot
        </div>
        
        {/* Unified Search Bar */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search providers, symptoms, history..."
              id="global-search"
              name="query"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4"
              onFocus={() => searchQuery.length > 2 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
            />
          </div>
          
          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50">
              <div className="p-2 space-y-1">
                {searchResults.map((result, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 hover:bg-accent rounded cursor-pointer">
                    <Badge variant="outline" className="text-xs">
                      {result.type}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.title}</div>
                      <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs bg-red-500">
              2
            </Badge>
          </Button>
          
          <ThemeToggle />
          
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}


