import { hasDefaultImport, hasNamedImport, hasAggregatingImport } from '../../utils/imports.js';
import { isBareModuleSpecifier } from '../../utils/index.js';

/**
 * @typedef {import('../../_types').CemPlugin} CemPlugin
 * @typedef {import('../../_types').CemImport} CemImport
 * @typedef {import('../../_types').PluginContext} PluginContext
 * @typedef {import('typescript')} TS
 * @typedef {import('typescript').SourceFile} TsSourceFile
 */

/**
 * COLLECT-IMPORTS
 *
 * Collects a modules imports so that declarations can later be resolved to their module/package.
 *
 * @type {CemPlugin}
 */
export function collectImportsPlugin() {
  const files = {};
  let currModuleImports;

  return {
    name: 'CORE - IMPORTS',
    collectPhase({ ts, node: myNode }) {
      const node = /** @type {TsSourceFile} */ (myNode);

      if (node.kind === ts.SyntaxKind.SourceFile) {
        /**
         * Create an empty array for each module we visit
         */
        files[node.fileName] = [];
        currModuleImports = files[node.fileName];
      }

      /**
       * @example import defaultExport from 'foo';
       */
      if (hasDefaultImport(node)) {
        /** @type {CemImport} */
        const importTemplate = {
          name: node.importClause.name.text,
          kind: 'default',
          importPath: node.moduleSpecifier.text,
          isBareModuleSpecifier: isBareModuleSpecifier(node.moduleSpecifier.text),
          isTypeOnly: !!node?.importClause?.isTypeOnly,
        };
        currModuleImports.push(importTemplate);
      }

      /**
       * @example import { export1, export2 } from 'foo';
       * @example import { export1 as alias1 } from 'foo';
       * @example import { export1, export2 as alias2 } from 'foo';
       */
      if (hasNamedImport(node)) {
        node.importClause.namedBindings.elements.forEach((element) => {
          /** @type {CemImport} */
          const importTemplate = {
            name: element.name.text,
            kind: 'named',
            importPath: node.moduleSpecifier.text,
            isBareModuleSpecifier: isBareModuleSpecifier(node.moduleSpecifier.text),
            isTypeOnly: !!node?.importClause?.isTypeOnly,
          };
          currModuleImports.push(importTemplate);
        });
      }

      /**
       * @example import * as name from './my-module.js';
       */
      if (hasAggregatingImport(node)) {
        /** @type {CemImport} */
        const importTemplate = {
          name: node.importClause.namedBindings.name.text,
          kind: 'aggregate',
          importPath: node.moduleSpecifier.text,
          isBareModuleSpecifier: isBareModuleSpecifier(node.moduleSpecifier.text),
          isTypeOnly: !!node?.importClause?.isTypeOnly,
        };
        currModuleImports.push(importTemplate);
      }
    },
    analyzePhase({ ts, node, context }) {
      if (node.kind === ts.SyntaxKind.SourceFile) {
        /** Makes the imports available on the context object for a given module */
        context.imports = files[node.fileName];
      }
    },
    packageLinkPhase({ context }) {
      /** Reset */
      context.imports = [];
    },
  };
}
