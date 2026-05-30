import type { AIEngineResponse, DocumentPack } from '../../types/core'

function titleCase(input: string): string{
  return input.split(/\s+/).filter(Boolean).map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
}

function firstPrdTitle(response: AIEngineResponse): string{
  return response.prd?.title?.trim() || 'Startup Product'
}

function validationSummary(response: AIEngineResponse): string{
  const validation = response.validation
  return [
    `### Executive Summary`,
    `> ${validation.summary}`,
    ``,
    `### Score Matrix`,
    `| Metric | Value | Rating |`,
    `| :--- | :--- | :--- |`,
    `| **Validation Score** | \`${validation.score}%\` | ${validation.score >= 80 ? '🔥 High Potential' : validation.score >= 60 ? '⚡ Moderate Viability' : '⚠️ High Risk'} |`
  ].join('\n')
}

function prdSections(response: AIEngineResponse): string{
  const prd = response.prd
  return [
    `### Core Features`,
    ...prd.features.map(f => `- ✨ ${f}`),
    ``,
    `### Target User Stories`,
    ...prd.userStories.map(story => `- 👥 ${story}`)
  ].join('\n')
}

function roadmapSections(response: AIEngineResponse): string{
  return response.roadmap.map(phase => [
    `### ${phase.phase}`,
    ...phase.tasks.map(task => `- [ ] ${task}`)
  ].join('\n')).join('\n\n')
}

function technicalDesignDocument(response: AIEngineResponse): string{
  const title = titleCase(firstPrdTitle(response))
  const featuresList = response.prd?.features?.map(f => `- **${f.split(':')[0]} Engine Module:** Core algorithm handling user scopes.`).join('\n') || ''
  return [
    `# Technical Design Document - ${title}`,
    '',
    `## 1. System Overview`,
    `Founder Falcon is a modular, voice-first AI operating system built to streamline startup ideation, validation, product specifications, and roadmap synthesis.`,
    '',
    `## 2. Component Architecture`,
    featuresList,
    '',
    `## 3. Core Tech Stack`,
    `| Technology | Role |`,
    `| :--- | :--- |`,
    `| **Next.js 14 / React 18** | Core Web Framework |`,
    `| **TypeScript 5** | Strict Type System Safety |`,
    `| **Google Gemini API** | Content Synthesis & Structured Output |`,
    `| **Murf.ai Speech API** | Realistic Conversational Voice Playback |`,
    `| **SpeechSynthesis API** | Resilient Browser-Native Playback Fallback |`
  ].join('\n')
}

function pitchDeckContent(response: AIEngineResponse): string{
  const title = titleCase(firstPrdTitle(response))
  const featuresBrief = response.prd?.features?.map(f => `- ${f}`).join('\n') || ''
  return [
    `# Pitch Deck Outline - ${title}`,
    '',
    `## Slide 1: The Vision`,
    `${title} - A revolutionary platform designed to solve critical pain points.`,
    '',
    `## Slide 2: Core Capabilities`,
    `Our MVP focuses on high-impact value metrics:`,
    featuresBrief,
    '',
    `## Slide 3: Target Market`,
    `Tech innovators, startup builders, early stage founders, and student operators looking to build fast.`,
    '',
    `## Slide 4: Growth Roadmap`,
    `A multi-phase launch execution plan spanning validation matching, generative features, and direct system portals.`
  ].join('\n')
}

export function buildDocumentPack(response: AIEngineResponse): DocumentPack{
  return {
    startupValidationReport: [`# Startup Validation Report - ${firstPrdTitle(response)}`, '', validationSummary(response)].join('\n'),
    prdDocument: [`# PRD Document - ${firstPrdTitle(response)}`, '', prdSections(response)].join('\n'),
    technicalDesignDocument: technicalDesignDocument(response),
    roadmapDocument: [`# Roadmap - ${firstPrdTitle(response)}`, '', roadmapSections(response)].join('\n'),
    pitchDeckContent: pitchDeckContent(response)
  }
}

export function documentPackToMarkdown(pack: DocumentPack): string{
  return [
    pack.startupValidationReport,
    '---',
    pack.prdDocument,
    '---',
    pack.technicalDesignDocument,
    '---',
    pack.roadmapDocument,
    '---',
    pack.pitchDeckContent
  ].join('\n\n')
}

export default { buildDocumentPack, documentPackToMarkdown }


