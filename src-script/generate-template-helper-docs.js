/**
 *
 *    Copyright (c) 2020 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

const fs = require('fs')
const path = require('path')
const jsdoc2md = require('jsdoc-to-markdown')

/**
 * Read the right-hand side of an `exports.name =` assignment.
 * Stops at the statement boundary so nested `dep()` calls stay intact.
 *
 * @param {string} source
 * @param {number} start
 * @returns {{text: string, end: number}}
 */
function readExportRhs(source, start) {
  let i = start
  let depth = 0
  let quote = null
  let started = false
  while (i < source.length) {
    const c = source[i]
    if (quote) {
      if (c === '\\') {
        i += 2
        continue
      }
      if (c === quote) quote = null
      i++
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      quote = c
      started = true
      i++
      continue
    }
    if (c === '/' && source[i + 1] === '/') {
      i += 2
      while (i < source.length && source[i] !== '\n') i++
      continue
    }
    if (c === '/' && source[i + 1] === '*') {
      i += 2
      while (
        i < source.length &&
        !(source[i] === '*' && source[i + 1] === '/')
      ) {
        i++
      }
      i += 2
      continue
    }
    if (c === '(' || c === '{' || c === '[') {
      depth++
      started = true
      i++
      continue
    }
    if (c === ')' || c === '}' || c === ']') {
      depth = Math.max(0, depth - 1)
      i++
      continue
    }
    if ((c === '\n' || c === ';') && depth === 0 && started) {
      return {
        text: source.slice(start, i).trim(),
        end: c === ';' ? i + 1 : i
      }
    }
    if (!started && (c === ' ' || c === '\t' || c === '\n' || c === '\r')) {
      i++
      continue
    }
    if (!/\s/.test(c)) started = true
    i++
  }
  return { text: source.slice(start).trim(), end: source.length }
}

/**
 * Classify an export assignment as a live helper name or a deprecated alias.
 *
 * @param {string} text
 * @returns {{localName: string, deprecated: boolean, to: string|null}|null}
 */
