import { prisma } from "../src/lib/prisma"
import "dotenv/config"
async function main() {

  const classes = ["Class 8", "Class 9", "Class 10"]

  const subjects = [
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology"
  ]

  const chapters = [
    "Introduction",
    "Fundamentals",
    "Core Concepts",
    "Applications",
    "Examples",
    "Practice",
    "Advanced Concepts",
    "Problem Solving",
    "Summary",
    "Assessment"
  ]

  const baseParagraph = `
  Learning a concept requires understanding its definition,
  underlying principles, and applications. In this section we
  explore the key ideas behind this topic in detail. Concepts
  are explained with simple language so that learners can build
  a strong conceptual foundation.

  Examples are included to demonstrate how theoretical ideas are
  applied in real situations. When students analyze examples they
  understand patterns and relationships between ideas. This
  improves their analytical thinking.

  Practice exercises reinforce understanding. By solving
  problems students gain confidence and develop problem solving
  ability. This approach helps learners move from basic
  understanding to deeper mastery of the topic.

  Real-world applications highlight why the concept is important.
  Many scientific and mathematical ideas are used in engineering,
  technology, and everyday life. Connecting theory with
  applications makes learning more meaningful.

  These explanations aim to provide clarity, encourage curiosity,
  and prepare students for advanced topics. Strong foundations
  help learners succeed in examinations as well as practical
  problem solving.
  `

  // repeat paragraph to reach ~600 words
  const pageContent = baseParagraph.repeat(4)

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

        // each chapter has 5 pages
        for (let i = 1; i <= 5; i++) {

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

  console.log("Education dataset seeded successfully")

}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })