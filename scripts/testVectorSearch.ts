import { searchChunks } from "../src/lib/vectorSearch"

async function main() {

  const results = await searchChunks(
    "Explain fundamental concepts",
    1,
    1,
    1
  )

  console.log(results)

}

main()