import { z } from 'zod'

// Response schemas for structured AI outputs
export const SymptomAnalysisSchema = z.object({
  symptoms: z.array(z.object({
    name: z.string(),
    severity: z.enum(['mild', 'moderate', 'severe']),
    duration: z.string(),
    frequency: z.string(),
    associatedFactors: z.array(z.string()).optional()
  })),
  assessment: z.object({
    urgency: z.enum(['low', 'medium', 'high', 'emergency']),
    riskFactors: z.array(z.string()),
    recommendations: z.array(z.string()),
    followUpNeeded: z.boolean(),
    timeframe: z.string().optional()
  }),
  citations: z.array(z.object({
    source: z.string(),
    relevance: z.number(),
    text: z.string()
  })).optional()
})

export const LabInterpretationSchema = z.object({
  results: z.array(z.object({
    test: z.string(),
    value: z.string(),
    unit: z.string(),
    range: z.string(),
    status: z.enum(['normal', 'abnormal', 'borderline', 'critical']),
    trend: z.enum(['improving', 'worsening', 'stable']).optional()
  })),
  interpretation: z.object({
    summary: z.string(),
    keyFindings: z.array(z.string()),
    concerns: z.array(z.string()),
    recommendations: z.array(z.string()),
    followUpTests: z.array(z.string()).optional()
  }),
  riskAssessment: z.object({
    overallRisk: z.enum(['low', 'moderate', 'high']),
    specificRisks: z.array(z.object({
      condition: z.string(),
      probability: z.number(),
      timeframe: z.string()
    }))
  }),
  citations: z.array(z.object({
    source: z.string(),
    relevance: z.number(),
    text: z.string()
  })).optional()
})

export const NutritionPlanSchema = z.object({
  profile: z.object({
    age: z.number(),
    gender: z.string(),
    activityLevel: z.string(),
    goals: z.array(z.string()),
    restrictions: z.array(z.string()).optional(),
    preferences: z.array(z.string()).optional()
  }),
  dailyTargets: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
    fiber: z.number(),
    water: z.number()
  }),
  mealPlan: z.array(z.object({
    meal: z.string(),
    foods: z.array(z.object({
      name: z.string(),
      amount: z.string(),
      calories: z.number(),
      nutrients: z.object({
        protein: z.number(),
        carbs: z.number(),
        fat: z.number()
      })
    })),
    totalCalories: z.number(),
    notes: z.string().optional()
  })),
  recommendations: z.array(z.string()),
  citations: z.array(z.object({
    source: z.string(),
    relevance: z.number(),
    text: z.string()
  })).optional()
})

export const PredictiveAnalysisSchema = z.object({
  predictions: z.array(z.object({
    metric: z.string(),
    currentValue: z.number(),
    predictedValue: z.number(),
    timeframe: z.string(),
    confidence: z.number(),
    factors: z.array(z.string())
  })),
  riskFactors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['low', 'moderate', 'high']),
    modifiable: z.boolean(),
    interventions: z.array(z.string())
  })),
  recommendations: z.array(z.object({
    category: z.string(),
    action: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    timeframe: z.string(),
    expectedOutcome: z.string()
  })),
  visualizations: z.array(z.object({
    type: z.enum(['line', 'scatter', 'bar', 'radar', 'heatmap']),
    title: z.string(),
    data: z.array(z.object({
      label: z.string(),
      value: z.number(),
      date: z.string().optional()
    }))
  }))
})

// Tool function schemas
export const LogSymptomTool = z.object({
  name: z.literal('log_symptom'),
  description: z.literal('Log a new symptom with severity and context'),
  parameters: z.object({
    symptom: z.string(),
    severity: z.enum(['mild', 'moderate', 'severe']),
    duration: z.string(),
    notes: z.string().optional(),
    triggers: z.array(z.string()).optional()
  })
})

export const CreateGoalTool = z.object({
  name: z.literal('create_goal'),
  description: z.literal('Create a new health goal with tracking metrics'),
  parameters: z.object({
    title: z.string(),
    category: z.enum(['fitness', 'nutrition', 'mental_health', 'sleep', 'medical']),
    target: z.string(),
    deadline: z.string(),
    metrics: z.array(z.string()),
    priority: z.enum(['low', 'medium', 'high'])
  })
})

export const ScheduleFollowUpTool = z.object({
  name: z.literal('schedule_followup'),
  description: z.literal('Schedule a follow-up appointment or reminder'),
  parameters: z.object({
    type: z.enum(['appointment', 'test', 'medication_review', 'check_in']),
    provider: z.string().optional(),
    date: z.string(),
    reason: z.string(),
    preparation: z.array(z.string()).optional()
  })
})

export const SummarizeDocumentTool = z.object({
  name: z.literal('summarize_document'),
  description: z.literal('Generate a structured summary of a medical document'),
  parameters: z.object({
    documentId: z.string(),
    focusAreas: z.array(z.string()).optional(),
    includeRecommendations: z.boolean().default(true)
  })
})

// Combined tool schema for OpenAI
export const ToolsSchema = [
  {
    type: 'function',
    function: {
      name: 'log_symptom',
      description: 'Log a new symptom with severity and context',
      parameters: {
        type: 'object',
        properties: {
          symptom: { type: 'string', description: 'Name of the symptom' },
          severity: { type: 'string', enum: ['mild', 'moderate', 'severe'] },
          duration: { type: 'string', description: 'How long the symptom has been present' },
          notes: { type: 'string', description: 'Additional notes about the symptom' },
          triggers: { type: 'array', items: { type: 'string' }, description: 'Potential triggers for the symptom' }
        },
        required: ['symptom', 'severity', 'duration']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_goal',
      description: 'Create a new health goal with tracking metrics',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the goal' },
          category: { type: 'string', enum: ['fitness', 'nutrition', 'mental_health', 'sleep', 'medical'] },
          target: { type: 'string', description: 'Specific target or objective' },
          deadline: { type: 'string', description: 'Target completion date' },
          metrics: { type: 'array', items: { type: 'string' }, description: 'Metrics to track progress' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] }
        },
        required: ['title', 'category', 'target', 'deadline']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'schedule_followup',
      description: 'Schedule a follow-up appointment or reminder',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['appointment', 'test', 'medication_review', 'check_in'] },
          provider: { type: 'string', description: 'Healthcare provider name' },
          date: { type: 'string', description: 'Scheduled date and time' },
          reason: { type: 'string', description: 'Reason for the follow-up' },
          preparation: { type: 'array', items: { type: 'string' }, description: 'Preparation steps needed' }
        },
        required: ['type', 'date', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'summarize_document',
      description: 'Generate a structured summary of a medical document',
      parameters: {
        type: 'object',
        properties: {
          documentId: { type: 'string', description: 'ID of the document to summarize' },
          focusAreas: { type: 'array', items: { type: 'string' }, description: 'Specific areas to focus on' },
          includeRecommendations: { type: 'boolean', description: 'Whether to include recommendations' }
        },
        required: ['documentId']
      }
    }
  }
]
