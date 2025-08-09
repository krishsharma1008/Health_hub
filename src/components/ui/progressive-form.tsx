import React, { useState, ReactNode } from 'react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Progress } from './progress'
import { Badge } from './badge'
import { ArrowLeft, ArrowRight, Save, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormStep {
  id: string
  title: string
  description?: string
  content: ReactNode
  validation?: () => boolean
  optional?: boolean
}

interface ProgressiveFormProps {
  steps: FormStep[]
  onComplete: (data: any) => void
  onSave?: (data: any) => void
  className?: string
  title?: string
  showVoiceInput?: boolean
}

export function ProgressiveForm({ 
  steps, 
  onComplete, 
  onSave,
  className,
  title = "Form",
  showVoiceInput = false
}: ProgressiveFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const currentFormStep = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const canProceed = !currentFormStep.validation || currentFormStep.validation()

  const handleNext = () => {
    if (canProceed) {
      // Mark current step as completed
      setCompletedSteps(prev => new Set(prev).add(currentStep))
      
      if (isLastStep) {
        onComplete(formData)
      } else {
        setCurrentStep(prev => prev + 1)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSave = () => {
    if (onSave) {
      onSave(formData)
    }
  }

  const jumpToStep = (stepIndex: number) => {
    if (stepIndex <= Math.max(...Array.from(completedSteps)) + 1) {
      setCurrentStep(stepIndex)
    }
  }

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {onSave && (
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={((currentStep + 1) / steps.length) * 100} />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% complete</span>
          </div>
        </div>

        {/* Step Navigator */}
        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => jumpToStep(index)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                index === currentStep && "bg-primary text-primary-foreground",
                completedSteps.has(index) && index !== currentStep && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                index > currentStep && !completedSteps.has(index) && "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              disabled={index > Math.max(...Array.from(completedSteps)) + 1}
            >
              {index + 1}
              {step.optional && <span className="ml-1 opacity-60">(optional)</span>}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Step Content */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{currentFormStep.title}</h3>
            {currentFormStep.description && (
              <p className="text-muted-foreground">{currentFormStep.description}</p>
            )}
            {currentFormStep.optional && (
              <Badge variant="secondary" className="mt-2">Optional</Badge>
            )}
          </div>
          
          <div className="min-h-[200px]">
            {React.cloneElement(currentFormStep.content as React.ReactElement, {
              formData,
              updateFormData,
              stepData: formData[currentFormStep.id] || {}
            })}
          </div>
        </div>

        {/* Voice Input Button */}
        {showVoiceInput && (
          <div className="flex justify-center">
            <Button variant="outline" size="sm">
              <Mic className="w-4 h-4 mr-2" />
              Voice Input
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            {currentFormStep.optional && !isLastStep && (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(prev => prev + 1)}
              >
                Skip
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className={isLastStep ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isLastStep ? "Complete" : "Next"}
              {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Example step content components
export const TextFieldStep = ({ 
  label, 
  placeholder, 
  required = false, 
  formData, 
  updateFormData, 
  fieldKey 
}: any) => (
  <div className="space-y-2">
    <label className="text-sm font-medium">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="text"
      placeholder={placeholder}
      value={formData[fieldKey] || ''}
      onChange={(e) => updateFormData(fieldKey, e.target.value)}
      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      required={required}
    />
  </div>
)

export const SelectionStep = ({ 
  label, 
  options, 
  multiple = false, 
  formData, 
  updateFormData, 
  fieldKey 
}: any) => (
  <div className="space-y-4">
    <label className="text-sm font-medium">{label}</label>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {options.map((option: any) => (
        <Button
          key={option.value}
          variant={
            multiple 
              ? (formData[fieldKey]?.includes(option.value) ? "default" : "outline")
              : (formData[fieldKey] === option.value ? "default" : "outline")
          }
          className="h-auto p-4 text-left justify-start"
          onClick={() => {
            if (multiple) {
              const current = formData[fieldKey] || []
              const updated = current.includes(option.value)
                ? current.filter((v: any) => v !== option.value)
                : [...current, option.value]
              updateFormData(fieldKey, updated)
            } else {
              updateFormData(fieldKey, option.value)
            }
          }}
        >
          <div>
            <div className="font-medium">{option.label}</div>
            {option.description && (
              <div className="text-sm text-muted-foreground">{option.description}</div>
            )}
          </div>
        </Button>
      ))}
    </div>
  </div>
)
