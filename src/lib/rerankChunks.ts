import OpenAI from "openai"
import { addTokens } from "./tokenTracker"
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function rerankChunks(question: string, chunks: any[]) {

  const formattedChunks = chunks
    .map((c, i) => `[${i}] ${c.chunk_text.slice(0, 500)}`)
    .join("\n\n")
   console.time("reranking")
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Select the most relevant chunks for answering the question."
      },
      {
        role: "user",
        content: `
Question:
${question}

Chunks:
${formattedChunks}

Return the 3 most relevant chunk numbers.
`
      }
    ]
  })
  console.timeEnd("reranking")
  console.log("Reranking tokens:", response.usage)

  addTokens(response.usage?.total_tokens)

  const indexes =
    response.choices[0].message.content
      ?.match(/\d+/g)
      ?.map(Number) || []

  const bestChunks = indexes.map(i => chunks[i]).slice(0,3)

  return bestChunks
}