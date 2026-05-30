import type { AIEngineResponse, AIPrdDocument, AIRoadmapItem, AIValidation } from '../../types/core'

const MAX_IDEA_LENGTH = 4000

function normalizeIdea(input: string): string{
  return input.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_IDEA_LENGTH)
}

function hashText(input: string): number{
  let hash = 0
  for(let index = 0; index < input.length; index += 1){
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }
  return hash
}

function extractKeywords(idea: string): string[]{
  const filtered = idea.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).map(word => word.trim()).filter(word => word.length > 3)
  return Array.from(new Set(filtered)).slice(0, 6)
}

function buildValidation(idea: string): AIValidation{
  const hash = hashText(idea)
  const keywords = extractKeywords(idea)
  const score = Number((0.55 + (hash % 30) / 100).toFixed(2))
  return {
    summary: `Validated startup concept for ${keywords[0] || 'your idea'} with a deterministic analysis pipeline.`,
    score,
    risks: ['Market differentiation must be proven', 'Initial user acquisition strategy is required'],
    opportunities: [`Core opportunity around ${keywords[0] || 'the target audience'}`, 'Strong potential for a focused MVP']
  }
}

function buildPrd(idea: string): AIPrdDocument{
  const keywords = extractKeywords(idea)
  const productName = keywords.slice(0, 3).map(word => word[0].toUpperCase() + word.slice(1)).join(' ') || 'Startup Product'
  return {
    title: productName,
    description: `PRD for ${idea}`,
    sections: [
      { heading: 'Problem', body: `Users need a focused solution for ${keywords.join(', ') || 'the startup idea'}.` },
      { heading: 'Solution', body: 'The product converts a startup idea into validation, PRD, and roadmap outputs.' },
      { heading: 'Audience', body: 'Founders, students, and builders looking for fast structured planning.' },
      { heading: 'Success Metrics', body: 'Completion rate, validation confidence, and time-to-PRD.' }
    ]
  }
}

function buildRoadmap(idea: string): AIRoadmapItem[]{
  const keywords = extractKeywords(idea)
  return [
    { phase: 'Phase 1', items: [`Define product scope for ${keywords[0] || 'the idea'}`, 'Create validation inputs', 'Confirm top user flows'] },
    { phase: 'Phase 2', items: ['Generate PRD artifacts', 'Map roadmap milestones', 'Prepare design-system screens'] },
    { phase: 'Phase 3', items: ['Integrate voice responses', 'Add memory history', 'Ship production hardening'] }
  ]
}

export function sanitizeStartupIdea(input: string): string{
  const idea = normalizeIdea(input)
  if(!idea) throw new Error('Startup idea is required')
  return idea
}

export async function generateAIEngineResponse(input: string): Promise<AIEngineResponse>{
  const idea = sanitizeStartupIdea(input)
  return { validation: buildValidation(idea), prds: [buildPrd(idea)], roadmap: buildRoadmap(idea) }
}

export async function analyzeIdea(input: string): Promise<AIEngineResponse>{
  return generateAIEngineResponse(input)
}

export default { analyzeIdea, generateAIEngineResponse, sanitizeStartupIdea }
