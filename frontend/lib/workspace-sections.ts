import type { AIEngineResponse } from '../types/core'
import type { AssetKey } from './asset-registry'

export type WorkspaceNavSection =
  | 'executive-briefing'
  | 'validation'
  | 'prd'
  | 'roadmap'
  | 'mvp-strategy'
  | 'export'

export type StreamSectionId = 'problem' | 'solution' | 'market-fit' | 'risks' | 'monetization'

export type StreamSection = {
  id: StreamSectionId
  title: string
  content: string
  visible: boolean
}

export function buildStreamSections(
  idea: string,
  response: AIEngineResponse | null,
  revealedCount: number
): StreamSection[] {
  const validation = response?.validation
  const prd = response?.prd
  const score = validation?.score ?? 0

  const sections: StreamSection[] = [
    {
      id: 'problem',
      title: 'Problem',
      content: idea
        ? `Founders and operators struggle with: "${idea.slice(0, 200)}${idea.length > 200 ? '…' : ''}". The pain is fragmented research, slow validation, and no single operating system for startup execution.`
        : 'Describe your startup idea to surface the core problem statement.',
      visible: revealedCount >= 1
    },
    {
      id: 'solution',
      title: 'Solution',
      content: prd?.features?.length
        ? `${response?.startupName || 'This solution'} solves this through:\n${prd.features.map(f => `• ${f}`).join('\n')}`
        : 'Solution architecture will appear as the PRD is synthesized.',
      visible: revealedCount >= 2
    },
    {
      id: 'market-fit',
      title: 'Market Fit',
      content: validation?.summary
        ? `Validation score: ${validation.score}%.\n\n${validation.summary}`
        : 'Market fit analysis streams after validation completes.',
      visible: revealedCount >= 3
    },
    {
      id: 'risks',
      title: 'Risks',
      content:
        score >= 80
          ? 'Primary risks: execution speed, differentiation vs. incumbents, and onboarding friction. Mitigate with a narrow ICP and fast iteration cycles.'
          : score >= 60
            ? 'Moderate viability — risks include unclear monetization timing, CAC sensitivity, and feature scope creep. Validate willingness-to-pay early.'
            : 'Higher-risk signal — validate demand with paid pilots before full build. Watch for regulatory, trust, and retention risks.',
      visible: revealedCount >= 4
    },
    {
      id: 'monetization',
      title: 'Monetization',
      content: prd?.userStories?.length
        ? `Revenue paths:\n• SaaS subscription tiers for teams\n• Usage-based AI credits\n• Premium voice + export bundles\n\nAligned to: ${prd.userStories[0]}`
        : 'Monetization models unlock with PRD and roadmap synthesis.',
      visible: revealedCount >= 5
    }
  ]

  return sections
}

export const WORKSPACE_NAV: { id: WorkspaceNavSection; label: string; icon: AssetKey }[] = [
  { id: 'executive-briefing', label: 'Executive Briefing', icon: 'ws-idea' },
  { id: 'validation', label: 'Validation Report', icon: 'ws-validation' },
  { id: 'prd', label: 'PRD', icon: 'ws-prd' },
  { id: 'roadmap', label: 'Roadmap', icon: 'ws-roadmap' },
  { id: 'mvp-strategy', label: 'MVP Strategy', icon: 'ws-market' },
  { id: 'export', label: 'Export', icon: 'ws-export' }
]
