import type { AIEngineResponse, DocumentPack } from '../../types/core'

function titleCase(input: string): string{
  return input.split(/\s+/).filter(Boolean).map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
}

function firstPrdTitle(response: AIEngineResponse): string{
  return response.prds[0]?.title?.trim() || 'Startup Product'
}

function validationSummary(response: AIEngineResponse): string{
  const validation = response.validation
  return [`- **Score:** ${validation.score}`, `- **Summary:** ${validation.summary}`, `- **Risks:** ${validation.risks.join('; ')}`, `- **Opportunities:** ${validation.opportunities.join('; ')}`].join('\n')
}

function prdSections(response: AIEngineResponse): string{
  const prd = response.prds[0]
  if(!prd) return '## Scope\n\nNo PRD sections available.'
  return prd.sections.map(section => `## ${section.heading}\n\n${section.body}`).join('\n\n')
}

function roadmapSections(response: AIEngineResponse): string{
  return response.roadmap.map(phase => [`## ${phase.phase}`, ...phase.items.map(item => `- ${item}`)].join('\n')).join('\n\n')
}

function technicalDesignDocument(response: AIEngineResponse): string{
  const title = titleCase(firstPrdTitle(response))
  return [`# Technical Design Document`, '', `## System Overview`, `Founder Falcon is a modular AI operating system for startup validation, document generation, and voice-driven interaction.`, '', `## Architecture`, `- AI analysis module`, `- Document engine`, `- Voice workflow`, `- Memory store`, '', `## Primary Product`, title, '', `## Implementation Notes`, `- Deterministic markdown outputs only`, `- Structured outputs are converted before display`, `- UI consumes ready-to-render documents`].join('\n')
}

function pitchDeckContent(response: AIEngineResponse): string{
  const title = titleCase(firstPrdTitle(response))
  return [`# Pitch Deck Content`, '', `## Problem`, `Founders need a faster way to validate and structure startup ideas.`, '', `## Solution`, `Founder Falcon converts a startup idea into validation, PRD, roadmap, and pitch content.`, '', `## Market`, `Early-stage founders, student builders, and startup operators.`, '', `## Product`, title, '', `## Differentiation`, `Voice-first, markdown-native, modular AI startup operating system.`, '', `## Call To Action`, `Move from concept to execution in one workspace.`].join('\n')
}

export function buildDocumentPack(response: AIEngineResponse): DocumentPack{
  return {
    startupValidationReport: [`# Startup Validation Report`, '', validationSummary(response)].join('\n'),
    prdDocument: [`# PRD Document`, '', `## Product Title`, firstPrdTitle(response), '', prdSections(response)].join('\n'),
    technicalDesignDocument: technicalDesignDocument(response),
    roadmapDocument: [`# Roadmap`, '', roadmapSections(response)].join('\n'),
    pitchDeckContent: pitchDeckContent(response)
  }
}

export function documentPackToMarkdown(pack: DocumentPack): string{
  return [pack.startupValidationReport, '', pack.prdDocument, '', pack.technicalDesignDocument, '', pack.roadmapDocument, '', pack.pitchDeckContent].join('\n')
}

export default { buildDocumentPack, documentPackToMarkdown }
