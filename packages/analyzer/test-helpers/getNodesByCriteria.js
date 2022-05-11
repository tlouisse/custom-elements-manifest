import ts from 'typescript';

/**
 * @typedef {import('typescript').Node} Node
 */

/**
 * Helper function that returns categorized Nodes based on criteria
 * @param {string} file
 * @param {{name: string, fn: (n:Node) => boolean}[]} criteria
 * @example
 * ```js
 * const foundNodes = getNodesByCriteria(file, [
 *  { name: 'jsDoc', fn: (node) => Boolean(node.jsDoc) },
 * ]);
 * const firstJsDocNode = foundNodes?.jsDoc?.[0];
 * ```
 * @returns {{[categoryName:string]: Node[]}}
 */
export function getNodesByCriteria(file, criteria) {
  const node = ts.createSourceFile('test.js', file, ts.ScriptTarget.ES2015, true);
  /** @type {{[categoryName:string]: Node[]}} */
  const foundNodes = {};
  (function find(/** @type {Node} */ node) {
    criteria.forEach((cObj) => {
      if (cObj.fn(node)) {
        foundNodes[cObj.name] = [...(foundNodes[cObj.name] || []), node];
      }
    });
    ts.forEachChild(node, find);
  })(node);
  return foundNodes;
}
