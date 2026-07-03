/**
 * Valida o parâmetro de redirect para prevenir Open Redirect (HIGH-001)
 * Apenas permite caminhos relativos (sem protocolo://)
 */
export function validateRedirect(redirect: string | null): string | null {
  if (!redirect) return null
  // Permitir apenas caminhos relativos que começam com /
  // Rejeitar qualquer coisa com :// (protocolo externo)
  if (redirect.startsWith('/') && !redirect.includes('://')) return redirect
  return null
}
