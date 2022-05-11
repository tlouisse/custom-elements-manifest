import ts from 'typescript';

/**
 * @typedef {import('./_types').TestFile} TestFile
 * @typedef {import('typescript').SourceFile} SourceFile
 */

/**
 * @param {TestFile[]} files
 * @returns {SourceFile[]}
 */
export function createTsModulesFromFiles(files) {
  if (!Array.isArray(files) || !files.length) {
    throw new Error(
      `Please provide a file array of type '(string|{path:string, content:string})[]'`,
    );
  }
  /** @type {SourceFile[]} */
  const modules = [];
  files.forEach((file, idx) => {
    if (typeof file === 'string') {
      modules.push(ts.createSourceFile(`test-file-${idx}.js`, file, ts.ScriptTarget.ES2015, true));
    } else {
      modules.push(ts.createSourceFile(file.path, file.content, ts.ScriptTarget.ES2015, true));
    }
  });
  return modules;
}
