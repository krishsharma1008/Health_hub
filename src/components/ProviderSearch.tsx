import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ArrowLeft, MapPin, Phone, Star, Clock, FileText, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { generateFromAi } from '@/lib/api'

const providers = [
  {
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    rating: 4.8,
    reviews: 127,
    distance: '2.3 miles',
    address: '123 Medical Center Dr, Suite 200',
    phone: '(555) 123-4567',
    nextAvailable: '2024-05-15',
    acceptsInsurance: true,
    languages: ['English', 'Spanish']
  },
  {
    name: 'Dr. Michael Chen',
    specialty: 'Endocrinology',
    rating: 4.9,
    reviews: 89,
    distance: '3.1 miles',
    address: '456 Health Plaza, Floor 3',
    phone: '(555) 234-5678',
    nextAvailable: '2024-05-20',
    acceptsInsurance: true,
    languages: ['English', 'Mandarin']
  },
  {
    name: 'Dr. Emily Rodriguez',
    specialty: 'Dermatology',
    rating: 4.7,
    reviews: 156,
    distance: '1.8 miles',
    address: '789 Wellness Blvd, Suite 101',
    phone: '(555) 345-6789',
    nextAvailable: '2024-06-02',
    acceptsInsurance: false,
    languages: ['English', 'Spanish']
  }
]

const visitPrepData = {
  symptoms: ['Headache', 'Fatigue', 'Sleep issues'],
  medications: ['Lisinopril 10mg daily', 'Metformin 500mg twice daily'],
  allergies: ['Penicillin', 'Shellfish'],
  recentLabs: [
    { test: 'Total Cholesterol', value: '165 mg/dL', date: '2024-04-15' },
    { test: 'Blood Glucose', value: '90 mg/dL', date: '2024-04-15' },
    { test: 'TSH', value: '3.8 mIU/L', date: '2024-04-01' }
  ],
  questions: [
    'Should I be concerned about my TSH levels?',
    'Are there alternatives to my current sleep medication?',
    'What lifestyle changes can help with my energy levels?'
  ]
}

export function ProviderSearch() {
  const [searchLocation, setSearchLocation] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [aiError, setAiError] = useState('')

  const generateVisitPrepPDF = () => {
    // In a real app, this would generate and download a PDF
    alert('Visit preparation PDF would be generated and downloaded')
  }

  const requestVisitPrep = async () => {
    setAiError('')
    setAiSummary('')
    setAiLoading(true)
    try {
      const response = await generateFromAi({
        task: 'visit_prep_summary',
        data: { visitPrepData },
      })
      setAiSummary((response as any).result || '')
    } catch (err: any) {
      setAiError(err?.message || 'Failed to generate visit prep')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Find Providers</h1>
          <p className="text-gray-600">Search for specialists and prepare for your visit</p>
        </div>
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList>
          <TabsTrigger value="search">Search Providers</TabsTrigger>
          <TabsTrigger value="visit-prep">Visit Preparation</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          {/* Search Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search Filters</CardTitle>
              <CardDescription>
                Find the right healthcare provider for your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardiology">Cardiology</SelectItem>
                      <SelectItem value="endocrinology">Endocrinology</SelectItem>
                      <SelectItem value="dermatology">Dermatology</SelectItem>
                      <SelectItem value="neurology">Neurology</SelectItem>
                      <SelectItem value="orthopedics">Orthopedics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input 
                    placeholder="Enter zip code or city"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Insurance</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select insurance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aetna">Aetna</SelectItem>
                      <SelectItem value="bcbs">Blue Cross Blue Shield</SelectItem>
                      <SelectItem value="cigna">Cigna</SelectItem>
                      <SelectItem value="united">United Healthcare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button className="mt-4">Search Providers</Button>
            </CardContent>
          </Card>

          {/* Provider Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {providers.map((provider, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{provider.name}</CardTitle>
                      <CardDescription>{provider.specialty}</CardDescription>
                    </div>
                    <Badge variant={provider.acceptsInsurance ? "default" : "outline"}>
                      {provider.acceptsInsurance ? "In Network" : "Out of Network"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{provider.rating}</span>
                      <span className="text-gray-500">({provider.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{provider.distance}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{provider.address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{provider.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Next available: {provider.nextAvailable}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {provider.languages.map((lang, langIndex) => (
                      <Badge key={langIndex} variant="outline" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" onClick={() => setSelectedProvider(provider)}>
                      Book Appointment
                    </Button>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="visit-prep" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Symptoms</CardTitle>
                  <CardDescription>
                    Symptoms to discuss with your provider
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {visitPrepData.symptoms.map((symptom, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span>{symptom}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Medications</CardTitle>
                  <CardDescription>
                    All medications you're currently taking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {visitPrepData.medications.map((med, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span>{med}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Lab Results</CardTitle>
                  <CardDescription>
                    Latest test results to share
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {visitPrepData.recentLabs.map((lab, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{lab.test}</span>
                          <span className="text-sm text-gray-600 ml-2">({lab.date})</span>
                        </div>
                        <span className="font-medium">{lab.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Questions to Ask</CardTitle>
                  <CardDescription>
                    Important questions for your visit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {visitPrepData.questions.map((question, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm">{question}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Visit Summary</CardTitle>
                  <CardDescription>
                    Generate a one-page summary for your appointment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Symptoms:</span>
                      <span>{visitPrepData.symptoms.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medications:</span>
                      <span>{visitPrepData.medications.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recent Labs:</span>
                      <span>{visitPrepData.recentLabs.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Questions:</span>
                      <span>{visitPrepData.questions.length}</span>
                    </div>
                  </div>
                  
                  <Button onClick={generateVisitPrepPDF} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Visit Prep PDF
                  </Button>
                  <div className="pt-2">
                    <Button variant="outline" onClick={requestVisitPrep} disabled={aiLoading} className="w-full">
                      {aiLoading ? 'Generating…' : 'Generate AI Summary'}
                    </Button>
                  </div>
                  {(aiError || aiSummary) && (
                    <div className="p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">
                      {aiError ? (
                        <span className="text-red-600">{aiError}</span>
                      ) : (
                        <span>{aiSummary}</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Allergies & Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {visitPrepData.allergies.map((allergy, index) => (
                      <Badge key={index} variant="destructive" className="mr-2">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}