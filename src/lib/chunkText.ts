export function chunkText(text: string, chunkSize = 150, overlap = 30) {

  const words = text.split(/\s+/)

  const chunks: string[] = []

  let start = 0

  while (start < words.length) {

    const end = start + chunkSize

    const chunk = words.slice(start, end).join(" ")

    chunks.push(chunk)

    start += chunkSize - overlap
  }

  return chunks
}