import { readFileSync, writeFileSync } from 'fs';
import * as semver from 'semver';

try {
  const json = JSON.parse(readFileSync(`version.json`).toString());
  console.log(`Last version is ${json.version}`);

  const version = json.version;
  const result = semver.inc(version, 'patch');
  console.log(`New version will be: ${result}`);

  json.version = result;

  writeFileSync(`version.json`, JSON.stringify(json, null, 2));
} catch (e) {
  console.error(`Error reading version.json file`);
}
