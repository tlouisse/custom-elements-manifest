import ts from 'typescript';
import { FEATURES } from '../src/features/index.js';
import { withErrorHandling } from '../src/utils/index.js';
import { createTsModulesFromFiles } from './createTsModulesFromFiles.js';

/**
 * @typedef {import('./_types').TestFile} TestFile
 * @typedef {import('./_types').CemPluginObject} CemPluginObject
 * @typedef {import('typescript').SourceFile} SourceFile
 * @typedef {import('typescript').Node} Node
 * @typedef {import('custom-elements-manifest/schema').Package} ManifestPackage
 * @typedef {import('custom-elements-manifest/schema').JavaScriptModule} ManifestJsModule
 */

/**
 * @param {object} config
 * @param {SourceFile} config.source
 * @param {ManifestJsModule} config.manifestJsModule
 * @param {CemPluginObject[]} config.mergedPlugins
 * @param {ManifestPackage} config.manifest
 * @param {{dev:boolean}} config.context
 */
function runAllPhases({ source, manifestJsModule, mergedPlugins, manifest, context }) {
  function visitNode(/** @type {Node} */ node) {
    mergedPlugins.forEach(
      ({ name, collectPhase, analyzePhase, moduleLinkPhase, packageLinkPhase }) => {
        withErrorHandling(name, () => {
          collectPhase?.({ ts, node: /** @type {SourceFile} */ (node), context });
          analyzePhase?.({
            ts,
            node: /** @type {SourceFile} */ (node),
            moduleDoc: manifestJsModule,
            context,
          });
          moduleLinkPhase?.({ ts, moduleDoc: manifestJsModule, context });
          packageLinkPhase?.({ customElementsManifest: manifest, context });
        });
      },
    );
    ts.forEachChild(node, visitNode);
  }
  visitNode(source);
}

/**
 * @param {TestFile[]} files
 * @param {{plugins:CemPluginObject[]; omitDefaultPlugins:boolean}} [customPlugins]
 * @returns {ManifestPackage}
 */
export function createManifestFromFiles(
  files,
  { plugins, omitDefaultPlugins } = { plugins: [], omitDefaultPlugins: false },
) {
  const modules = createTsModulesFromFiles(files);

  const context = { dev: false };
  /** @type {ManifestPackage} */
  const manifest = { schemaVersion: '1.0.0', readme: '', modules: [] };
  const mergedPlugins = [...(omitDefaultPlugins ? [] : FEATURES), ...plugins.flat()];

  if (!mergedPlugins.length) {
    throw new Error(`[createManifestFromFiles]: Please provide one or more plugins`);
  }

  modules.forEach((currModule) => {
    /** @type {ManifestJsModule} */
    const manifestJsModule = {
      kind: 'javascript-module',
      path: currModule.fileName,
      declarations: [],
      exports: [],
    };
    manifest.modules.push(manifestJsModule);
    runAllPhases({ source: currModule, manifestJsModule, mergedPlugins, manifest, context });
  });

  return manifest;
}
