import { createManifestFromFiles } from './create-manifest-helpers.js';

/**
 * @typedef {import('./_types').TestFile} TestFile
 * @typedef {import('typescript').SourceFile} SourceFile
 * @typedef {import('typescript').Node} Node
 * @typedef {import('./_types').CemPluginObject} CemPluginObject
 * @typedef {import('custom-elements-manifest/schema').Package} ManifestPackage
 * @typedef {{ content:string; className:string; path:string; }} ClassFile
 * @typedef {import('custom-elements-manifest/schema').CustomElement} CustomElement
 */

/**
 *
 * @param {CemPluginObject[]} pluginsToTest
 */
export const createClassDeclOutputForPlugins =
  (pluginsToTest) =>
  /**
   * @param {object} opts
   * @param {string} [opts.fullContent]
   * @param {string} [opts.bodyFragment]
   * @param {string} [opts.jsDocFragment]
   * @param {CemPluginObject[]} [opts.pluginsToTest]
   * @param {string|undefined} [opts.classNameToLookFor]
   * @param {string|undefined} [opts.modulePath]
   * @returns {CustomElement}
   */
  (opts) =>
    getClassDeclOutput({ pluginsToTest, ...opts });

/**
 * @param {object} opts
 * @param {string} [opts.fullContent]
 * @param {string} [opts.bodyFragment]
 * @param {string} [opts.jsDocFragment]
 * @param {CemPluginObject[]} opts.pluginsToTest
 * @param {string|undefined} [opts.classNameToLookFor]
 * @param {string|undefined} [opts.modulePath]
 * @returns {CustomElement}
 */
export function getClassDeclOutput({
  fullContent = '',
  bodyFragment = '',
  jsDocFragment = '',
  pluginsToTest,
  classNameToLookFor,
  modulePath,
}) {
  if (!pluginsToTest.length) {
    throw new Error('[getClassDeclOutput]: Please provide plugin(s) like "[classPlugin()]" ');
  }
  const content =
    fullContent ||
    `
  /**
   ${jsDocFragment}
   */
  class MyClass extends HTMLElement {
    ${bodyFragment}
  }
`;
  const path = modulePath || 'test.js';
  return /** @type {CustomElement} */ (
    getClassDeclOutputFromManifest({
      manifestObj: createManifestFromFiles([{ content, path }], {
        plugins: pluginsToTest,
        omitDefaultPlugins: true,
      }),
      className: classNameToLookFor,
      path,
    })
  );
}

/**
 * @param {{manifestObj:ManifestPackage; className?:string; path:string}} opts
 */
export function getClassDeclOutputFromManifest({ manifestObj, className, path }) {
  const moduleForPath = manifestObj.modules.find((manifest) => manifest.path === path);
  return moduleForPath?.declarations?.find(
    (module) => module.kind === 'class' && (!className || module.name === className),
  );
}

/**
 * @param {object} options
 * @param {string} [options.classBodyFragment] for quick, simple constructions of tests where only the body matters and one file is needed
 * @param {ClassFile} [options.file] when classBodyFragment is not enough, define the complete file. Mutually exclusive to classBodyFragment
 * @param {TestFile[]} [options.packageFiles = []] sibling files in same package
 */
export function getManifestClassDeclaration({ classBodyFragment, file, packageFiles = [] }) {
  let [className, path, content] = ['', '', ''];

  if (classBodyFragment) {
    className = 'MyClass';
    path = '/my/Class.js';
    content = `
    class ${className} extends HTMLElement {
      ${classBodyFragment}
    }`;
  } else if (file) {
    ({ className, path, content } = file);
  } else {
    throw new Error(
      `[getManifestClassDeclaration]: either provide a .classBodyFragment or a .file`,
    );
  }

  const files = [{ path, content }, ...packageFiles];
  const manifestObj = createManifestFromFiles(files);
  return getClassDeclOutputFromManifest({ manifestObj, className, path });
}
