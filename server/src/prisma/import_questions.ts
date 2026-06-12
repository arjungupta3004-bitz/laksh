import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const dataPath = '/Users/arjungupta/samples/questions.json';
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // Get all subjects
  const sciSubject = await prisma.subject.findFirst({ where: { code: 'SCI' } });
  const mathSubject = await prisma.subject.findFirst({ where: { code: 'MATH' } });

  if (!sciSubject || !mathSubject) {
    console.log('Subjects not found. Please run seed script first.');
    return;
  }

  // Get chapters
  const sciChapters = await prisma.chapter.findMany({ where: { subjectId: sciSubject.id } });
  const mathChapters = await prisma.chapter.findMany({ where: { subjectId: mathSubject.id } });

  const sciChapterMap = Object.fromEntries(sciChapters.map(c => [c.chapterNo, c.id]));
  const mathChapterMap = Object.fromEntries(mathChapters.map(c => [c.chapterNo, c.id]));

  let totalImported = 0;

  for (const [filename, questions] of Object.entries(data)) {
    if (!Array.isArray(questions) || questions.length === 0) continue;

    let chapterId = null;

    if (filename.startsWith('jeep1')) {
      const chNum = parseInt(filename.replace('jeep1', '').replace('.pdf', ''));
      chapterId = sciChapterMap[chNum];
    } else if (filename.startsWith('jeep2')) {
      const chNum = parseInt(filename.replace('jeep2', '').replace('.pdf', ''));
      chapterId = mathChapterMap[chNum];
    }

    if (!chapterId) {
      console.log(`No chapter mapping found for ${filename}, skipping.`);
      continue;
    }

    const qsData = questions.map((q: any) => ({
      chapterId,
      type: 'MCQ' as any,
      difficulty: 'MEDIUM' as any,
      text: q.text.substring(0, 500), // Ensure text doesn't blow up
      options: q.options,
      answer: q.options[0], // using option A as fallback, real answer needs human entry
      explanation: q.explanation
    }));

    const inserted = await prisma.question.createMany({
      data: qsData,
      skipDuplicates: true
    });

    console.log(`Imported ${inserted.count} questions from ${filename}`);
    totalImported += inserted.count;
  }

  console.log(`Total questions imported: ${totalImported}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
