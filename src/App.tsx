import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/ui/topbar'
import { Dashboard } from './components/Dashboard'
import { SymptomIntake } from './components/SymptomIntake'
import { LabTracker } from './components/LabTracker'
import { HealthPrograms } from './components/HealthPrograms'
import { PreventiveCare } from './components/PreventiveCare'
import { ProviderSearch } from './components/ProviderSearch'
import { Nutrition } from './components/Nutrition'
import { VoiceAssistant } from './components/VoiceAssistant'
import { Chat } from './components/Chat'
import EnhancedChat from './components/EnhancedChat'
import WearablesDashboard from './components/WearablesDashboard'
import RealtimeVoice from './components/RealtimeVoice'
import { ChatHistorySidebar } from './components/ChatHistorySidebar'
import { BottomNavigation } from './components/ui/bottom-navigation'
import { OnboardingWizard } from './components/OnboardingWizard'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('health-copilot-onboarded')
  })

  return (
    <ThemeProvider defaultTheme="system" storageKey="health-copilot-theme">
      <Router>
        <div className="flex h-screen bg-background text-foreground">
          {/* Desktop Sidebar - Hidden on mobile */}
          <div className="hidden lg:block">
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          </div>
          
          {/* Chat History Sidebar - Hidden on mobile */}
          <div className="hidden md:block w-64 border-r bg-card/70 backdrop-blur overflow-y-auto">
            <ChatHistorySidebar />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
            <Topbar />
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
              <Routes>
                <Route path="/" element={<EnhancedChat />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/symptoms" element={<SymptomIntake />} />
                <Route path="/labs" element={<LabTracker />} />
                <Route path="/programs" element={<HealthPrograms />} />
                <Route path="/preventive" element={<PreventiveCare />} />
                <Route path="/providers" element={<ProviderSearch />} />
                <Route path="/nutrition" element={<Nutrition />} />
                <Route path="/wearables" element={<WearablesDashboard />} />
                <Route path="/voice" element={<RealtimeVoice />} />
              </Routes>
            </main>
            <VoiceAssistant />
          </div>
          
          {/* Mobile Bottom Navigation */}
          <BottomNavigation />
          
          {/* Onboarding Wizard */}
          {showOnboarding && (
            <OnboardingWizard onComplete={() => {
              setShowOnboarding(false)
              localStorage.setItem('health-copilot-onboarded', 'true')
            }} />
          )}
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App