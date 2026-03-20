import { prisma } from "../src/lib/prisma"
import "dotenv/config"

async function main() {

  const classes = ["Class 9", "Class 10"]

  const subjects = [
    "Mathematics",
    "Physics"
  ]

  const chapters = [
    "Introduction",
    "Core Concepts",
    "Applications"
  ]

  const baseParagraph = `
  Learning a concept requires understanding its definition,
  underlying principles, and applications. In this section we
  explore the key ideas behind this topic in detail. Concepts
  are explained with simple language so that learners can build
  a strong conceptual foundation.

  Examples are included to demonstrate how theoretical ideas are
  applied in real situations. Practice exercises reinforce
  understanding and improve analytical thinking.
  `

  const pageContent = baseParagraph.repeat(2)

  for (const className of classes) {

    const createdClass = await prisma.class.create({
      data: { name: className }
    })

    for (const subjectName of subjects) {

      const createdSubject = await prisma.subject.create({
        data: {
          name: subjectName,
          class_id: createdClass.id
        }
      })

      for (const chapterName of chapters) {

        const createdChapter = await prisma.chapter.create({
          data: {
            title: chapterName,
            subject_id: createdSubject.id
          }
        })

        // Only 2 pages per chapter
        for (let i = 1; i <= 2; i++) {

          await prisma.page.create({
            data: {
              chapter_id: createdChapter.id,
              page_order: i,
              content_text: pageContent
            }
          })

        }

      }

    }

  }

  console.log("Small education dataset seeded successfully")

}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })