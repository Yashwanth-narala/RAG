import axios from "axios"

export async function rerankChunks(question: string, chunks: any[]) {
  console.time("reranking")

  // Extract chunk text
  const texts = chunks.map(c => c.chunk_text.slice(0, 400))

  const res = await axios.post("http://localhost:8000/rerank", {
    query: question,
    chunks: texts
  })

  console.timeEnd("reranking")

  const reranked = res.data.results

  // Map back using index (SAFE)
  const sortedChunks = reranked.map((r: any) => chunks[r.index])
   //  DEBUG LOG HERE
  //console.log("Top chunks after BGE:", sortedChunks.slice(0, 3))

  // Return top 3
  return sortedChunks.slice(0, 3)
}