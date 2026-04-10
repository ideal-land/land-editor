const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { createTrialWorkspace } = require('./.tmp-dist/apps/agent-orchestrator/src/trial-init.js');

test('createTrialWorkspace should create required folders and env file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'land-trial-init-'));

  const result = await createTrialWorkspace({
    rootDir: root,
    envFileName: '.env.trial.auto'
  });

  const checks = await Promise.all([
    fs.stat(result.assetsDir),
    fs.stat(result.outputDir),
    fs.stat(result.runtimePreviewDir),
    fs.stat(result.envFile)
  ]);

  assert.equal(checks[0].isDirectory(), true);
  assert.equal(checks[1].isDirectory(), true);
  assert.equal(checks[2].isDirectory(), true);
  assert.equal(checks[3].isFile(), true);

  const envContent = await fs.readFile(result.envFile, 'utf8');
  assert.match(envContent, /ASSET_ROOT=/);
  assert.match(envContent, /RUNTIME_PREVIEW_DIR=/);
});
