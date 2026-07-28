import { PERFORMANCE_BUDGETS } from "../apps/web/lib/resilience.mjs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

function decodeBasicEntities(value) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'");
}

function visibleText(value) {
  return decodeBasicEntities(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function hasAttribute(attributes, name) {
  return new RegExp(`\\b${name}\\s*=`, "i").test(attributes);
}

function attributeValue(attributes, name) {
  const match = attributes.match(
    new RegExp(`\\b${name}\\s*=\\s*([\"'])(.*?)\\1`, "i")
  );
  return match?.[2]?.trim() ?? "";
}

function hasExplicitName(attributes, content = "") {
  return (
    Boolean(attributeValue(attributes, "aria-label")) ||
    Boolean(attributeValue(attributes, "aria-labelledby")) ||
    Boolean(attributeValue(attributes, "title")) ||
    Boolean(visibleText(content))
  );
}

function collectPairedElements(html, tagName) {
  return [
    ...html.matchAll(
      new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, "gi")
    )
  ].map((match) => ({
    attributes: match[1] ?? "",
    content: match[2] ?? ""
  }));
}

function collectSingleElements(html, tagName) {
  return [
    ...html.matchAll(new RegExp(`<${tagName}\\b([^>]*)>`, "gi"))
  ].map((match) => match[1] ?? "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasAssociatedLabel(html, attributes) {
  if (
    attributeValue(attributes, "aria-label") ||
    attributeValue(attributes, "aria-labelledby") ||
    attributeValue(attributes, "title")
  ) {
    return true;
  }
  const id = attributeValue(attributes, "id");
  if (!id) return false;
  return new RegExp(
    `<label\\b[^>]*\\bfor\\s*=\\s*([\"'])${escapeRegExp(id)}\\1`,
    "i"
  ).test(html);
}

export function auditHtml(html) {
  const violations = [];
  const add = (id, message) => violations.push({ id, message });

  if (!/<!doctype\s+html/i.test(html)) {
    add("document-doctype", "Documento sem doctype HTML.");
  }
  if (!/<html\b[^>]*\blang\s*=\s*["'][^"']+["']/i.test(html)) {
    add("html-lang", "Documento sem idioma declarado.");
  }
  if (!/<title\b[^>]*>\s*[^<]+\s*<\/title>/i.test(html)) {
    add("document-title", "Documento sem título.");
  }
  if (!/<main\b/i.test(html)) {
    add("main-landmark", "Documento sem região main.");
  }
  if (!/<h1\b/i.test(html)) {
    add("page-heading", "Documento sem título principal h1.");
  }

  for (const attributes of collectSingleElements(html, "img")) {
    if (!hasAttribute(attributes, "alt")) {
      add("image-alt", "Imagem sem atributo alt.");
    }
  }

  for (const button of collectPairedElements(html, "button")) {
    if (!hasExplicitName(button.attributes, button.content)) {
      add("button-name", "Botão sem nome acessível.");
    }
  }

  for (const link of collectPairedElements(html, "a")) {
    if (!hasExplicitName(link.attributes, link.content)) {
      add("link-name", "Ligação sem nome acessível.");
    }
  }

  for (const attributes of collectSingleElements(html, "input")) {
    if (
      attributeValue(attributes, "type").toLowerCase() !== "hidden" &&
      !hasAssociatedLabel(html, attributes)
    ) {
      add("input-name", "Campo sem rótulo associado.");
    }
  }

  const ids = collectSingleElements(html, "[a-z][a-z0-9:-]*")
    .map((attributes) => attributeValue(attributes, "id"))
    .filter(Boolean);
  const duplicateIds = [...new Set(ids.filter(
    (id, index) => ids.indexOf(id) !== index
  ))];
  for (const id of duplicateIds) {
    add("duplicate-id", `Identificador duplicado: ${id}`);
  }

  return {
    passed: violations.length === 0,
    violations
  };
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

export async function auditPage(
  url,
  {
    fetcher = fetch,
    clock = () => performance.now(),
    attempts = 3
  } = {}
) {
  const durations = [];
  let html = "";
  let status = 0;
  let finalUrl = url;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const startedAt = clock();
    const response = await fetcher(url, {
      redirect: "follow",
      headers: {
        Accept: "text/html",
        "x-request-id": `quality-audit-${attempt + 1000}`
      }
    });
    durations.push(clock() - startedAt);
    status = response.status;
    finalUrl = response.url || url;
    html = await response.text();
  }

  const responseMs = median(durations);
  const markup = auditHtml(html);
  const violations = [...markup.violations];

  if (status < 200 || status >= 400) {
    violations.push({
      id: "http-status",
      message: `Estado HTTP inesperado: ${status}`
    });
  }
  if (responseMs > PERFORMANCE_BUDGETS.serverResponseMs) {
    violations.push({
      id: "server-response-budget",
      message:
        `Mediana ${responseMs.toFixed(1)} ms excede ` +
        `${PERFORMANCE_BUDGETS.serverResponseMs} ms.`
    });
  }

  return {
    url,
    finalUrl,
    status,
    responseMs: Number(responseMs.toFixed(1)),
    bytes: Buffer.byteLength(html),
    passed: violations.length === 0,
    violations
  };
}

async function runCli() {
  const [baseArgument = "http://localhost:3000", ...routeArguments] =
    process.argv.slice(2);
  const baseUrl = new URL(baseArgument);
  const routes = routeArguments.length
    ? routeArguments
    : ["/", "/entrar", "/criar-conta", "/dashboard-preview", "/offline"];

  const results = [];
  for (const route of routes) {
    if (!route.startsWith("/")) {
      throw new TypeError(`route must start with /: ${route}`);
    }
    results.push(await auditPage(new URL(route, baseUrl).href));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    passed: results.every((result) => result.passed),
    results
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.passed) process.exitCode = 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await runCli();
}
