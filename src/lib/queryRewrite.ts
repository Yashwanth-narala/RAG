import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function rewriteQuery(query: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 50,
    messages: [
      {
        role: "system",
        content: `
Rewrite the user query to improve document retrieval.

Rules:
- Identify missing context
- Expand vague queries
- Add possible subject if unclear
- Keep meaning same but improve clarity

If query is vague, assume it's about education concepts.

Examples:
"Explain this concept"
→ "Explain the concept mentioned in the provided study material"

"this topic"
→ "Explain the topic discussed in the given chapter"

Now rewrite:
`
      },
      {
        role: "user",
        content: query
      }
    ]
  })

  return response.choices[0].message.content?.trim() || query
}