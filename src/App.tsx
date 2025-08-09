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

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="hidden md:block w-64 border-r bg-white/70 backdrop-blur overflow-y-auto">
          <ChatHistorySidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
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
      </div>
    </Router>
  )
}

export default App