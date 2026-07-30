import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const moduleDirectory =
  process.argv[2] ?? "docs/courses/fundamentos-da-fe/module-01";

const lessonFiles = readdirSync(moduleDirectory)
  .filter((name) => /^lesson-\d+\.md$/.test(name))
  .sort();
const quizFiles = readdirSync(moduleDirectory)
  .filter((name) => /^quiz-\d+\.json$/.test(name))
  .sort();
const sourceFiles = readdirSync(moduleDirectory)
  .filter((name) => /^sources(?:-\d+)?\.md$/.test(name))
  .sort();

const issues = [];
const inspectedFiles = [...lessonFiles, ...quizFiles, ...sourceFiles];
const forbiddenReferences = [
  /scribd\.com/i,
  /slideshare\.net/i,
  /apostilasdeteologia/i
];

function normalize(value) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("pt")
    .replace(/\s+/g, " ")
    .trim();
}

function proseBlocks(markdown) {
  return markdown
    .replace(/^---[\s\S]*?---/u, "")
    .split(/\n\s*\n/u)
    .map((block) => block.trim())
    .filter(
      (block) =>
        block.length >= 240 &&
        !/^(#|>|- |\d+\. |\|)/u.test(block) &&
        !block.includes("Estado editorial")
    )
    .map(normalize);
}

const blockOwners = new Map();
for (const file of lessonFiles) {
  const content = readFileSync(join(moduleDirectory, file), "utf8");

  if (!content.includes("status: draft")) {
    issues.push(`${file}: estado draft ausente.`);
  }
  if (!content.includes("publication_allowed: false")) {
    issues.push(`${file}: bloqueio de publicação ausente.`);
  }

  for (const pattern of forbiddenReferences) {
    if (pattern.test(content)) {
      issues.push(`${file}: referência externa não aprovada encontrada.`);
    }
  }

  for (const block of proseBlocks(content)) {
    const previousOwner = blockOwners.get(block);
    if (previousOwner && previousOwner !== file) {
      issues.push(
        `${file}: bloco extenso duplicado exatamente de ${previousOwner}.`
      );
    } else {
      blockOwners.set(block, file);
    }
  }
}

const questionOwners = new Map();
for (const file of quizFiles) {
  const quiz = JSON.parse(readFileSync(join(moduleDirectory, file), "utf8"));

  if (quiz.status !== "draft") {
    issues.push(`${file}: estado draft ausente.`);
  }

  for (const [index, question] of (quiz.questions ?? []).entries()) {
    const prompt = normalize(question.prompt ?? "");
    if (!prompt) {
      issues.push(`${file}: questão ${index + 1} sem enunciado.`);
      continue;
    }

    const previousOwner = questionOwners.get(prompt);
    if (previousOwner) {
      issues.push(
        `${file}: questão ${index + 1} repete exatamente ${previousOwner}.`
      );
    } else {
      questionOwners.set(prompt, `${file}, questão ${index + 1}`);
    }

    const options = (question.options ?? []).map(normalize);
    if (new Set(options).size !== options.length) {
      issues.push(`${file}: questão ${index + 1} possui alternativas repetidas.`);
    }
  }
}

for (const file of sourceFiles) {
  const content = readFileSync(join(moduleDirectory, file), "utf8");
  if (!content.includes("não reproduz material proprietário")) {
    issues.push(`${file}: declaração de não reprodução ausente.`);
  }
  for (const pattern of forbiddenReferences) {
    if (pattern.test(content)) {
      issues.push(`${file}: referência externa não aprovada encontrada.`);
    }
  }
}

const result = {
  schema: "apostolic-ia.editorial-audit.v1",
  module: "TEO-ESC-001",
  passed: issues.length === 0,
  checks: {
    filesInspected: inspectedFiles.length,
    lessons: lessonFiles.length,
    quizzes: quizFiles.length,
    sourceMaps: sourceFiles.length,
    uniqueQuizPrompts: questionOwners.size,
    exactLongBlockDuplicates: issues.filter((issue) =>
      issue.includes("bloco extenso duplicado")
    ).length,
    forbiddenReferences: issues.filter((issue) =>
      issue.includes("referência externa")
    ).length
  },
  limits: {
    externalProtectedCorpusCompared: false,
    humanSimilarityReviewRequired: true,
    bibliographyReviewRequired: true,
    publicationAllowed: false
  },
  issues
};

console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;

