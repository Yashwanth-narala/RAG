import { prisma } from "../src/lib/prisma"
import { chunkText } from "../src/lib/chunkText"
import { generateEmbedding } from "../src/lib/generateEmbedding"

async function main() {

  const pages = await prisma.page.findMany({
    include: {
      chapter: {
        include: {
          subject: {
            include: {
              class: true
            }
          }
        }
      }
    }
  })

  console.log(`Processing ${pages.length} pages`)

  for (const page of pages) {

    const chunks = chunkText(page.content_text)

    for (const chunk of chunks) {

      const embedding = await generateEmbedding(chunk)

      const vector = `[${embedding.join(",")}]`

      await prisma.$executeRaw`
        INSERT INTO "PageChunk"
        (page_id, chapter_id, subject_id, class_id, chunk_text, embedding)
        VALUES (
          ${page.id},
          ${page.chapter_id},
          ${page.chapter.subject_id},
          ${page.chapter.subject.class_id},
          ${chunk},
          ${vector}::vector
        )
      `
    }

  }

  console.log("Chunk ingestion completed")
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })