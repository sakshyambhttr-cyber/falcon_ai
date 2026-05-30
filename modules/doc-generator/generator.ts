export function renderMarkdownPRD(prd: any){
  // Convert structured PRD to markdown
  const title = `# ${prd.title}\n\n`
  const sections = (prd.sections || []).map((s:any)=>`## ${s.heading}\n\n${s.body}\n`).join('\n')
  return title + sections
}
