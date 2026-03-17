let totalTokens = 0

export function addTokens(tokens: number | undefined) {
  if (!tokens) return
  totalTokens += tokens
}

export function getTotalTokens() {
  return totalTokens
}

export function resetTokens() {
  totalTokens = 0
}