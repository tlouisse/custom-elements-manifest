import ts from 'typescript';
import { has } from '../../../utils/index.js';
import { handleModifiers, handleJsDoc } from './handlers.js';

/**
 * @typedef {import('../../../_types').CemFunctionLikeTemplate} CemFunctionLikeTemplate
 * @typedef {import('typescript').MethodDeclaration} TsMethodDeclaration
 * @typedef {import('typescript').FunctionDeclaration} TsFunctionDeclaration
 * @typedef {import('custom-elements-manifest/schema').Parameter} CemParameter
 */

/**
 * Creates a functionLike, does _not_ handle arrow functions
 * @param {TsMethodDeclaration} node
 */
export function createFunctionLike(node) {
  /** @type {CemFunctionLikeTemplate} */
  let functionLikeTemplate = {
    // @ts-expect-error
    kind: '',
    name: node?.name?.getText() || '',
  };

  functionLikeTemplate = handleKind(functionLikeTemplate, node);
  functionLikeTemplate = handleModifiers(functionLikeTemplate, node);
  functionLikeTemplate = handleParametersAndReturnType(functionLikeTemplate, node);
  functionLikeTemplate = handleJsDoc(functionLikeTemplate, node);

  return functionLikeTemplate;
}

/**
 * Determine the kind of the functionLike, either `'function'` or `'method'`
 * @param {CemFunctionLikeTemplate} functionLike
 * @param {TsMethodDeclaration|TsFunctionDeclaration} node
 */
export function handleKind(functionLike, node) {
  switch (node.kind) {
    case ts.SyntaxKind.FunctionDeclaration:
      functionLike.kind = 'function';
      break;
    case ts.SyntaxKind.MethodDeclaration:
      // @ts-expect-error
      functionLike.kind = 'method';
      break;
  }
  return functionLike;
}

/**
 * Handle a functionLikes return type and parameters/parameter types
 * @param {CemFunctionLikeTemplate} functionLike
 * @param {TsMethodDeclaration|TsFunctionDeclaration} node
 */
export function handleParametersAndReturnType(functionLike, node) {
  if (node?.type) {
    functionLike.return = {
      type: { text: node.type.getText() },
    };
  }

  /**@type {CemParameter[]} */
  const parameters = [];
  node?.parameters?.forEach((param) => {
    /**@type {CemParameter} */
    const parameter = {
      name: param.name.getText(),
    };

    if (param?.initializer) {
      parameter.default = param.initializer.getText();
    }

    if (param?.questionToken) {
      parameter.optional = true;
    }

    if (param?.type) {
      parameter.type = { text: param.type.getText() };
    }

    parameters.push(parameter);
  });

  if (has(parameters)) {
    functionLike.parameters = parameters;
  }

  return functionLike;
}
