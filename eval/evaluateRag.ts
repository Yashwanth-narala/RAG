import { searchChunks } from "../src/lib/vectorSearch";
import { hybridSearch } from "../src/lib/hybridSearch";
import { rerankChunks } from "../src/lib/rerankChunks";
import { generateAnswer } from "../src/lib/ragAnswer";

// ✅ USE REAL QUERIES FROM YOUR DB
const queries = [
  {
    question: "What are the three main components required to fully understand a concept",
    classId: 1,
    subjectId: 1,
    chapterId: 1,
    expected_keywords: ["main", "components"]
  },
  {
    question: "What role do examples play in learning a concept",
    classId: 1,
    subjectId: 1,
    chapterId: 1,
    expected_keywords: ["learn", "concept"]
  }
];

// ---------- METRICS ----------

function recallAtK(results: any[], keywords: string[]) {
  if (!results.length) return 0;

  return results.some(r =>
    keywords.some(k =>
      r.chunk_text.toLowerCase().includes(k)
    )
  ) ? 1 : 0;
}

function mrr(results: any[], keywords: string[]) {
  if (!results.length) return 0;

  for (let i = 0; i < results.length; i++) {
    if (keywords.some(k =>
      results[i].chunk_text.toLowerCase().includes(k)
    )) {
      return 1 / (i + 1);
    }
  }
  return 0;
}

// ---------- PIPELINES ----------

async function runVector(sample: any) {
  return await searchChunks(
    sample.question,
    sample.classId,
    sample.subjectId,
    sample.chapterId
  );
}

async function runHybrid(sample: any) {
  return await hybridSearch(
    sample.question,
    sample.classId,
    sample.subjectId,
    sample.chapterId
  );
}

async function runRerank(sample: any) {
  const results = await runHybrid(sample);

  if (!results.length) return [];

  const reranked = await rerankChunks(
    sample.question,
    results
  );

  return reranked;
}

// ---------- MAIN ----------

async function evaluate() {
  const results: any[] = [];

  for (const sample of queries) {
    console.log(`\n🔍 ${sample.question}`);

    const vector = await runVector(sample);
    const hybrid = await runHybrid(sample);
    const reranked = await runRerank(sample);

    console.log("Vector count:", vector.length);
    console.log("Hybrid count:", hybrid.length);
    console.log("Rerank count:", reranked.length);

    results.push({
      question: sample.question,

      vector_recall: recallAtK(vector, sample.expected_keywords),
      hybrid_recall: recallAtK(hybrid, sample.expected_keywords),
      rerank_recall: recallAtK(reranked, sample.expected_keywords),

      vector_mrr: mrr(vector, sample.expected_keywords),
      hybrid_mrr: mrr(hybrid, sample.expected_keywords),
      rerank_mrr: mrr(reranked, sample.expected_keywords),
    });

    // Full pipeline test
    const answer = await generateAnswer(
      sample.question,
      sample.classId,
      sample.subjectId,
      sample.chapterId
    );

    console.log("Answer:", answer.answer);
  }

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const summary = {
    vector: {
      recall: avg(results.map(r => r.vector_recall)),
      mrr: avg(results.map(r => r.vector_mrr)),
    },
    hybrid: {
      recall: avg(results.map(r => r.hybrid_recall)),
      mrr: avg(results.map(r => r.hybrid_mrr)),
    },
    rerank: {
      recall: avg(results.map(r => r.rerank_recall)),
      mrr: avg(results.map(r => r.rerank_mrr)),
    }
  };

  console.log("\n📊 FINAL RESULTS");
  console.table(summary);
}

// RUN
evaluate();