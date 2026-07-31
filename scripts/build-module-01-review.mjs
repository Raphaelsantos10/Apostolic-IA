import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const moduleDirectory = resolve(
  repositoryRoot,
  "docs/courses/fundamentos-da-fe/module-01"
);
const outputPath = resolve(
  repositoryRoot,
  "apps/web/content-review/module-01.json"
);

function frontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";
}

function parseLesson(markdown, number) {
  const normalizedMarkdown = markdown.replace(/\r\n?/g, "\n");
  const match = normalizedMarkdown.match(
    /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  );
  if (!match) throw new Error(`Frontmatter ausente na Aula ${number}.`);

  const [, frontmatter, body] = match;
  if (!frontmatter.includes("publication_allowed: false")) {
    throw new Error(`Aula ${number} não está bloqueada para publicação.`);
  }

  const title = frontmatterValue(frontmatter, "title");
  const estimatedMinutes = Number(
    frontmatterValue(frontmatter, "estimated_minutes")
  );
  const centralQuestion =
    body
      .match(/## Pergunta central\s+([\s\S]*?)(?=\n## |\s*$)/)?.[1]
      ?.trim()
      .replace(/\s+/g, " ") ?? "";

  return {
    number,
    slug: `aula-${String(number).padStart(2, "0")}`,
    title,
    estimatedMinutes,
    summary: centralQuestion,
    body: body.trim()
  };
}

async function buildReviewModule() {
  const lessons = [];

  for (let number = 1; number <= 8; number += 1) {
    const suffix = String(number).padStart(2, "0");
    const [markdown, quizText] = await Promise.all([
      readFile(resolve(moduleDirectory, `lesson-${suffix}.md`), "utf8"),
      readFile(resolve(moduleDirectory, `quiz-${suffix}.json`), "utf8")
    ]);
    const lesson = parseLesson(markdown, number);
    const quiz = JSON.parse(quizText);

    if (quiz.status !== "draft" || !Array.isArray(quiz.questions)) {
      throw new Error(`Quiz da Aula ${number} não é um rascunho válido.`);
    }

    lessons.push({
      ...lesson,
      quiz: quiz.questions.map((question, index) => ({
        id: question.id ?? `aula-${suffix}-questao-${index + 1}`,
        prompt: question.prompt,
        options: question.options,
        correctIndex: question.correctIndex,
        explanation: question.explanation
      }))
    });
  }

  return {
    schema: "apostolic-ia.internal-module-review.v1",
    code: "TEO-ESC-001",
    title: "Escrituras: Autoridade, Inspiração e Leitura Responsável",
    estimatedHours: 18,
    status: "draft",
    publicationAllowed: false,
    coverPath: "/course-covers/modulo-01-fundamentos-da-fe.webp",
    lessons
  };
}

const rendered = `${JSON.stringify(await buildReviewModule(), null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== rendered) {
    console.error(
      "O pacote interno do Módulo 1 está desatualizado. Execute: node scripts/build-module-01-review.mjs"
    );
    process.exitCode = 1;
  } else {
    console.log("Pacote interno do Módulo 1 atualizado.");
  }
} else {
  await writeFile(outputPath, rendered, "utf8");
  console.log(`Pacote interno criado em ${outputPath}`);
}
