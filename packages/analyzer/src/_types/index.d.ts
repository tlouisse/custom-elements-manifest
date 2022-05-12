import * as TS from 'typescript';
import {
  JavaScriptModule,
  Package,
  FunctionDeclaration as CemFunctionDeclaration,
  ClassMethod as CemClassMethod,
  FunctionLike as CemFunctionLike,
  CustomElementDeclaration as CemCustomElementDeclaration,
  CustomElement as CemCustomElement,
} from 'custom-elements-manifest/schema';

export type CemImport = {
  name: string;
  kind: 'default' | 'aggregate' | 'named';
  importPath: string;
  isBareModuleSpecifier: boolean;
  isTypeOnly: boolean;
};

export type PluginContext = { dev: boolean; imports?: CemImport[], thirdPartyCEMs?: Package[] };
export type CemPlugin = () => CemPluginObject;
export type CemPluginObject = {
  name: string;
  collectPhase?: (opts: { ts: typeof TS; node: TS.Node; context: PluginContext }) => void;
  analyzePhase?: (opts: {
    ts: typeof TS;
    node: TS.Node;
    moduleDoc: JavaScriptModule;
    context: PluginContext;
  }) => void;
  moduleLinkPhase?: (opts: {
    ts: typeof TS;
    moduleDoc: JavaScriptModule;
    context: PluginContext;
  }) => void;
  packageLinkPhase?: (opts: { customElementsManifest: Package; context: PluginContext }) => void;
};

export type CemClassTemplate = Required<
  Omit<
    CemCustomElementDeclaration & CemCustomElement,
    'customElement' | 'summary' | 'source' | 'tagName' | 'demos'
  >
>;

export type CemFunctionLikeTemplate =
  | CemFunctionDeclaration &
      ((CemFunctionLike | CemClassMethod) & {
        kind: 'function' | 'method' | 'field';
        static: boolean;
        privacy: 'public' | 'protected' | 'private';
        resolveInitializer: { module?: string; package?: string };
        attribute: string;
      });
