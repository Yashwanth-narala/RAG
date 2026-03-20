import OpenAI from "openai"
import { addTokens } from "./tokenTracker"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function rerankChunks(question: string, chunks: any[]) {

  const formattedChunks = chunks
    .map((c, i) => `[${i}] ${c.chunk_text.slice(0, 350)}`)
    .join("\n\n")

  console.time("reranking")

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `
You are a retrieval ranking system.

Your job is to select the chunks that best help answer the user's question.

Rules:
- Select the most relevant chunks.
- Ignore loosely related chunks.
- Return exactly 3 chunk indexes.

Return ONLY JSON in this format:

{"indexes":[0,2,4]}
`
      },
      {
        role: "user",
        content: `
Question:
${question}

Chunks:
${formattedChunks}
`
      }
    ]
  })

  console.timeEnd("reranking")

  console.log("Reranking tokens:", response.usage)

  addTokens(response.usage?.total_tokens)

  let indexes: number[] = []

  try {
    const parsed = JSON.parse(response.choices[0].message.content || "{}")
    indexes = parsed.indexes || []
  } catch {
    console.warn("Rerank JSON parsing failed")
  }

  // Ensure valid indexes
  const bestChunks = indexes
    .filter(i => i >= 0 && i < chunks.length)
    .slice(0, 3)
    .map(i => chunks[i])

  return bestChunks
}