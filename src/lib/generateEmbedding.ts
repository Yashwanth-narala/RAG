import OpenAI from "openai"
import { addTokens } from "./tokenTracker"
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateEmbedding(text: string) {

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  })
 
  console.log("Embedding tokens:", response.usage)

  addTokens(response.usage?.total_tokens)

  return response.data[0].embedding
}