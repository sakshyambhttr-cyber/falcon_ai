import { NextResponse } from 'next/server'
import { generateAIEngineResponse, sanitizeStartupIdea } from '../../../../../modules/ai-engine'

export async function POST(request: Request){
  try{
    const body = await request.json().catch(() => ({}))
    const idea = sanitizeStartupIdea(String(body?.idea || ''))
    const result = await generateAIEngineResponse(idea)
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store'
      }
    })
  }catch(error){
    const message = error instanceof Error ? error.message : 'Unable to process idea'
    return NextResponse.json(
      {
        validation: {
          summary: message,
          score: 0,
          risks: ['Input sanitization failed'],
          opportunities: []
        },
        prds: [],
        roadmap: []
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    )
  }
}
