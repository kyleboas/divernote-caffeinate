import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import { createCaffeinate } from './index.mjs';

function mac(options = {}) {
  const children = [];
  const execute = (command, args) => {
    const child = Object.assign(new EventEmitter(), { command, args, killed: 0, kill() { this.killed += 1; } });
    children.push(child);
    return child;
  };
  return { children, tick: createCaffeinate({ platform: 'darwin', pid: 42, execute, ...options }) };
}

test('turned on, one caffeinate runs, tied to the worker; turned off, it stops', () => {
  const { children, tick } = mac();
  tick({ enabled: false });
  assert.equal(children.length, 0);
  tick({ enabled: true });
  tick({ enabled: true });
  assert.equal(children.length, 1);
  assert.equal(children[0].command, '/usr/bin/caffeinate');
  assert.deepEqual(children[0].args, ['-s', '-w', '42']);
  tick({ enabled: false });
  tick({ enabled: false });
  assert.equal(children[0].killed, 1);
  tick({ enabled: true });
  assert.equal(children.length, 2);
});

test('a caffeinate that ended while still on is replaced on the next tick', () => {
  const { children, tick } = mac();
  tick({ enabled: true });
  children[0].emit('exit', 1);
  tick({ enabled: true });
  assert.equal(children.length, 2);
});

test('one that cannot start is reported once and tried again', () => {
  const errors = [];
  const { children, tick } = mac({ report: error => errors.push(error.message) });
  tick({ enabled: true });
  children[0].emit('error', new Error('missing'));
  tick({ enabled: true });
  children[1].emit('error', new Error('missing'));
  assert.equal(children.length, 2);
  assert.deepEqual(errors, ['missing']);
});

test('loaded again, it keeps track of the caffeinate already running', () => {
  const state = {};
  const { children, tick } = mac({ state });
  tick({ enabled: true });
  const again = createCaffeinate({ state, platform: 'darwin', execute() { throw new Error('a second caffeinate'); } });
  again({ enabled: true });
  assert.equal(children.length, 1);
  again({ enabled: false });
  assert.equal(children[0].killed, 1);
});

test('it does nothing off macOS', () => {
  const { children, tick } = mac({ platform: 'linux' });
  tick({ enabled: true });
  tick({ enabled: false });
  assert.equal(children.length, 0);
});
