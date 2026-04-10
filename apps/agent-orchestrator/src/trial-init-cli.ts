import { createTrialWorkspace } from './trial-init';

async function main(): Promise<void> {
  const result = await createTrialWorkspace();
  console.log(JSON.stringify(result, null, 2));
}

void main();
