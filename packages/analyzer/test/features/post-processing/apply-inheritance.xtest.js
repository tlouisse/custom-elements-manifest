// @ts-expect-error
import { describe } from '@asdgf/cli';
import * as assert from 'uvu/assert';
import { classPlugin } from '../../../src/features/analyse-phase/classes.js';
import { mixinPlugin } from '../../../src/features/analyse-phase/mixins.js';
import { applyInheritancePlugin } from '../../../src/features/post-processing/apply-inheritance.js';
import {
  createManifestFromFiles,
  getClassDeclOutputFromManifest,
  createClassDeclOutputForPlugins,
} from '../../../test-helpers/index.js';

const getClassDeclOutput = createClassDeclOutputForPlugins([
  classPlugin(),
  mixinPlugin(),
  applyInheritancePlugin(),
]);

/**
 * @typedef {import('../../../src/_types').CemPluginObject} CemPluginObject
 * @typedef {import('custom-elements-manifest/schema').CustomElement} CustomElement
 */

// @ts-expect-error
describe('applyInheritancePlugin > Superclasses', ({ it }) => {
  it('', async () => {
    const classDeclOutput = getClassDeclOutput({
      fullContent: `static observedAttributes = ['a-a', 'b-b'];`,
    });
    assert.equal(classDeclOutput.superclasses, [{ name: 'a-a' }, { name: 'b-b' }]);
  });
});
// @ts-expect-error
describe('applyInheritancePlugin > Mixins', ({ it }) => {});
// @ts-expect-error
describe('applyInheritancePlugin > External packages', ({ it }) => {});
// @ts-expect-error
describe('applyInheritancePlugin > Attributes | Members | Events', ({ it }) => {});

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
