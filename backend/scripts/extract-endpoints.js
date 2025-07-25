#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Extract NestJS controller endpoints and generate frontend-ready constants.
 *
 *  • AST-based (ts-morph) – no brittle RegExp parsing
 *  • Supports all HTTP method decorators, plus `@All`
 *  • Controller- & method-level `@Version()` merged into path (e.g. /v1)
 *  • Parameterised routes → strongly-typed arrow functions
 *  • **EVERY constant now starts with the HTTP verb**, incl. GET
 *  • Deterministic naming, sorted output, trailing newline
 *  • “--dry” flag to preview without writing
 */

const fs = require('fs');
const path = require('path');
const { Project, SyntaxKind } = require('ts-morph');

// ────────── CONFIG ──────────
const BACKEND_SRC = path.resolve(__dirname, '../src');
const OUTPUT_DIR = path.resolve(__dirname, '../../web/src/types/generated');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'api-endpoints.ts');

const CONTROLLER_PATTERN = /\.controller\.ts$/;
const HTTP_DECOS = new Set(['Get', 'Post', 'Put', 'Delete', 'Patch', 'Options', 'Head', 'All']);

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
const posix = (p) => p.split(path.sep).join(path.posix.sep);

// ────────── UTILS ──────────
function findControllerFiles(dir) {
  const list = [];
  (function walk(cwd) {
    for (const e of fs.readdirSync(cwd, { withFileTypes: true })) {
      const fp = path.join(cwd, e.name);
      if (e.isDirectory()) walk(fp);
      else if (e.isFile() && CONTROLLER_PATTERN.test(e.name)) list.push(fp);
    }
  })(dir);
  return list;
}

function argString(deco) {
  const arg = deco.getArguments()[0];
  return arg ? arg.getText().replace(/^['"`]|['"`]$/g, '') : '';
}

function versionPrefix(classVer, methodVer) {
  const v = methodVer || classVer;
  return v ? '/' + v.replace(/^v/i, '').toLowerCase().replace(/^\//, '') : '';
}

// ────────── PARSING ──────────
function parseController(absPath) {
  const project = new Project({ compilerOptions: { skipLibCheck: true } });
  const src = project.addSourceFileAtPath(absPath);
  const cls = src.getClasses()[0];
  if (!cls) return [];

  const ctrlDeco = cls.getDecorator('Controller');
  const basePath = ctrlDeco ? '/' + (argString(ctrlDeco) || '') : '';
  const classVer = cls.getDecorator('Version') ? argString(cls.getDecorator('Version')) : '';

  const endpoints = [];

  cls.getMethods().forEach((m) => {
    const httpDeco = m.getDecorators().find((d) => HTTP_DECOS.has(d.getName()));
    if (!httpDeco) return;

    const methodPath = argString(httpDeco) || '';
    const httpMethod = httpDeco.getName().toUpperCase();
    const methodVer = m.getDecorator('Version') ? argString(m.getDecorator('Version')) : '';
    const versionSeg = versionPrefix(classVer, methodVer);

    let fullPath = (basePath + versionSeg + '/' + methodPath).replace(/\/+/g, '/');
    if (!fullPath.startsWith('/')) fullPath = '/' + fullPath;
    if (fullPath !== '/' && fullPath.endsWith('/')) fullPath = fullPath.slice(0, -1);

    const paramRegex = /:([A-Za-z0-9_]+)/g;
    const params = [...fullPath.matchAll(paramRegex)].map((m) => m[1]);

    endpoints.push({
      source: posix(path.relative(BACKEND_SRC, absPath)),
      controller: cls.getName() || 'AnonymousController',
      methodName: m.getName(),
      httpMethod,
      path: fullPath,
      params,
      hasParams: params.length > 0,
    });
  });

  return endpoints;
}

// ────────── CODEGEN ──────────
function constantName(ep) {
  const pathPart =
    ep.path
      .replace(/^\//, '') // leading slash
      .replace(/\/:/g, '_') // '/:id' → '_id'
      .replace(/:/g, '') // remove ':'
      .replace(/\//g, '_') // '/' → '_'
      .replace(/-/g, '_') // '-' → '_'
      .toUpperCase() || 'ROOT';

  // ALWAYS prefix with verb (GET_, POST_, …)
  return `${ep.httpMethod}_${pathPart}`;
}

function endpointLine(ep) {
  const cname = constantName(ep);

  if (!ep.hasParams) return `  ${cname}: '${ep.path}',`;

  const plist = ep.params.map((p) => `${p}: string | number`).join(', ');
  const tpl = ep.path.replace(/:([A-Za-z0-9_]+)/g, '${$1}');
  return `  ${cname}: (${plist}) => \`${tpl}\`,`;
}

function generateContent(allEndpoints) {
  // group by first path segment for readability
  const grouped = new Map();
  allEndpoints.forEach((ep) => {
    const seg = ep.path.split('/').filter((s) => s && !s.startsWith(':'))[0] || 'root';
    if (!grouped.has(seg)) grouped.set(seg, []);
    grouped.get(seg).push(ep);
  });

  const header = `// Auto-generated API endpoints – DO NOT EDIT
// Generated at build-time from NestJS controllers in ${posix(path.relative(process.cwd(), BACKEND_SRC))}

`;

  let body = 'export const API = {\n';

  [...grouped.keys()].sort().forEach((group) => {
    body += `\n  // ${group.charAt(0).toUpperCase() + group.slice(1)} endpoints\n`;
    grouped
      .get(group)
      .sort((a, b) => a.path.localeCompare(b.path))
      .forEach((ep) => {
        body += endpointLine(ep) + '\n';
      });
  });

  body += `
} as const;

export type ApiEndpoints  = typeof API;
export type EndpointParams<T> = T extends (...args: infer P) => string ? P : never;
`;

  return header + body;
}

// ────────── MAIN ──────────
function extract({ dry = false } = {}) {
  console.log('🔄 Extracting endpoints…');

  const files = findControllerFiles(BACKEND_SRC);
  const endpoints = files.flatMap(parseController);

  if (!endpoints.length) {
    console.warn('⚠️  No endpoints found – check your controller paths.');
    return;
  }

  const fileContent = generateContent(endpoints);

  if (dry) {
    console.log('\n────────── Generated content (dry-run) ──────────\n');
    console.log(fileContent);
    console.log('─────────────────────────────────────────────────\n');
    return;
  }

  fs.writeFileSync(OUTPUT_FILE, fileContent.endsWith('\n') ? fileContent : fileContent + '\n');
  console.log(
    `✅ ${endpoints.length} endpoints → ${posix(path.relative(process.cwd(), OUTPUT_FILE))}`,
  );
}

// CLI entry
if (require.main === module) {
  const dry = process.argv.includes('--dry');
  try {
    extract({ dry });
  } catch (err) {
    console.error('❌ Endpoint extraction failed:', err);
    process.exit(1);
  }
}

module.exports = { extract };
