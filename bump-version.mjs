import { readFileSync } from 'fs';
import * as semver from 'semver';

try {
  const json = JSON.parse(readFileSync(`version.json`).toString());
  // json.version = version;
  console.log('json', json);

  const version = json.version;
  const result = semver.inc(version, 'patch');
  console.log('result', result);

  // writeFileSync(`package.json`, JSON.stringify(json, null, 2));
} catch (e) {
  console.error(`Error reading version.json file`);
}
