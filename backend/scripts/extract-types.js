#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Extract DTO types & enums from the Nest backend and generate frontend-ready .ts interfaces.
 *
 *  • AST-based (ts-morph)
 *  • Constructors / methods stripped
 *  • Inheritance flattened, implements removed
 *  • Nested property types preserved
 *  • class-validator decorators → JSDoc
 *  • Redundant interface imports removed
 *  • **Proper newline after interface { … }**  ← iteration 5 tweak
 */

const fs = require('fs');
const path = require('path');
const { Project, SyntaxKind } = require('ts-morph');

// ────────── CONFIG ──────────
const BACKEND_SRC = path.resolve(__dirname, '../src');
const OUTPUT_DIR = path.resolve(__dirname, '../../web/src/types/generated');
const DTO_PATTERN = /\.dto\.ts$/;
const ENUM_PATTERN = /\.enum\.ts$/;
const CLASS_VAL_PKG = 'class-validator';

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ────────── HELPERS ──────────
const posix = (p) => p.split(path.sep).join(path.posix.sep);

function findTypeFiles(dir) {
  const dto = [];
  const enm = [];
  (function walk(cwd) {
    for (const e of fs.readdirSync(cwd, { withFileTypes: true })) {
      const fp = path.join(cwd, e.name);
      if (e.isDirectory()) walk(fp);
      else if (e.isFile()) {
        if (DTO_PATTERN.test(e.name)) dto.push(fp);
        else if (ENUM_PATTERN.test(e.name)) enm.push(fp);
      }
    }
  })(dir);
  return { dtoFiles: dto, enumFiles: enm };
}

const PRIMITIVES = new Set([
  'string',
  'number',
  'boolean',
  'any',
  'unknown',
  'void',
  'null',
  'undefined',
  'Date',
]);

function jsDocFromDecorators(prop) {
  return prop.getDecorators().map((d) => {
    const name = d.getName();
    const args = d
      .getArguments()
      .map((a) => a.getText())
      .join(', ');
    return args ? `@${name} ${args}` : `@${name}`;
  });
}

function gatherProperties(cls) {
  const list = [];
  (function recur(c) {
    c.getProperties().forEach((p) => list.push(p));
    const base = c.getBaseClass();
    if (base && base.getSourceFile().getFilePath().startsWith(BACKEND_SRC)) recur(base);
  })(cls);
  return list;
}

function relImport(fromDirAbs, toFileAbs) {
  let rel = posix(path.relative(fromDirAbs, toFileAbs));
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.replace(/\.ts$/, '');
}

/**
 * Build interface body: returns { propLines, usedNames, refs }
 */
function buildInterfaceBody(cls) {
  const propLines = [];
  const usedNames = new Set();
  const refs = new Set();

  gatherProperties(cls).forEach((p) => {
    if (
      p.hasModifier(SyntaxKind.StaticKeyword) ||
      p.hasModifier(SyntaxKind.PrivateKeyword) ||
      p.hasModifier(SyntaxKind.ProtectedKeyword)
    )
      return;

    const name = p.getName();
    const typeNode = p.getTypeNode();
    const typeTxt = typeNode ? typeNode.getText() : 'any';
    const opt = p.hasQuestionToken() ? '?' : '';

    /* crude identifier grab from the type text */
    (typeTxt.match(/\b[A-Z][A-Za-z0-9_]*/g) || []).forEach((id) => {
      if (!PRIMITIVES.has(id)) usedNames.add(id);
    });

    const docs = jsDocFromDecorators(p);
    if (docs.length) {
      propLines.push('  /**');
      docs.forEach((l) => propLines.push(`   * ${l}`));
      propLines.push('   */');
    }
    propLines.push(`  ${name}${opt}: ${typeTxt};`);

    const sym = p.getType().getSymbol();
    if (sym) {
      sym.getDeclarations().forEach((d) => {
        const fp = d.getSourceFile().getFilePath();
        if (fp.startsWith(BACKEND_SRC)) {
          refs.add(
            posix(path.relative(BACKEND_SRC, fp))
              .replace(/\.dto\.ts$/, '.types')
              .replace(/\.ts$/, ''),
          );
        }
      });
    }
  });

  return { propLines, usedNames, refs };
}

