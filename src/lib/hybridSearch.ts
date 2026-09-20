import { searchChunks } from "./vectorSearch"
import { bm25Search } from "./bm25Search"

export async function hybridSearch(
  query: string,
  classId: number,
  subjectId: number,
  chapterId: number
) {

  const [vectorResults, bm25Results] = await Promise.all([
    searchChunks(query, classId, subjectId, chapterId),
    bm25Search(query, classId, subjectId, chapterId)
  ])

  const combined = new Map()

  // VECTOR
  for (const doc of vectorResults) {
    const key = doc.page_id + "-" + doc.chunk_text

    combined.set(key, {
      ...doc,
      score: 0.7 * (1 - doc.distance) // distance → similarity
    })
  }

  // BM25
  for (const doc of bm25Results as any[]) {
    const key = doc.page_id + "-" + doc.chunk_text

    if (!combined.has(key)) {
      combined.set(key, {
        ...doc,
        score: 0
      })
    }

    combined.get(key).score += 0.3 * doc.score
  }

  const finalResults = Array.from(combined.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  console.log("HYBRID RESULTS:", finalResults.length)

  return finalResults
}