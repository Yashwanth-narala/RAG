import { prisma } from "./prisma"
import { Prisma } from "@prisma/client"

export async function bm25Search(
  query: string,
  classId: number,
  subjectId: number,
  chapterId: number
) {

  console.time("bm25_search")

  const results = await prisma.$queryRaw(
    Prisma.sql`
      SELECT
        page_id,
        chapter_id,
        subject_id,
        class_id,
        chunk_text,
        ts_rank_cd(textsearch, plainto_tsquery(${query})) AS score
      FROM "PageChunk"
      WHERE class_id = ${classId}
        AND subject_id = ${subjectId}
        AND chapter_id = ${chapterId}
        AND textsearch @@ plainto_tsquery(${query})
      ORDER BY score DESC
      LIMIT 20
    `
  )

  console.timeEnd("bm25_search")

  return results
}