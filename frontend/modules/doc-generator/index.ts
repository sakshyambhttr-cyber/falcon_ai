import type { AIEngineResponse, DocumentPack } from '../../types/core'

function formatMonetization(response: AIEngineResponse): string {
  if (response.internalAnalysis?.monetization?.length) {
    return response.internalAnalysis.monetization.map(m => `\n  - ${m}`).join('')
  }
  return '\n  - Premium subscription tiers\n  - Usage-based credits'
}

function formatStrengths(response: AIEngineResponse): string {
  const list = response.validationReport?.strengths || response.internalAnalysis?.strengths || []
  if (list.length) {
    return list.map(s => `- 🔥 ${s}`).join('\n')
  }
  return '- 🔥 Strong early validation signal\n- 🔥 Clear workflow automation opportunity'
}

function formatWeaknesses(response: AIEngineResponse): string {
  const list = response.validationReport?.weaknesses || response.internalAnalysis?.weaknesses || []
  if (list.length) {
    return list.map(w => `- ⚠️ ${w}`).join('\n')
  }
  return '- ⚠️ Dependency on platform licensing fees\n- ⚠️ Scalability in high-volume traffic segments'
}

function formatRoadmapTasks(tasks: string[] | undefined): string {
  if (tasks?.length) {
    return tasks.map(t => `- [ ] ${t}`).join('\n')
  }
  return '- [ ] Complete MVP interface mockup\n- [ ] Integrate initial payment links'
}

