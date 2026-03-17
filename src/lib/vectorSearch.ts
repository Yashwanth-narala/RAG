import { prisma } from "./prisma"
import { generateEmbedding } from "./generateEmbedding"

type ChunkResult = {
  page_id: number
  chapter_id: number
  subject_id: number
  class_id: number
  chunk_text: string
  distance: number
}

export async function searchChunks(
  query: string,
  classId: number,
  subjectId: number,
  chapterId: number
) {
  
   console.time("embedding_generation")
  const embedding = await generateEmbedding(query)
    console.timeEnd("embedding_generation")
  const vector = `[${embedding.join(",")}]`
   console.time("vector_search")
  const results = await prisma.$queryRaw<ChunkResult[]>`
    SELECT
      page_id,
      chapter_id,
      subject_id,
      class_id,
      chunk_text,
      embedding <=> ${vector}::vector AS distance
    FROM "PageChunk"
    WHERE class_id = ${classId}
      AND subject_id = ${subjectId}
      AND chapter_id = ${chapterId}
     AND embedding <=> ${vector}::vector < 0.5
    ORDER BY embedding <=> ${vector}::vector
    LIMIT 5
  `
   console.timeEnd("vector_search")
  return results
}
