export type AiTask =
  | 'symptom_analysis'
  | 'lab_interpretation'
  | 'visit_prep_summary'
  | 'dashboard_summary'
  | 'nutrition_plan'
  | 'general_assistant'

interface GenerateParams<T = any> {
  task: AiTask
  data: T
  chatId?: string
}

export async function generateFromAi<TIn, TOut = { result: string }>(params: GenerateParams<TIn>): Promise<TOut & { ok: boolean; task: AiTask }> {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`AI request failed: ${response.status} ${body}`)
  }
  return response.json()
}


