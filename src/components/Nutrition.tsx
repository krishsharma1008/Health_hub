import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { generateFromAi } from '@/lib/api'

export function Nutrition() {
  const [dietType, setDietType] = useState('balanced')
  const [allergies, setAllergies] = useState<string>('')
  const [avoid, setAvoid] = useState<string>('')
  const [cuisines, setCuisines] = useState<string>('')
  const [budget, setBudget] = useState<string>('')
  const [mealsPerDay, setMealsPerDay] = useState('3')
  const [cookTime, setCookTime] = useState<string>('30')

  const [age, setAge] = useState<string>('35')
  const [sex, setSex] = useState<string>('female')
  const [height, setHeight] = useState<string>('165')
  const [weight, setWeight] = useState<string>('65')
  const [activity, setActivity] = useState<string>('moderate')
  const [conditions, setConditions] = useState<string>('')

  const [goalType, setGoalType] = useState<string>('recomposition')
  const [caloriesTarget, setCaloriesTarget] = useState<string>('')
  const [macroEmphasis, setMacroEmphasis] = useState<string>('balanced')

  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [aiError, setAiError] = useState('')

  const generatePlan = async () => {
    setAiError('')
    setAiResult('')
    setAiLoading(true)
    try {
      const response = await generateFromAi({
        task: 'nutrition_plan',
        data: {
          profile: {
            age: Number(age) || age,
            sex,
            height_cm: Number(height) || height,
            weight_kg: Number(weight) || weight,
            activity_level: activity,
            health_conditions: conditions.split(',').map(s => s.trim()).filter(Boolean),
          },
          preferences: {
            diet_type: dietType,
            allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
            avoid: avoid.split(',').map(s => s.trim()).filter(Boolean),
            cuisines: cuisines.split(',').map(s => s.trim()).filter(Boolean),
            budget_per_day: budget,
            cooking_time_per_meal_min: Number(cookTime) || cookTime,
            meals_per_day: Number(mealsPerDay) || mealsPerDay,
            equipment: ['stovetop', 'oven', 'microwave'],
          },
          goals: {
            goal_type: goalType,
            calories_target: caloriesTarget ? Number(caloriesTarget) : undefined,
            macro_emphasis: macroEmphasis,
          },
        },
      })
      setAiResult((response as any).result || '')
    } catch (err: any) {
      setAiError(err?.message || 'Failed to generate plan')
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
          <h1 className="text-3xl font-bold text-gray-900">Nutrition & Meal Plans</h1>
          <p className="text-gray-600">Hyper-personalized guidance and weekly plans</p>
        </div>
      </div>

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Food Preferences</CardTitle>
              <CardDescription>Allergies and lifestyle constraints</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Diet Type</Label>
                <Select value={dietType} onValueChange={setDietType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="mediterranean">Mediterranean</SelectItem>
                    <SelectItem value="pescatarian">Pescatarian</SelectItem>
                    <SelectItem value="keto">Keto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Allergies (comma-separated)</Label>
                <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g., peanuts, shellfish" />
              </div>

              <div className="space-y-2">
                <Label>Foods to Avoid</Label>
                <Input value={avoid} onChange={(e) => setAvoid(e.target.value)} placeholder="e.g., red meat, dairy" />
              </div>

              <div className="space-y-2">
                <Label>Favorite Cuisines</Label>
                <Input value={cuisines} onChange={(e) => setCuisines(e.target.value)} placeholder="e.g., Indian, Mexican, Japanese" />
              </div>

              <div className="space-y-2">
                <Label>Budget per Day (optional)</Label>
                <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="$" />
              </div>

              <div className="space-y-2">
                <Label>Meals per Day</Label>
                <Select value={mealsPerDay} onValueChange={setMealsPerDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Max Cook Time per Meal (minutes)</Label>
                <Input value={cookTime} onChange={(e) => setCookTime(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Health Profile</CardTitle>
              <CardDescription>Used to tailor targets and portions</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sex</Label>
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Activity Level</Label>
                <Select value={activity} onValueChange={setActivity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label>Health Conditions (comma-separated, optional)</Label>
                <Input value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="e.g., T2D, hypothyroidism" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Goals</CardTitle>
              <CardDescription>Targets for AI to optimize</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Goal</Label>
                <Select value={goalType} onValueChange={setGoalType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fat_loss">Fat Loss</SelectItem>
                    <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                    <SelectItem value="recomposition">Recomposition</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="general_health">General Health</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Calorie Target (optional)</Label>
                <Input value={caloriesTarget} onChange={(e) => setCaloriesTarget(e.target.value)} placeholder="e.g., 2100" />
              </div>
              <div className="space-y-2">
                <Label>Macro Emphasis</Label>
                <Select value={macroEmphasis} onValueChange={setMacroEmphasis}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="high_protein">High Protein</SelectItem>
                    <SelectItem value="lower_carb">Lower Carb</SelectItem>
                    <SelectItem value="lower_fat">Lower Fat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Generate Plan</CardTitle>
          <CardDescription>AI will create a weekly plan based on your inputs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={generatePlan} disabled={aiLoading}>
            <Sparkles className="mr-2 h-4 w-4" />
            {aiLoading ? 'Generating…' : 'Generate Nutrition Plan'}
          </Button>
          {(aiError || aiResult) && (
            <div className="p-4 bg-gray-50 rounded whitespace-pre-wrap text-sm">
              {aiError ? (
                <span className="text-red-600">{aiError}</span>
              ) : (
                <span>{aiResult}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


