export function formatWhatsApp(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  const trimmed = cleaned.slice(0, 11)
  if (trimmed.length === 0) return ''
  if (trimmed.length <= 2) return `(${trimmed}`
  if (trimmed.length <= 7) return `(${trimmed.slice(0, 2)}) ${trimmed.slice(2)}`
  return `(${trimmed.slice(0, 2)}) ${trimmed.slice(2, 3)} ${trimmed.slice(3, 7)}-${trimmed.slice(7)}`
}

export function cleanDigits(value: string): string {
  return value.replace(/\D/g, '')
}
