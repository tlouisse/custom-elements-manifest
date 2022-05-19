import { describe } from '@asdgf/cli';
import assert from 'assert';
import path from 'path';
import fs from 'fs';
import { cli } from '../cli.js';

/**
 * Given a mono repo, creates symlinks
 */
 async function symLinkMonoPackages({rootPkgJson, cwd}) {
  for (const p of rootPkgJson.workspaces) {
    const pkgJson = JSON.parse(fs.readFileSync(`${cwd}/${p}/package.json`));
    const [source, destination] = [`${cwd}/${p}`, `${cwd}/node_modules/${pkgJson.name}`];
    if (!fs.existsSync(destination)) {
      const pkgNameParts = pkgJson.name.split('/');
      if (pkgNameParts.length > 1) {
        const scopePath = `${cwd}/node_modules/${pkgNameParts[0]}`;
        if (!fs.existsSync(scopePath)) {
          await fs.promises.mkdir(scopePath);
        }
      }
      await fs.promises.symlink(source, destination);
    }
  }
}

const posixify = (filePath) => filePath.split(path.sep).join(path.posix.sep);


const fixturesDir = path.join(process.cwd(), 'fixtures');

let groups = fs.readdirSync(fixturesDir);
const singleGroup = groups.find((_case) => _case.startsWith('+'));
if (singleGroup) {
  groups = [singleGroup];
}

for (const group of groups) {
  for (const test of fs.readdirSync(path.join(fixturesDir, group))) {
    if (test.startsWith('+')) {
      groups = [group];
      break;
    }
  }
}

let testCases = [];
describe('@CEM/A', ({ it }) => {
  for (const group of groups) {
    testCases = fs
      .readdirSync(path.join(fixturesDir, group))
      .map((test) => ({ group, test, relPath: path.join(group, test) }));
    const runSingle = testCases.find((_case) => _case.test.startsWith('+'));
    if (runSingle) {
      testCases = [runSingle];
    }

    describe(group, ({ it }) => {
      testCases.forEach((testCase) => {
        if (testCase.test.startsWith('-')) {
          it.skip(`Testcase ${testCase.test}`, () => {});
        } else {
          it(`Testcase ${testCase.test}`, async () => {
            const fixturePath = path.join(
              fixturesDir,
              `${testCase.relPath}/fixture/custom-elements.json`,
            );
            const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

            let packagePath = posixify(path.join(fixturesDir, `${testCase.relPath}/package`));
            // Handle monorepo
            if (!fs.existsSync(packagePath)) {
              const monoRoot = posixify(path.join(fixturesDir, `${testCase.relPath}/monorepo`));
              const rootPkgJson = JSON.parse(fs.readFileSync(`${monoRoot}/package.json`));
              packagePath = posixify(path.join(monoRoot, rootPkgJson.analyzeTarget));
              await symLinkMonoPackages({ rootPkgJson, cwd: monoRoot });
            }

            const result = await cli({
              argv: ['analyze'],
              cwd: packagePath,
              noWrite: true
            });

            const outputPath = path.join(fixturesDir, `${testCase.relPath}/output.json`);
            fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
            assert.deepEqual(result, fixture);
          });
        }
      });
    });
  }
});
