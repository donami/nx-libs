import { readFileSync } from 'fs';

try {
  const json = JSON.parse(readFileSync(`version.json`).toString());
  // json.version = version;
  console.log('json', json);

  // writeFileSync(`package.json`, JSON.stringify(json, null, 2));
} catch (e) {
  console.error(`Error reading version.json file`);
}