function transformImports(src, implementsNames, usedNames) {
  const lines = [];
  const keptRel = new Set();

  src.getImportDeclarations().forEach((imp) => {
    const raw = imp.getModuleSpecifierValue();
    if (raw.startsWith(CLASS_VAL_PKG) || raw.startsWith('@nestjs/')) return;

    let spec = posix(raw.replace(/\.dto(\.ts)?$/, '.types'));

    const defaultImp = imp.getDefaultImport()?.getText() || '';
    const namespaceImp = imp.getNamespaceImport()?.getText() || '';
    const named = imp.getNamedImports().map((n) => n.getName());

    const keptNamed = named.filter((id) => !(implementsNames.has(id) && !usedNames.has(id)));

    if (!keptNamed.length && !defaultImp && !namespaceImp) return;

    let clause;
    if (namespaceImp) clause = `* as ${namespaceImp}`;
    else if (defaultImp && keptNamed.length) clause = `${defaultImp}, { ${keptNamed.join(', ')} }`;
    else if (defaultImp) clause = defaultImp;
    else clause = `{ ${keptNamed.join(', ')} }`;

    lines.push(`import ${clause} from '${spec}';`);

    keptRel.add(
      spec.startsWith('.')
        ? posix(
            path.relative(BACKEND_SRC, path.resolve(path.dirname(src.getFilePath()), spec)),
          ).replace(/\.ts$/, '')
        : spec,
    );
  });

  return { importBlock: lines.join('\n'), keptRel };
}

/**
 * DTO → interface
 */
function transformDto(absPath) {
  const project = new Project({ compilerOptions: { skipLibCheck: true } });
  const src = project.addSourceFileAtPath(absPath);
  const cls = src.getClasses()[0];
  if (!cls) throw new Error(`No class in ${absPath}`);

  const implementsNames = new Set(
    cls.getImplements().map((impl) => impl.getExpression().getText().split('<')[0]),
  );

  const { propLines, usedNames, refs } = buildInterfaceBody(cls);
  const { importBlock, keptRel } = transformImports(src, implementsNames, usedNames);

  const genPath = path.join(
    OUTPUT_DIR,
    path.relative(BACKEND_SRC, absPath).replace(/\.dto\.ts$/, '.types.ts'),
  );
  const genDir = path.dirname(genPath);

  const extraImports = [...refs]
    .filter((r) => !keptRel.has(r))
    .map((r) => {
      const abs = path.join(OUTPUT_DIR, r + '.ts');
      return `import * as _unused_${path.basename(r).replace(/[^A-Za-z0-9]/g, '')} from '${relImport(genDir, abs)}';`;
    })
    .join('\n');

  const header = `// Auto-generated from ${posix(path.relative(BACKEND_SRC, absPath))}
// Do not edit – generated at build-time\n\n`;

  return [
    header,
    importBlock,
    extraImports ? (importBlock ? '\n' + extraImports : extraImports) : '',
    importBlock || extraImports ? '\n' : '',
    `export interface ${cls.getName()} {\n`,
    propLines.join('\n'),
    '\n}\n',
  ].join('');
}

function transformEnum(content, abs) {
  return `// Auto-generated from ${posix(path.relative(BACKEND_SRC, abs))}
// Do not edit – generated at build-time\n\n${content.trim()}\n`;
}

// ────────── MAIN ──────────
function extract() {
  console.log('🔄 Extracting DTO & enum types…');
  const { dtoFiles, enumFiles } = findTypeFiles(BACKEND_SRC);
  const generated = [];

  for (const f of enumFiles) {
    const out = path.join(OUTPUT_DIR, path.relative(BACKEND_SRC, f));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, transformEnum(fs.readFileSync(f, 'utf8'), f));
    generated.push(out);
    console.log('Enum ➜', posix(path.relative(BACKEND_SRC, f)));
  }

  for (const f of dtoFiles) {
    const out = path.join(
      OUTPUT_DIR,
      path.relative(BACKEND_SRC, f).replace(/\.dto\.ts$/, '.types.ts'),
    );
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, transformDto(f));
    generated.push(out);
    console.log('DTO  ➜', posix(path.relative(BACKEND_SRC, f)));
  }

  const barrel = generated
    .map((p) => `export * from './${posix(path.relative(OUTPUT_DIR, p)).replace(/\.ts$/, '')}';`)
    .join('\n');
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'index.ts'),
    `// Auto-generated barrel – DO NOT EDIT\n\n${barrel}\n`,
  );

  console.log(`🎉 Done. DTOs: ${dtoFiles.length}, Enums: ${enumFiles.length}`);
  console.log('📂 Output →', OUTPUT_DIR);
}

try {
  extract();
} catch (err) {
  console.error('❌ Extraction failed:', err);
  process.exit(1);
}
