import OpenAI from "openai"
import { searchChunks } from "./vectorSearch"
import { rerankChunks } from "./rerankChunks"
import { addTokens, getTotalTokens, resetTokens } from "./tokenTracker"
import { getCachedAnswer, storeCachedAnswer } from "./semanticCache"

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

  ////////////////////////////////////////////////
  // STEP 1 — CACHE
  ////////////////////////////////////////////////

  const { cache, embedding } = await getCachedAnswer(question)

  if (cache) {
    console.log("CACHE HIT")
    return cache
  }

  ////////////////////////////////////////////////
  // STEP 2 — RETRIEVE
  ////////////////////////////////////////////////

  const chunks = await searchChunks(
    question,
    classId,
    subjectId,
    chapterId
  )

  ////////////////////////////////////////////////
  // STEP 3 — RERANK
  ////////////////////////////////////////////////

  const bestChunks = await rerankChunks(question, chunks)

  const context = bestChunks
    .map((c: any) => c.chunk_text.slice(0, 400))
    .join("\n\n")

  ////////////////////////////////////////////////
  // STEP 4 — GENERATE ANSWER
  ////////////////////////////////////////////////

  console.time("answer_generation")

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 150,
    messages: [
      {
        role: "system",
        content: `
You are an educational tutor.

Use ONLY the provided context.

Rules:
- No repetition
- Clear structured answer
- If not found → say "Not found in context"
`
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

  ////////////////////////////////////////////////
  // STEP 5 — FINAL RESPONSE
  ////////////////////////////////////////////////

  const total = getTotalTokens()

  const result = {
    answer: response.choices[0].message.content,
    references: bestChunks.map((c: any) => ({
      page_id: c.page_id,
      chapter_id: c.chapter_id
    })),
    tokens_used: total,
    cost_estimate: total * 0.00000015
  }

  ////////////////////////////////////////////////
  // STEP 6 — STORE CACHE
  ////////////////////////////////////////////////

  await storeCachedAnswer(question, result, embedding ?? undefined)

  return result
}