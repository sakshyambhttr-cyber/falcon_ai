export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, boolean>
  | ClassValue[]

function flattenClassValue(value: ClassValue, out: string[]) {
  if (!value) return

  if (typeof value === 'string' || typeof value === 'number') {
    out.push(String(value))
    return
  }

  if (Array.isArray(value)) {
    for (const nested of value) {
      flattenClassValue(nested, out)
    }
    return
  }

  for (const key in value) {
    if (value[key]) out.push(key)
  }
}

export function cn(...inputs: ClassValue[]) {
  const out: string[] = []
  for (const input of inputs) {
    flattenClassValue(input, out)
  }
  return out.join(' ')
}
