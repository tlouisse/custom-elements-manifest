import {
  handleDefaultValue,
  handleExplicitType,
  handleJsDoc,
  handleModifiers,
  handlePrivateMember,
  handleTypeInference,
  handleWellKnownTypes,
} from './handlers.js';

/**
 * @typedef {import('../../../_types').CemFunctionLikeTemplate} CemFunctionLikeTemplate
 * @typedef {import('typescript').PropertyDeclaration} TsPropertyDeclaration
 * @typedef {import('typescript').GetAccessorDeclaration} TsGetAccessorDeclaration
 * @typedef {import('typescript').SetAccessorDeclaration} TsSetAccessorDeclaration
 */

/**
 * @param {TsPropertyDeclaration|TsGetAccessorDeclaration|TsSetAccessorDeclaration} node
 * @returns {CemFunctionLikeTemplate}
 */
export function createField(node) {
  let fieldTemplate = {
    kind: 'field',
    name: node?.name?.getText() || '',
  };

  fieldTemplate = handlePrivateMember(fieldTemplate, node);
  fieldTemplate = handleTypeInference(fieldTemplate, node);
  fieldTemplate = handleExplicitType(fieldTemplate, node);
  fieldTemplate = handleModifiers(fieldTemplate, node);
  fieldTemplate = handleDefaultValue(fieldTemplate, node);
  fieldTemplate = handleWellKnownTypes(fieldTemplate, node);
  fieldTemplate = handleJsDoc(fieldTemplate, node);

  // @ts-expect-error
  return fieldTemplate;
}
