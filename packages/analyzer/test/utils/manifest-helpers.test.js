// @ts-expect-error
import { describe } from '@asdgf/cli';
import * as assert from 'uvu/assert';
// import { classPlugin } from '../../src/features/analyse-phase/classes.js';
// import { mixinPlugin } from '../../src/features/analyse-phase/mixins.js';
import { getInheritanceTree } from '../../src/utils/manifest-helpers.js';
import { createManifestFromFiles } from '../../test-helpers/index.js';

/**
 * @typedef {import('../../src/_types').CemPluginObject} CemPluginObject
 * @typedef {import('custom-elements-manifest/schema').CustomElement} CustomElement
 */

// @ts-expect-error
describe('getInheritanceTree > Superclasses (in local package)', ({ it }) => {
  it.only('finds direct superclass', async () => {
    const manifest = createManifestFromFiles([
      { path: 'pkg/X.js', content: `export class X extends HTMLElement {}` },
      {
        path: 'pkg/Y.js',
        content: `
      import {X} from './X.js';

      export class Y extends X {}
      `,
      },
    ]);
    const tree = getInheritanceTree(manifest, 'Y');

    assert.equal(tree, [
      manifest.modules[1].declarations?.[0],
      manifest.modules[0].declarations?.[0],
    ]);
  });

  // TODO: fix this
  it.skip('does also find superclass when Identifier exported as default', async () => {
    const manifest = createManifestFromFiles([
      { path: 'pkg/X.js', content: `export default class X extends HTMLElement {}` },
      {
        path: 'pkg/Y.js',
        content: `
      import DefaultExport from './X.js';

      export class Y extends DefaultExport {}
      `,
      },
    ]);
    const tree = getInheritanceTree(manifest, 'Y');

    assert.equal(tree, [
      manifest.modules[1].declarations?.[0],
      manifest.modules[0].declarations?.[0],
    ]);
  });

  it('finds transitive superclasses', async () => {
    const manifest = createManifestFromFiles([
      { path: 'pkg/X.js', content: `export default class X extends HTMElement {}` },
      {
        path: 'pkg/Y.js',
        content: `
      import X from './X.js';

      export class Y extends X {}
      `,
      },
      {
        path: 'pkg/Z.js',
        content: `
      import Y from './Y.js';

      export class Z extends Y {}
      `,
      },
    ]);
    const tree = getInheritanceTree(manifest, 'Z');
    assert.equal(tree, [
      manifest.modules[2].declarations?.[0],
      manifest.modules[1].declarations?.[0],
      manifest.modules[0].declarations?.[0],
    ]);
  });

  // TODO: make sure this works as well? classPlugin should add non exported to declarations?
  it('also works for (non exported) customElement definitions', async () => {
    const manifest = createManifestFromFiles([
      { path: 'pkg/X.js', content: `export class X extends HTMLElement {}` },
      {
        path: 'pkg/Y.js',
        content: `
      import X from './X.js';

      class Y extends X {}
      customElements.define('el-y', Y);
      `,
      },
    ]);
    const tree = getInheritanceTree(manifest, 'Y');
    assert.equal(tree, [
      manifest.modules[1].declarations?.[0],
      manifest.modules[0].declarations?.[0],
    ]);
  });
});

// @ts-expect-error
describe('getInheritanceTree > Mixins (in local package)', ({ it }) => {
  it('finds direct superclass', async () => {
    const manifest = createManifestFromFiles([
      {
        path: 'pkg-local/node_modules/pkg-external/MixX.js',
        content: `
      export const MixX = superclass => class extends superclass {};
      `,
      },
      {
        path: 'pkg/MixX.js',
        content: `
      import {MixX} from './MixX.js';

      export class Y extends Mix(HTMLElement) {}
      `,
      },
    ]);
    const tree = getInheritanceTree(manifest, 'Y');

    assert.equal(tree, [
      manifest.modules[1].declarations?.[0],
      manifest.modules[0].declarations?.[0],
    ]);
  });

  it('finds transitive superclasses', async () => {
    const manifest = createManifestFromFiles([
      { path: 'pkg/X.js', content: `export class X extends HTMElement {}` },
      {
        path: 'pkg-local/node_modules/pkg-external/MixY.js',
        content: `
      export const MixY = superclass => class extends superclass {};
      `,
      },
      {
        path: 'pkg/Z.js',
        content: `
      import Y from './Y.js';

      export class Z extends Y {}
      `,
      },
    ]);
    const tree = getInheritanceTree(manifest, 'Z');
    assert.equal(tree, [
      manifest.modules[2].declarations?.[0],
      manifest.modules[1].declarations?.[0],
      manifest.modules[0].declarations?.[0],
    ]);
  });
});

