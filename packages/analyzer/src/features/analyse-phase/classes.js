import { createClass } from './creators/createClass.js';

/**
 * @typedef {import('../../_types').CemPlugin} CemPlugin
 * @typedef {import('typescript').ClassDeclaration} ClassDeclaration
 */

/**
 * classPlugin
 *
 * handles classes
 *
 * @type {CemPlugin}
 */
export function classPlugin() {
  return {
    name: 'CORE - CLASSES',
    analyzePhase({ ts, node, moduleDoc, context }) {
      switch (node.kind) {
        case ts.SyntaxKind.ClassDeclaration:
          const klass = createClass(/** @type {ClassDeclaration} */ (node), moduleDoc, context);
          moduleDoc.declarations?.push(klass);
          break;
      }
    },
  };
}
