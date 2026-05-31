export type FeatureId = 'scopes' | 'prd' | 'tech-spec' | 'roadmap'

const FEATURE_META: Record<
  FeatureId,
  { title: string; prompt: string; fallback: string }
> = {
  scopes: {
    title: 'Instant AI Scopes',
    prompt: `You are Murf Falcon, an AI startup operating system. A user clicked "Instant AI Scopes" on the marketing site. In 3-4 concise paragraphs, explain: what instant AI scopes are, how they challenge assumptions, analyze target audiences, and produce market validation scores. Mention a concrete example startup idea. Be professional, actionable, and under 280 words. Plain text only, no markdown.`,
    fallback:
      'Instant AI Scopes turn a raw startup idea into structured market intelligence in minutes. Murf Falcon challenges your assumptions, maps global target audiences, estimates TAM, and returns a validation score with clear reasoning.\n\nExample: for an AI scholarship finder, scopes would surface competition (Bold.org, Going Merry), ICP (international grad students), and a viability score based on demand signals and differentiation.\n\nOpen the workspace, describe your idea in one sentence, and scopes stream live as the first intelligence layer.'
  },
  prd: {
    title: 'Detailed PRDs',
    prompt: `You are Murf Falcon. A user clicked "Detailed PRDs". Explain in 3-4 paragraphs how Murf Falcon generates production-grade PRDs: problem statement, solution, success metrics, user stories, and feature lists. Include a brief example. Under 280 words. Plain text only.`,
    fallback:
      'Murf Falcon PRDs are generated from your spoken or typed idea — not blank templates. Each document includes a sharp problem statement, proposed solution, measurable success metrics, prioritized features, and user stories ready for engineering.\n\nThe PRD streams section-by-section so you can refine direction before export. Example output for a fintech MVP would include KYC flows, core ledger features, and compliance checkpoints.\n\nEnter the workspace with any idea to receive a full PRD package aligned to your validation report.'
  },
  'tech-spec': {
    title: 'Technical Spec Documents',
    prompt: `You are Murf Falcon. A user clicked "Technical Spec Documents". Explain in 3-4 paragraphs how the platform produces architectural blueprints, database schemas, system modules, and tech stack recommendations. Under 280 words. Plain text only.`,
    fallback:
      'Technical Spec Documents translate your validated concept into build-ready architecture. Murf Falcon outlines system modules, API boundaries, database schemas, infra choices, and a recommended tech stack matched to team size and timeline.\n\nOutputs include diagrams in prose form, entity relationships, and phased implementation notes — ideal for handing to a CTO or agency.\n\nAfter scopes and PRD, tech specs close the gap between strategy and execution in the same workspace session.'
  },
  roadmap: {
    title: 'Iterative Roadmaps',
    prompt: `You are Murf Falcon. A user clicked "Iterative Roadmaps". Explain in 3-4 paragraphs how milestone-based roadmaps are generated across discovery, MVP, and launch phases with interactive task checks. Under 280 words. Plain text only.`,
    fallback:
      'Iterative Roadmaps break your startup journey into phased milestones with actionable tasks. Murf Falcon maps discovery, MVP build, and launch sequences — each task checkable as you progress.\n\nRoadmaps adapt to your idea domain: a marketplace gets supply/demand tasks; a SaaS tool gets onboarding and retention milestones.\n\nStart in the workspace, submit any idea, and watch roadmap steps stream alongside validation and PRD — then track execution without switching tools.'
  }
}

const PLACEHOLDER_GEMINI_PREFIXES = ['AQ.Ab8RN6K4xxx', 'your-gemini-key', 'changeme']

function isPlaceholderApiKey(key: string | undefined): boolean {
  if (!key || key.length < 8) return true
  const normalized = key.trim().toLowerCase()
  return PLACEHOLDER_GEMINI_PREFIXES.some(prefix => normalized.startsWith(prefix.toLowerCase()))
}

async function callGeminiInsight(prompt: string, apiKey: string): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
  const apiResponse = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  })

  if (!apiResponse.ok) {
    throw new Error(`Gemini API failed with status ${apiResponse.status}`)
  }

  const data = await apiResponse.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text?.trim()) throw new Error('Empty Gemini response')
  return text.trim()
}

export function isValidFeatureId(value: string): value is FeatureId {
  return value in FEATURE_META
}

export async function getFeatureInsight(featureId: FeatureId): Promise<{ title: string; answer: string }> {
  const meta = FEATURE_META[featureId]
  const apiKey = process.env.GEMINI_API_KEY

  if (!isPlaceholderApiKey(apiKey)) {
    try {
      const answer = await callGeminiInsight(meta.prompt, apiKey!)
      return { title: meta.title, answer }
    } catch (error) {
      console.error('Feature insight Gemini failed, using fallback:', error)
    }
  }

  return { title: meta.title, answer: meta.fallback }
}
