import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// To run this, you will need to provide your Gemini API key:
// GEMINI_API_KEY=your_key npx tsx src/prisma/solve_questions.ts
const API_KEY = process.env.GEMINI_API_KEY;

async function solveWithAI(questionText: string, options: string[]): Promise<{ answer: string, explanation: string }> {
  if (!API_KEY) throw new Error('No API key provided');
  
  const prompt = `
  You are an expert Math and Science teacher for CBSE Class 10.
  Solve the following multiple-choice question.
  
  Question: ${questionText}
  Options:
  ${options.map((o, i) => `${i+1}. ${o}`).join('\n')}
  
  Return ONLY a valid JSON object with two keys:
  "answer": "The exact string of the correct option from the list above",
  "explanation": "A short, step-by-step explanation of how you arrived at the answer"
  `;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text);
}

async function main() {
  if (!API_KEY) {
    console.error('❌ Please set GEMINI_API_KEY environment variable.');
    process.exit(1);
  }

  // Find all questions that still have the default fallback explanation
  const questions = await prisma.question.findMany({
    where: { explanation: 'Extracted from PDF' }
  });

  console.log(`Found ${questions.length} questions to solve...`);

  let solved = 0;
  for (const q of questions) {
    try {
      const opts = q.options as string[];
      const result = await solveWithAI(q.text, opts);
      
      await prisma.question.update({
        where: { id: q.id },
        data: {
          answer: result.answer,
          explanation: result.explanation
        }
      });
      
      solved++;
      console.log(`✅ Solved [${solved}/${questions.length}]: ${q.text.substring(0, 30)}...`);
      
      // Sleep for 1 second to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    } catch (err: any) {
      console.error(`❌ Failed on question ${q.id}: ${err.message}`);
    }
  }
  
  console.log('🎉 All done!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
