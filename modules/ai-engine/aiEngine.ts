import { generatePRD, generateValidation, generateRoadmap } from '../../services/ai.service'

export async function runFullAnalysis(prompt: string){
  const validation = await generateValidation(prompt)
  const prd = await generatePRD(prompt)
  const roadmap = await generateRoadmap(prompt)
  return {validation, prd, roadmap}
}