function parseExportRhs(text) {
  const cleaned = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .trim()
  if (!cleaned) return null
  const direct = /^([A-Za-z_$][\w$]*)(?:\.([A-Za-z_$][\w$]*))?$/.exec(cleaned)
  if (direct) {
    return {
      localName: direct[2] || direct[1],
      deprecated: false,
      to: null
    }
  }
  const depCall =
    /^dep\s*\(\s*([A-Za-z_$][\w$]*)(?:\.([A-Za-z_$][\w$]*))?/.exec(cleaned)
  if (!depCall) return null
  const toMatch = /\bto\s*:\s*['"]([^'"]+)['"]/.exec(cleaned)
  return {
    localName: depCall[2] || depCall[1],
    deprecated: true,
    to: toMatch ? toMatch[1] : null
  }
}

/**
 * Pick the template-facing name for one function.
 * Live `exports.helper_name = fn` assignments win over `dep()` aliases.
 * When several live names exist, the name a deprecated alias points at is used.
 *
 * @param {Array<{exportName: string, deprecated: boolean, to: string|null}>} list
 * @returns {string}
 */
function chooseExportedName(list) {
  const canonical = list.filter((assignment) => !assignment.deprecated)
  const pool = canonical.length ? canonical : list
  const toTargets = new Set(
    list
      .map((assignment) => assignment.to)
      .filter(
        (name) =>
          name && pool.some((assignment) => assignment.exportName === name)
      )
  )
  const preferred = pool.find((assignment) =>
    toTargets.has(assignment.exportName)
  )
  if (preferred) return preferred.exportName
  if (pool.length === 1) return pool[0].exportName
  const lower = pool.find(
    (assignment) =>
      assignment.exportName === assignment.exportName.toLowerCase()
  )
  return (lower || pool[0]).exportName
}

/**
 * Map each function identifier to the helper name templates call.
 * Later assignments to the same `exports` property replace earlier ones,
 * matching runtime behavior.
 *
 * @param {string} source
 * @returns {Map<string, string>}
 */
function exportedNamesByFunction(source) {
  const assignments = []
  const exportRe = /(?:^|\n)[ \t]*exports\.([A-Za-z0-9_]+)\s*=\s*/g
  let match
  while ((match = exportRe.exec(source)) !== null) {
    const exportName = match[1]
    const rhs = readExportRhs(source, exportRe.lastIndex)
    exportRe.lastIndex = rhs.end
    const parsed = parseExportRhs(rhs.text)
    if (!parsed) continue
    assignments.push({
      exportName,
      localName: parsed.localName,
      deprecated: parsed.deprecated,
      to: parsed.to
    })
  }

  const byExport = new Map()
  for (const assignment of assignments) {
    byExport.set(assignment.exportName, assignment)
  }
  const byLocal = new Map()
  for (const assignment of byExport.values()) {
    if (!byLocal.has(assignment.localName)) {
      byLocal.set(assignment.localName, [])
    }
    byLocal.get(assignment.localName).push(assignment)
  }

  const names = new Map()
  for (const [localName, list] of byLocal) {
    names.set(localName, chooseExportedName(list))
  }
  return names
}

/**
 * Replace the member portion of a JSDoc longname without touching a longer
 * sibling such as `default_access` when renaming `access`.
 *
 * @param {string} longname
 * @param {string} previous
 * @param {string} exportedName
 * @returns {string}
 */
function replaceMember(longname, previous, exportedName) {
  if (!longname) return longname
  const separator = Math.max(
    longname.lastIndexOf('~'),
    longname.lastIndexOf('.'),
    longname.lastIndexOf('#')
  )
  if (separator === -1 || longname.slice(separator + 1) !== previous) {
    return longname
  }
  return longname.slice(0, separator + 1) + exportedName
}

/**
 * Point a function doclet at its exported helper name.
 *
 * @param {object} doclet
 * @param {string} exportedName
 * @returns {object}
 */
function renameDoclet(doclet, exportedName) {
  if (!exportedName || exportedName === doclet.name) return doclet
  const previous = doclet.name
  doclet.name = exportedName
  doclet.longname = replaceMember(doclet.longname, previous, exportedName)
  doclet.id = replaceMember(doclet.id, previous, exportedName)
  return doclet
}

/**
 * Rewrite function doclets so headings use `exports` names.
 *
 * @param {object[]} doclets
 * @param {Map<string, Map<string, string>>} mapsByFile filename to function-to-export map
 * @returns {object[]}
 */
function applyExportedHelperNames(doclets, mapsByFile) {
  for (const doclet of doclets) {
    if (!doclet || doclet.kind !== 'function' || !doclet.name) continue
    const filename = doclet.meta && doclet.meta.filename
    const names = mapsByFile.get(filename)
    if (!names) continue
    renameDoclet(doclet, names.get(doclet.name))
  }
  return doclets
}

/**
 * Helper modules documented by `npm run helper-doc`.
 * Matches the shell glob `src-electron/generator/helper*.js`.
 *
 * @param {string} [dir]
 * @returns {string[]}
 */
function helperSourceFiles(
  dir = path.join(__dirname, '../src-electron/generator')
) {
  return fs
    .readdirSync(dir)
    .filter((name) => name.startsWith('helper') && name.endsWith('.js'))
    .sort()
    .map((name) => path.join(dir, name))
}

/**
 * Render helper markdown, naming each helper by its export.
 *
 * @param {string[]} files
 * @returns {string}
 */
function renderHelperDocs(files) {
  const mapsByFile = new Map()
  for (const file of files) {
    mapsByFile.set(
      path.basename(file),
      exportedNamesByFunction(fs.readFileSync(file, 'utf8'))
    )
  }
  const data = jsdoc2md.getTemplateDataSync({ files })
  applyExportedHelperNames(data, mapsByFile)
  return jsdoc2md.renderSync({ data })
}

/**
 * Write docs/helpers.md from the generator helper modules.
 */
function main() {
  const markdown = renderHelperDocs(helperSourceFiles())
  const out = path.join(__dirname, '../docs/helpers.md')
  fs.writeFileSync(out, markdown.endsWith('\n') ? markdown : markdown + '\n')
  console.log('Handlebar template API documentation generated successfully.')
}

if (require.main === module) {
  try {
    main()
  } catch (error) {
    console.error(
      'Failed to generate Handlebar template API documentation:',
      error.message
    )
    throw error
  }
}

module.exports = {
  exportedNamesByFunction,
  applyExportedHelperNames,
  renderHelperDocs,
  helperSourceFiles
}
