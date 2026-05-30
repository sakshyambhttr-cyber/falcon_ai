import type { PipelineMode } from '../../types/events'

export type CompiledPrompt = {
  system: string
  phases: string[]
  mode: PipelineMode
}

export function compilePrompt(idea: string, mode: PipelineMode = 'full'): CompiledPrompt {
  const modeDirective =
    mode === 'validate_only'
      ? 'Execute validation-focused phases only. Skip full PRD and roadmap depth.'
      : mode === 'fast'
        ? 'Execute all phases with concise outputs suitable for rapid iteration.'
        : 'Execute full-depth startup intelligence across all phases.'

  return {
    mode,
    system: `You are Founder Falcon Intelligence OS. ${modeDirective} Never output conversational prose — only structured intelligence artifacts.`,
    phases: [
      `IDEA: "${idea}"`,
      'Phase 1 — Decompose idea into category, difficulty, keywords, executive summary.',
      'Phase 2 — Estimate market size, growth rate, competition level.',
      'Phase 3 — Produce viability score, risks, opportunities.',
      'Phase 4 — Stream PRD sections: problem_statement, solution, features, users, scope.',
      'Phase 5 — Emit roadmap steps as phased execution plans.',
      'Phase 6 — Final summary: startup name, one-line pitch, fundability score.'
    ]
  }
}

export default { compilePrompt }
