import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveKeyboardShortcut } from './keyboard.js';

test('Spacebar maps to TOGGLE_PLAY', () => {
  assert.deepEqual(resolveKeyboardShortcut(' ', false, false), { type: 'TOGGLE_PLAY' });
  assert.deepEqual(resolveKeyboardShortcut('Spacebar', false, false), { type: 'TOGGLE_PLAY' });
});

test('R / r maps to RESET', () => {
  assert.deepEqual(resolveKeyboardShortcut('r', false, false), { type: 'RESET' });
  assert.deepEqual(resolveKeyboardShortcut('R', false, false), { type: 'RESET' });
});

test('Number keys 1-8 map to SET_LEVEL with correct 0-indexed level', () => {
  assert.deepEqual(resolveKeyboardShortcut('1', false, false), { type: 'SET_LEVEL', levelIndex: 0 });
  assert.deepEqual(resolveKeyboardShortcut('2', false, false), { type: 'SET_LEVEL', levelIndex: 1 });
  assert.deepEqual(resolveKeyboardShortcut('3', false, false), { type: 'SET_LEVEL', levelIndex: 2 });
  assert.deepEqual(resolveKeyboardShortcut('4', false, false), { type: 'SET_LEVEL', levelIndex: 3 });
  assert.deepEqual(resolveKeyboardShortcut('5', false, false), { type: 'SET_LEVEL', levelIndex: 4 });
  assert.deepEqual(resolveKeyboardShortcut('6', false, false), { type: 'SET_LEVEL', levelIndex: 5 });
  assert.deepEqual(resolveKeyboardShortcut('7', false, false), { type: 'SET_LEVEL', levelIndex: 6 });
  assert.deepEqual(resolveKeyboardShortcut('8', false, false), { type: 'SET_LEVEL', levelIndex: 7 });
});

test('Unrelated keys return null', () => {
  assert.equal(resolveKeyboardShortcut('9', false, false), null);
  assert.equal(resolveKeyboardShortcut('0', false, false), null);
  assert.equal(resolveKeyboardShortcut('a', false, false), null);
  assert.equal(resolveKeyboardShortcut('Enter', false, false), null);
});

test('Ignores shortcuts when input element is focused', () => {
  assert.equal(resolveKeyboardShortcut(' ', true, false), null);
  assert.equal(resolveKeyboardShortcut('r', true, false), null);
  assert.equal(resolveKeyboardShortcut('1', true, false), null);
});

test('Ignores shortcuts when modal is open', () => {
  assert.equal(resolveKeyboardShortcut(' ', false, true), null);
  assert.equal(resolveKeyboardShortcut('r', false, true), null);
  assert.equal(resolveKeyboardShortcut('1', false, true), null);
});
