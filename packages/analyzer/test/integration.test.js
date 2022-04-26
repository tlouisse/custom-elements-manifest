import { describe } from '@asdgf/cli';
import assert from 'assert';
import path from 'path';
import { pathToFileURL } from 'url';
import fs from 'fs';
import globby from 'globby';
import ts from 'typescript';

import { create } from '../src/create.js';

const fixturesDir = path.join(process.cwd(), 'fixtures');
let testCases = fs.readdirSync(fixturesDir);

const runSingle = testCases.find(_case => _case.startsWith('+'));
if (runSingle) {
  testCases = [runSingle];
}

const stripRegex = /\.?\/?fixtures\/(.*?)\//;
function stripFixturePaths(cem, testCase) {
  if (typeof cem === 'object') {
    Object.keys(cem).forEach(key => {
      cem[key] = stripFixturePaths(cem[key], testCase);
    });
  }
  if (Array.isArray(cem)) {
    cem.forEach(key => {
      cem[key] = stripFixturePaths(cem[key], testCase);
    });
  }
  if (typeof cem === 'string') {
    cem = cem.replace(stripRegex, '');
  }
  return cem;
}

describe('@CEM/A', ({it}) => {
  testCases.forEach(testCase => {
    if(testCase.startsWith('-')) {
      it.skip(testCase, () =>{});
    } else {
      it(testCase, async () => {
        const fixturePath = path.join(fixturesDir, `${testCase}/fixture/custom-elements.json`);
        const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
    
        const packagePath = path.join(fixturesDir, `${testCase}/package`);
        const packagePathPosix = packagePath.split(path.sep).join(path.posix.sep);
        const outputPath = path.join(fixturesDir, `${testCase}/output.json`);
    
        const globs = await globby(packagePathPosix);
        const modules = globs
          .filter(path => !path.includes('custom-elements-manifest.config.js'))
          .map(glob => {
            const relativeModulePath = `.${path.sep}${path.relative(process.cwd(), glob)}`;
            const source = fs.readFileSync(relativeModulePath).toString();
    
            return ts.createSourceFile(
              relativeModulePath,
              source,
              ts.ScriptTarget.ES2015,
              true,
            );
          });
    
        let plugins = [];
        const manifestPathFileURL = pathToFileURL(`${packagePath}/custom-elements-manifest.config.js`).href;
        try {
          const config = await import(manifestPathFileURL);
          plugins = [...config.default.plugins];
        } catch {}

        const result = create({modules, plugins});
        stripFixturePaths(result, testCase); // adjusts result
    
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
        assert.deepStrictEqual(result, fixture);
      });
    }
  });
});
