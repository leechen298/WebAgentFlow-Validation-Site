import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

async function readProjectFile(path) {
  return readFile(new URL(path, root), 'utf8');
}

test('user directory keeps name query unchanged while filtering localized display names', async () => {
  const usersPage = await readProjectFile('src/pages/UserDirectoryPage.vue');
  const businessHelpers = await readProjectFile('src/i18n/business.ts');

  assert.match(usersPage, /if \(form\.name\.trim\(\)\) params\.name = form\.name\.trim\(\);/);
  assert.match(usersPage, /router\.replace\(\{ path: '\/users', query: buildParams\(\) \}\)/);
  assert.match(usersPage, /withQuery\('\/api\/users', buildApiParams\(\)\)/);
  assert.match(usersPage, /rawUserNameForExactDisplay\(params\.name, currentLocale\.value\)/);
  assert.match(usersPage, /matchesUserSearch\(user, form\.name, currentLocale\.value\)/);
  assert.doesNotMatch(usersPage, /rawUserNameForDisplay/);
  assert.match(businessHelpers, /matchesLocalizedUserName/);
  assert.match(businessHelpers, /rawUserNameForExactDisplay/);
  assert.doesNotMatch(businessHelpers, /rawUserNameForDisplay/);
});
