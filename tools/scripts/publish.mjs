/**
 * This is a minimal script to publish your package to "npm".
 * This is meant to be used as-is or customize as you see fit.
 *
 * This script is executed on "dist/path/to/library" as "cwd" by default.
 *
 * You might need to authenticate with NPM before running this script.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, copyFileSync } from 'fs';

import devkit from '@nx/devkit';
const { readCachedProjectGraph } = devkit;

function invariant(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

// Executing publish script: node path/to/publish.mjs {name} --version {version} --tag {tag}
// Default "tag" to "next" so we won't publish the "latest" tag by accident.
// const [, , name, version, tag = 'next'] = process.argv;
const [, , name] = process.argv;

const graph = readCachedProjectGraph();
const project = graph.nodes[name];

invariant(
  project,
  `Could not find project "${name}" in the workspace. Is the project.json configured correctly?`
);

const outputPath = project.data?.targets?.build?.options?.outputPath;
invariant(
  outputPath,
  `Could not find "build.options.outputPath" of project "${name}". Is project.json configured  correctly?`
);

let newVersion = '';
try {
  const json = JSON.parse(readFileSync(`version.json`).toString());
  newVersion = json.version;

  // A simple SemVer validation to validate the version
  const validVersion = /^\d+\.\d+\.\d+(-\w+\.\d+)?/;
  invariant(
    newVersion && validVersion.test(newVersion),
    `No version provided or version did not match Semantic Versioning, expected: #.#.#-tag.# or #.#.#, got ${newVersion}.`
  );
} catch (error) {
  console.error(`Could not determine which version to publish!`);
}

// try {
//   const file = readFileSync(`.npmrc`).toString();
//   console.log('xxx', file);
//   copyFileSync('.npmrc', `${outputPath}/.npmrc`);

//   const file2 = readFileSync(`.npmrc`).toString();
//   console.log('xxx2', file2);
// } catch (error) {
//   console.log(`Unable to read .npmrc`, error);
// }

process.chdir(outputPath);

// Updating the version in "package.json" before publishing
try {
  const json = JSON.parse(readFileSync(`package.json`).toString());
  json.version = newVersion;

  if (json.dependencies) {
    Object.entries(json.dependencies).forEach(([key, value]) => {
      if (value === '*') {
        json.dependencies[key] = `^${newVersion}`;
      }
    });
  }

  writeFileSync(`package.json`, JSON.stringify(json, null, 2));
} catch (e) {
  console.error(`Error reading package.json file from library build output.`);
}

// Execute "npm publish" to publish
execSync(`npm publish`);
