import OpenAI from "openai"
import { searchChunks } from "./vectorSearch"
import { rerankChunks } from "./rerankChunks"
import { addTokens, getTotalTokens, resetTokens } from "./tokenTracker"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateAnswer(
  question: string,
  classId: number,
  subjectId: number,
  chapterId: number
) {
    resetTokens()
  // Step 1: retrieve chunks
  const chunks = await searchChunks(
    question,
    classId,
    subjectId,
    chapterId
  )

  // Step 2: rerank chunks
  const bestChunks = await rerankChunks(question, chunks)

  // Step 3: build context
  const context = bestChunks
    .map((c: any) => c.chunk_text.slice(0, 700))
    .join("\n\n")
  
  console.time("answer_generation")
  // Step 4: generate answer
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens:150,
    messages: [
      {
        role: "system",
        content:
          "You are an educational tutor. Answer clearly using the provided context."
      },
      {
        role: "user",
        content: `
Context:
${context}

Question:
${question}
`
      }
    ]
  })
  console.timeEnd("answer_generation")
  console.log("Answer tokens:", response.usage)
  addTokens(response.usage?.total_tokens)

const total = getTotalTokens()

console.log("TOTAL TOKENS USED:", total)

const estimatedCost = total * 0.00000015

console.log("Estimated cost ($):", estimatedCost)

  return {
    answer: response.choices[0].message.content,
    references: bestChunks.map((c: any) => ({
      page_id: c.page_id,
      chapter_id: c.chapter_id
    })),
    tokens_used: total,
  cost_estimate: estimatedCost
  }
}