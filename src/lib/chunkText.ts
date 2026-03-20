export function chunkText(text: string, chunkSize = 150, overlap = 30) {

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

  const chunks: string[] = []

  let currentChunk: string[] = []
  let wordCount = 0

  for (const sentence of sentences) {

    const words = sentence.trim().split(/\s+/)
    wordCount += words.length
    currentChunk.push(sentence)

    if (wordCount >= chunkSize) {

      chunks.push(currentChunk.join(" ").trim())

      const overlapWords = currentChunk.join(" ")
        .split(/\s+/)
        .slice(-overlap)

      currentChunk = [overlapWords.join(" ")]
      wordCount = overlapWords.length
    }
  }

  if (currentChunk.length) {
    chunks.push(currentChunk.join(" ").trim())
  }

  return chunks
}