export function buildDocumentPack(response: AIEngineResponse): DocumentPack {
  const startupName = response.startupName || 'Startup opportunity'

  const executiveBriefing = [
    `# Executive Founder Briefing`,
    ``,
    `## Identity: Founder Falcon AI Advisor`,
    ``,
    `### Partner Message`,
    `> **From your AI Co-Founder:**`,
    `> ${response.executiveBriefing}`,
    ``,
    `---`,
    ``,
    `### Strategic Overview`,
    `* **Core Startup Concept:** ${response.internalAnalysis?.concept || 'AI-native automation'}`,
    `* **Target Audience:** ${response.internalAnalysis?.targetAudience || 'Early stage founders'}`,
    `* **Business Model:** ${response.internalAnalysis?.businessModel || 'Freemium SaaS subscription model'}`,
    `* **Market Opportunity:** ${response.internalAnalysis?.marketOpportunity || 'High-growth builder sector'}`,
    `* **Monetization Paths:**${formatMonetization(response)}`,
    ``,
    `### Immediate Next Steps`,
    `1. Review the **Validation Report** tab to analyze strengths and weaknesses.`,
    `2. Explore the **PRD** and **MVP Strategy** tabs to align on system boundaries.`,
    `3. Review the **Roadmap** milestones to launch inside 12 weeks.`
  ].join('\n')

  const startupValidationReport = [
    `# Startup Validation Report`,
    ``,
    `## 1. Market Potential & Viability`,
    `${response.validationReport?.marketPotential || 'High growth potential segment with clear developer demand.'}`,
    ``,
    `### Opportunity Rating`,
    `* **Overall Opportunity Score:** \`${response.validationReport?.opportunityScore || 85}%\` (High Potential Opportunity)`,
    `* **Risk Assessment:** ${response.validationReport?.riskAssessment || 'Manageable operational and CAC sensitivity risks.'}`,
    ``,
    `---`,
    ``,
    `## 2. Competitive & Risk Profile`,
    `* **Competitor Space:** ${response.internalAnalysis?.competitors?.join(', ') || 'Incumbents and generic generative wrappers'}`,
    `* **Technical Complexity:** ${response.internalAnalysis?.technicalComplexity || 'Moderate Next.js and LLM integration complexity'}`,
    ``,
    `### Core Strengths (Opportunities)`,
    formatStrengths(response),
    ``,
    `### Core Weaknesses (Risks)`,
    formatWeaknesses(response)
  ].join('\n')

  const prdDocument = [
    `# Product Requirements Document (PRD)`,
    ``,
    `## 1. Product Overview`,
    `${response.prd?.overview || 'Modular workspace and intelligence system designed for rapid startup synthesis.'}`,
    ``,
    `---`,
    ``,
    `## 2. Core Features & Scope`,
    `* **Scoping Boundary:** ${response.internalAnalysis?.productScope || 'MVP visual documents, speech playbacks'}`,
    `* **Growth Potential:** ${response.internalAnalysis?.growthPotential || 'Viral growth via exported design documents'}`,
    ``,
    `### System Features`,
    `${response.prd?.features?.map(f => `- ✨ ${f}`).join('\n') || '- ✨ Ingestion layer\n- ✨ Visualizer tabs'}`,
    ``,
    `---`,
    ``,
    `## 3. User Stories`,
    `${response.prd?.userStories?.map(story => `- 👥 ${story}`).join('\n') || '- 👥 As a founder, I want instant documents'}`,
    ``,
    `---`,
    ``,
    `## 4. Technical & Non-Functional Requirements`,
    `${response.prd?.requirements?.map(req => `- ⚙️ ${req}`).join('\n') || '- ⚙️ Response latencies under 6 seconds'}`
  ].join('\n')

  const roadmapDocument = [
    `# Startup Execution Roadmap`,
    ``,
    `## Phase 1: ${response.roadmap?.phase1?.name || 'Discovery & Core Validation'}`,
    formatRoadmapTasks(response.roadmap?.phase1?.tasks),
    ``,
    `---`,
    ``,
    `## Phase 2: ${response.roadmap?.phase2?.name || 'MVP Development'}`,
    formatRoadmapTasks(response.roadmap?.phase2?.tasks),
    ``,
    `---`,
    ``,
    `## Phase 3: ${response.roadmap?.phase3?.name || 'Beta Launch & Feedback'}`,
    formatRoadmapTasks(response.roadmap?.phase3?.tasks),
    ``,
    `---`,
    ``,
    `## High-Level Execution Milestones`,
    `${response.roadmap?.milestones?.map(m => `- 📌 ${m}`).join('\n') || '- 📌 Milestone 1: Core setup complete'}`
  ].join('\n')

  const mvpStrategy = [
    `# MVP Strategy & Launch Plan`,
    ``,
    `## 1. Launch & Distribution Strategy`,
    `${response.mvpStrategy?.launchStrategy || 'Single-purpose web workbench driving organic traffic from social networks.'}`,
    ``,
    `---`,
    ``,
    `## 2. Minimum Viable Features`,
    `*Defines what goes into the launch bundle, ensuring prompt delivery and fast customer validation.*`,
    `${response.mvpStrategy?.minimumFeatures?.map(f => `- 🎯 ${f}`).join('\n') || '- 🎯 Basic intake inputs\n- 🎯 Spoken co-founder briefing'}`,
    ``,
    `---`,
    ``,
    `## 3. First-User Acquisition Playbook`,
    `${response.mvpStrategy?.firstUsers || 'Direct outreach to startup incubators, student hackathons, and product forums.'}`,
    ``,
    `---`,
    ``,
    `## 4. MVP Recommendations Summary`,
    `> ${response.internalAnalysis?.mvpRecommendations || 'Keep initial features focused on immediate visual insights.'}`
  ].join('\n')

  return {
    executiveBriefing,
    startupValidationReport,
    prdDocument,
    roadmapDocument,
    mvpStrategy
  }
}

export function documentPackToMarkdown(pack: DocumentPack): string {
  return [
    pack.executiveBriefing,
    '---',
    pack.startupValidationReport,
    '---',
    pack.prdDocument,
    '---',
    pack.roadmapDocument,
    '---',
    pack.mvpStrategy
  ].join('\n\n')
}

export default { buildDocumentPack, documentPackToMarkdown }
