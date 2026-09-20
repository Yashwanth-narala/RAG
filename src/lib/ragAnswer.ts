import OpenAI from "openai"
import { hybridSearch } from "./hybridSearch"
import { rerankChunks } from "./rerankChunks"
import { addTokens, getTotalTokens, resetTokens } from "./tokenTracker"
import { getCachedAnswer, storeCachedAnswer } from "./semanticCache"
import { rewriteQuery } from "./queryRewrite"

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
  
console.time("query_rewrite") 
 // checking the length of the qsn before rewriting
const rewrittenQuery =
  question.length < 20
    ? await rewriteQuery(question)
    : question;
console.timeEnd("query_rewrite")
console.log("Original:", question)
console.log("Rewritten:", rewrittenQuery) 

  const chunks = await hybridSearch(
    rewrittenQuery,
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
    max_tokens: 100,
    messages: [
      {
        role: "system",
        content: `
You are an educational tutor.

Answer the question using the context below.
If the answer is partially available, provide the best possible answer.


Rules:
- If answer is clearly present → answer accurately
- If partially present → explain using available info
- If unclear → try to give a helpful explanation based on context
- ONLY say "Not found" if completely unrelated
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