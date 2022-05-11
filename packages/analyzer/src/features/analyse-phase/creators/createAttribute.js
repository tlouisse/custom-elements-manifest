/**
 * @typedef {import('typescript').Node} Node
 * @typedef {import('typescript').StringLiteral} StringLiteral
 * @typedef {import('custom-elements-manifest/schema').Attribute} CemAttribute
 * @typedef {import('custom-elements-manifest/schema').ClassField} CemClassField
 */

/**
 * @param {StringLiteral} node
 */
export function createAttribute(node) {
  /** @type {CemAttribute} */
  const attributeTemplate = {
    name: node?.text || '',
  };
  return attributeTemplate;
}

/**
 * @param {CemClassField} field
 */
export function createAttributeFromField(field) {
  /** @type {Partial<CemAttribute & CemClassField>} */
  const attribute = {
    ...field,
    fieldName: field.name,
  };

  /**
   * Delete the following properties because they don't exist on a attributeDoc
   */
  delete attribute.kind;
  delete attribute.static;
  delete attribute.privacy;
  // @ts-expect-error
  delete attribute.reflects;

  return /** @type {CemAttribute} */ (attribute);
}
