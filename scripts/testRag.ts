import { generateAnswer } from "../src/lib/ragAnswer"

async function main() {

  const result = await generateAnswer(
    " Explain fundamental concepts",
    1,
    1,
    1
  )

  console.log(JSON.stringify(result, null, 2))

}

main()