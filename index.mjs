// Keeps a Mac from sleeping while it is plugged in, so it is always there to run
// issues. -s holds off system sleep on power only, so on battery the Mac sleeps
// as usual, and the display still sleeps. -w ends it with the worker, so a crash
// or a restart can never leave the Mac held awake.

import { spawn } from 'node:child_process';

// The worker loads extensions again when the shared packages change, and a new
// version is a new module. The running caffeinate must outlive both, or turning
// this off would leave it holding the Mac awake.
const shared = globalThis[Symbol.for('divernote-caffeinate')] ??= {};

export function createCaffeinate({ state = {}, platform = process.platform, pid = process.pid, execute = spawn, report = error => console.error(`divernote-caffeinate: ${error.message}`) } = {}) {
  let reported = false;
  return ({ enabled }) => {
    if (platform !== 'darwin') return;
    if (!enabled) {
      state.child?.kill();
      state.child = undefined;
      return;
    }
    if (state.child) return;
    const started = execute('/usr/bin/caffeinate', ['-s', '-w', String(pid)], { stdio: 'ignore' });
    state.child = started;
    // Gone while still on: the next tick starts another.
    const gone = () => { if (state.child === started) state.child = undefined; };
    started.once('exit', gone);
    started.once('error', error => {
      gone();
      if (!reported) report(error);
      reported = true;
    });
    started.unref?.();
  };
}

export default divernote => divernote.on('worker-tick', createCaffeinate({ state: shared }));
