export async function textToSpeechStream(text: string){
  const response = await fetch('/api/murf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })

  return response
}
