import { redis } from "./redisClient"
import { prisma } from "./prisma"
import OpenAI from "openai"
import { Prisma } from "@prisma/client"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

//////////////////////////////////////////////////
// EMBEDDING
//////////////////////////////////////////////////

async function embed(text: string) {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  })
  return res.data[0].embedding
}

//////////////////////////////////////////////////
// NORMALIZE
//////////////////////////////////////////////////

function normalize(q: string) {
  return q.trim().toLowerCase()
}

//////////////////////////////////////////////////
// GET CACHE
//////////////////////////////////////////////////

export async function getCachedAnswer(question: string) {

  const normalized = normalize(question)

  ////////////////////////////////////////////////
  // 1️⃣ REDIS CACHE
  ////////////////////////////////////////////////

  const redisCached = await redis.get(`rag:${normalized}`)

  if (redisCached) {
    console.log("REDIS CACHE HIT")

    const parsed = JSON.parse(redisCached)

    return {
      cache: {
        ...parsed,
        tokens_used: 0,
        cost_estimate: 0
      },
      embedding: null // 🔥 IMPORTANT
    }
  }

  ////////////////////////////////////////////////
  // 2️⃣ EMBEDDING (ONLY ONCE)
  ////////////////////////////////////////////////

  const embedding = await embed(question)
  const vector = `[${embedding.join(",")}]`

  ////////////////////////////////////////////////
  // 3️⃣ SEMANTIC CACHE (TOP 5)
  ////////////////////////////////////////////////

  const results: any[] = await prisma.$queryRaw(
    Prisma.sql`
      SELECT answer,
      embedding <=> ${vector}::vector AS distance
      FROM "SemanticCache"
      ORDER BY distance
      LIMIT 5
    `
  )

  if (!results.length) {
    return { cache: null, embedding }
  }

  ////////////////////////////////////////////////
  // 4️⃣ FIND BEST MATCH
  ////////////////////////////////////////////////

  const best = results.find(r => r.distance < 0.5)

  if (best) {
    console.log("SEMANTIC CACHE HIT")

    const parsed = JSON.parse(best.answer)

    const response = {
      ...parsed,
      tokens_used: 0,
      cost_estimate: 0
    }

    ////////////////////////////////////////////////
    // Warm Redis
    ////////////////////////////////////////////////

    await redis.set(
      `rag:${normalized}`,
      JSON.stringify(parsed),
      "EX",
      86400
    )

    return { cache: response, embedding }
  }

  return { cache: null, embedding }
}

//////////////////////////////////////////////////
// STORE CACHE
//////////////////////////////////////////////////

export async function storeCachedAnswer(
  question: string,
  answer: any,
  embedding?: number[]
) {

  const normalized = normalize(question)

  const cleanAnswer = {
    answer: answer.answer,
    references: answer.references
  }

  ////////////////////////////////////////////////
  // 1️⃣ STORE REDIS
  ////////////////////////////////////////////////

  await redis.set(
    `rag:${normalized}`,
    JSON.stringify(cleanAnswer),
    "EX",
    86400
  )

  ////////////////////////////////////////////////
  // 2️⃣ ENSURE EMBEDDING EXISTS
  ////////////////////////////////////////////////

  let finalEmbedding = embedding

  if (!finalEmbedding) {
    finalEmbedding = await embed(question)
  }

  const vector = `[${finalEmbedding.join(",")}]`

  ////////////////////////////////////////////////
  // 3️⃣ STORE IN PGVECTOR
  ////////////////////////////////////////////////

  await prisma.$executeRaw(
    Prisma.sql`
      INSERT INTO "SemanticCache"
      (question, answer, embedding)
      VALUES (
        ${question},
        ${JSON.stringify(cleanAnswer)},
        ${vector}::vector
      )
    `
  )
}