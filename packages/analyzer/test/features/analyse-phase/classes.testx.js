// @ts-ignore
import { describe } from '@asdgf/cli';
import * as assert from 'uvu/assert';
import { classPlugin } from '../../../src/features/analyse-phase/classes.js';
import {
  createManifestFromFiles,
  createClassDeclOutputForPlugins,
} from '../../../test-helpers/index.js';

/**
 * @typedef {import('../../../src/_types').CemPluginObject} CemPluginObject
 * @typedef {import('custom-elements-manifest/schema').CustomElement} CustomElement
 */

const getClassDeclOutputForClassPlugin = createClassDeclOutputForPlugins([classPlugin()]);

// @ts-expect-error
describe('classPlugin', ({ it }) => {
  it('adds module to CEM', async () => {
    const content = `
    class X extends HTMLElement {}
    class Y extends X {}
    `;
    const cem = createManifestFromFiles([{ content, path: 'test.js' }], {
      plugins: [classPlugin()],
      omitDefaultPlugins: true,
    });
    assert.equal(cem.modules?.[0].declarations?.[0].kind, 'class');
    assert.equal(cem.modules?.[0].declarations?.[0].name, 'X');

    assert.equal(cem.modules?.[0].declarations?.[1].kind, 'class');
    assert.equal(cem.modules?.[0].declarations?.[1].name, 'Y');
  });
});

// @ts-expect-error
describe('classPlugin > Name', ({ it }) => {
  it('detects name', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      fullContent: `class X extends HTMLElement {}`,
    });
    assert.equal(classDeclOutput.name, 'X');
  });

  // TODO: implement in code
  it.skip('detects exported name (for module-link phase)', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      fullContent: `
      class X extends HTMLElement {}

      export { X as Y };
      `,
    });
    assert.equal(classDeclOutput.name, 'Y');

    const classDeclOutput2 = getClassDeclOutputForClassPlugin({
      fullContent: `
      class X extends HTMLElement {}

      export const Y = X;
      `,
    });
    assert.equal(classDeclOutput2.name, 'Y');
  });
});

// TODO: implement in code
// @ts-expect-error
describe.skip('classPlugin > Description', ({ it }) => {
  it('detects description via jsdoc text', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      fullContent: `
      /**
       * This is a description
       */
      class X extends HTMLElement {}
      `,
    });
    assert.equal(classDeclOutput.name, 'This is a description');
  });

  it('detects description via jsdoc "@summary" param', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      fullContent: `
      /**
       * @public
       * @summary This is a description
       */
      class X extends HTMLElement {}
      `,
    });
    assert.equal(classDeclOutput.name, 'This is a description');
  });
});

// @ts-expect-error
describe('classPlugin > Attributes', ({ it }) => {
  it('supports "static observedAttributes"', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      bodyFragment: `static observedAttributes = ['a-a', 'b-b'];`,
    });
    assert.equal(classDeclOutput.attributes, [{ name: 'a-a' }, { name: 'b-b' }]);
  });

  it('supports "static get observedAttributes()"', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      bodyFragment: `
        static get observedAttributes() {
          return ['c-c', 'd-d'];
        }`,
    });
    assert.equal(classDeclOutput.attributes, [{ name: 'c-c' }, { name: 'd-d' }]);
  });

  it('supports jsdoc @attr tags', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      bodyFragment: `
        /**
         * @attr my-field
         */
        myField;
        `,
    });
    assert.equal(classDeclOutput.attributes, [{ name: 'my-field', fieldName: 'myField' }]);
  });

  it.skip('supports jsdoc @attribute tags', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      bodyFragment: `
        /**
         * @attribute my-field
         */
        myField;
        `,
    });
    assert.equal(classDeclOutput.attributes, [{ name: 'my-field', fieldName: 'myField' }]);
  });

  it('detects connected fieldNames', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      bodyFragment: `
        /**
         * @attr my-field
         */
        myField;
        `,
    });
    assert.equal(classDeclOutput.attributes, [{ name: 'my-field', fieldName: 'myField' }]);
  });

  it.skip('detects description', async () => {});
  it.skip('detects summary', async () => {});
  it.skip('detects inheritedFrom', async () => {});
  it.skip('detects default value', async () => {});
});

// @ts-expect-error
describe.skip('classPlugin > Members', ({ it }) => {});

// @ts-expect-error
describe.skip('classPlugin > Events', ({ it }) => {
  it('supports "this.dispatchEvent"', async () => {});

  it('detects description', async () => {});
  it('detects summary', async () => {});
  it('detects inheritedFrom', async () => {});
  it('detects type', async () => {});
});

// @ts-expect-error
describe.skip('classPlugin > Slots', ({ it }) => {
  it('supports jsdoc "@slot" tags', async () => {});
  it('detects description', async () => {});
  it('detects summary', async () => {});
});

// @ts-expect-error
describe.skip('classPlugin > CssPart', ({ it }) => {
  it('supports jsdoc "@csspart" tags', async () => {});

  it('detects description', async () => {});
  it('detects summary', async () => {});
});

// @ts-expect-error
describe.skip('classPlugin > CssCustomProperty', ({ it }) => {
  it('supports jsdoc "@csspart" tags', async () => {});

  it('detects description', async () => {});
  it('detects summary', async () => {});
  it('detects default value', async () => {});
});

// @ts-expect-error
describe('classPlugin > Inheritance > Superclass', ({ it }) => {
  it('adds property "superclass" of type {name:string; module:string}', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      fullContent: `
          import {BatchingElement} from 'package/BatchingElement';

          class X extends BatchingElement {}`,
      modulePath: 'my/module.js',
    });
    assert.equal(classDeclOutput.superclass, {
      name: 'BatchingElement',
      module: 'my/module.js',
    });
  });

  it('adds HTMLElement as superclass', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      fullContent: `class X extends HTMLElement {}`,
      modulePath: 'my/module.js',
    });
    assert.equal(classDeclOutput.superclass, { name: 'HTMLElement' });
  });

  it('adds superclass that is wrapped in mixin(s)', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      fullContent: `
          import {MixA,MixB} from 'package-c';

          class X extends MixA(MixB(HTMLElement)) {}`,
      modulePath: 'my/module.js',
    });
    assert.equal(classDeclOutput.superclass, {
      name: 'HTMLElement',
    });
  });

  it('adds no property without superclass', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      fullContent: `class X {}`,
      modulePath: 'my/module.js',
    });
    assert.equal(classDeclOutput.superclass, undefined);
  });
});

// @ts-expect-error
describe('classPlugin > Inheritance > Mixins', ({ it }) => {
  it('adds property "mixins" of type {"name":string;"module":string}[]', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      fullContent: `
          import {MixA,MixB} from 'package-c';

          class X extends MixA(MixB(HTMLElement)) {}`,
      modulePath: 'my/module.js',
    });
    assert.equal(classDeclOutput.mixins, [
      {
        name: 'MixA',
        module: 'my/module.js',
      },
      {
        name: 'MixB',
        module: 'my/module.js',
      },
    ]);
  });

  it('does not detect mixins applied internally by mixins (handled in other plugin)', async () => {
    const classDeclOutput = getClassDeclOutputForClassPlugin({
      fullContent: `
          import {MixA} from 'package-c';

          const MixWithMix = superclass => MixA(superclass)

          class X extends MixWithMix(HTMLElement) {}`,
      modulePath: 'my/module.js',
    });
    assert.equal(classDeclOutput.mixins, [
      {
        name: 'MixWithMix',
        module: 'my/module.js',
      },
    ]);
  });
});
