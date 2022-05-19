import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function getPackageRootPath(pkgName, {basePath}) {
  // For instance /path/to/monorepo/pkg/src/mainEntry.js
  const resolvedPackageEntry = require.resolve(pkgName, { paths: [basePath]});

  // Given ['','path','to','monorepo','pkg','src'], iterate till /path/to/monorepo/pkg is found
  const parts = path.dirname(resolvedPackageEntry).split(path.sep);
  for (let i=0; i < parts.length; i+=1) {
    const consideredParts = i > 0 ? parts.slice(0,-i) : parts;
    const potentialRoot = consideredParts.join(path.sep);
    try {
      const pkg = JSON.parse(fs.readFileSync(`${potentialRoot}/package.json`, 'utf8'));
      if (pkg.name === pkgName) {
        return potentialRoot;
      }
    } catch {}
  }
}

/**
 * @typedef {import('custom-elements-manifest/schema').Package} Package
 */

/**
 * @param {{
 *  nodeModulesDepth?: number,
 *  basePath?: string,
 * }} [options]
 */
export async function findExternalManifests(options) {
  const { basePath } = options;
  const pkgJsonContent = fs.readFileSync(path.join(basePath, 'package.json'), 'utf8');
  const pkgJson = JSON.parse(pkgJsonContent);
  const externalDeps = Object.keys(pkgJson.dependencies);

  /** @type {Package[]} */
  const cemsToMerge = [];
  externalDeps?.forEach((packageName) => {
    const packageRoot = getPackageRootPath(packageName, {basePath});
    const packageJsonPath = `${packageRoot}${path.sep}package.json`;
    const cemPath = `${packageRoot}${path.sep}custom-elements.json`;

    /** Try to find `custom-elements.json` at `node_modules/specifier/custom-elements.json` */
    if(fs.existsSync(cemPath)) {
      try {
        const cem = JSON.parse(fs.readFileSync(cemPath).toString());
        cemsToMerge.push(cem);
        return;
      } catch(e) {
        throw new Error(`Failed to read custom-elements.json at path "${cemPath}". \n\n${e.stack}`);
      }
    }

    /** See if the `package.json` has a `customElements` field or if it has listed `./customElements` in its export map */
    if(fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
      const cemLocation = packageJson?.customElements || packageJson?.exports?.['./customElements'];

      if(cemLocation) {
        try {
          const cemPath = path.resolve(packageRoot, cemLocation);
          const cem = JSON.parse(fs.readFileSync(cemPath).toString());
          cemsToMerge.push(cem);
        } catch(e) {
          throw new Error(`Failed to read custom-elements.json at path "${cemPath}". \n\n${e.stack}`);
        }
      }
    }
  });

  return cemsToMerge;
}