describe.skip('getInheritanceTree > In external package, without export maps (superclass & mixins)', ({
  // @ts-expect-error
  it,
}) => {
  it('finds direct superclass', async () => {
    const manifest = createManifestFromFiles([
      {
        path: 'pkg-local/node_modules/pkg-external/X.js',
        content: `export class X extends HTMLElement {}`,
      },
      {
        path: 'pkg-local/Y.js',
        content: `
      import {X} from 'pkg-external/X.js';

      export class Y extends X {}
      `,
      },
    ]);
    const tree = getInheritanceTree(manifest, 'Y');

    assert.equal(tree, [
      manifest.modules[1].declarations?.[0],
      manifest.modules[0].declarations?.[0],
    ]);
  });

  it('finds transitive superclasses', async () => {
    const manifest = createManifestFromFiles([
      {
        path: 'pkg-local/node_modules/pkg-external/X.js',
        content: `export class X extends HTMLElement {}`,
      },
      {
        path: 'pkg-local/node_modules/pkg-external/MixY.js',
        content: `
      export const MixY = superclass => class extends superclass {};
      `,
      },
      {
        path: 'pkg/Z.js',
        content: `
      import X from './X.js';
      import Y from 'pkg-external/MixY.js';

      export class Z extends MixY(X) {}
      `,
      },
    ]);
    const tree = getInheritanceTree(manifest, 'Z');

    assert.equal(tree, [
      manifest.modules[2].declarations?.[0],
      manifest.modules[1].declarations?.[0],
      manifest.modules[0].declarations?.[0],
    ]);
  });
});

describe.skip('getInheritanceTree > In external package, with export maps (superclass & mixins)', ({
  // @ts-expect-error
  it,
}) => {
  it('finds direct superclass', async () => {
    const manifest = createManifestFromFiles([
      {
        path: 'pkg-local/node_modules/pkg-external/package.json',
        content: JSON.stringify({
          name: 'pkg-external',
          exports: {
            './src/X.js': './X.js',
          },
        }),
      },
      {
        path: 'pkg-local/node_modules/pkg-external/src/X.js',
        content: `export class X extends HTMLElement {}`,
      },
      {
        path: 'pkg-local/Y.js',
        content: `
      import {X} from 'pkg-external/X.js';

      export class Y extends X {}
      `,
      },
    ]);
    const tree = getInheritanceTree(manifest, 'Y');

    assert.equal(tree, [
      manifest.modules[1].declarations?.[0],
      manifest.modules[0].declarations?.[0],
    ]);
  });

  it('finds transitive superclasses', async () => {
    const manifest = createManifestFromFiles([
      {
        path: 'pkg-local/node_modules/pkg-external/package.json',
        content: JSON.stringify({
          name: 'pkg-external',
          exports: {
            './src/X.js': './X.js',
            './src/MixY.js': './MixY.js',
          },
        }),
      },
      {
        path: 'pkg-local/node_modules/src/pkg-external/X.js',
        content: `export class X extends HTMLElement {}`,
      },
      {
        path: 'pkg-local/node_modules/pkg-external/MixY.js',
        content: `
      export const MixY = superclass => class extends superclass {};
      `,
      },
      {
        path: 'pkg/Z.js',
        content: `

      import {MixY} from 'pkg-external/MixY.js';

      export class Z extends MixY(X) {}
      `,
      },
    ]);
    const tree = getInheritanceTree(manifest, 'Z');

    assert.equal(tree, [
      manifest.modules[2].declarations?.[0],
      manifest.modules[1].declarations?.[0],
      manifest.modules[0].declarations?.[0],
    ]);
  });
});

// it('does not detect superclasses of superclass (handled in other plugin)', async () => {
//   const classDeclOutput = getClassDeclOutput({
//     fullContent: `
//         import {BatchingElement} from 'package/BatchingElement';

//         ExtendedElement

//         class X extends ExtendedElement {}`,
//     modulePath: 'my/module.js',
//   });
//   assert.equal(classDeclOutput.superclass, {
//     name: 'BatchingElement',
//     module: 'package/BatchingElement',
//   });
// });
