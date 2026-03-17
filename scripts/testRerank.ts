import { searchChunks } from "../src/lib/vectorSearch"
import { rerankChunks } from "../src/lib/rerankChunks"

async function main() {

  const chunks = await searchChunks(
    "Explain fundamental concepts",
    1,
    1,
    1
  )

  const bestChunks = await rerankChunks(
    "Explain fundamental concepts",
    chunks
  )

  console.log(bestChunks)

}

main()