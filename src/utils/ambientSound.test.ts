import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldPlayAmbient } from './ambientSound.js';

test('shouldPlayAmbient returns true only when soundType is selected and session is running', () => {
  assert.equal(shouldPlayAmbient('rain', 'running'), true);
  assert.equal(shouldPlayAmbient('forest', 'running'), true);
  assert.equal(shouldPlayAmbient('ocean', 'running'), true);
});

test('shouldPlayAmbient returns false when soundType is none regardless of session status', () => {
  assert.equal(shouldPlayAmbient('none', 'running'), false);
  assert.equal(shouldPlayAmbient('none', 'idle'), false);
  assert.equal(shouldPlayAmbient('none', 'paused'), false);
  assert.equal(shouldPlayAmbient('none', 'completed'), false);
});

test('shouldPlayAmbient returns false when session is idle, paused, or completed', () => {
  assert.equal(shouldPlayAmbient('rain', 'idle'), false);
  assert.equal(shouldPlayAmbient('rain', 'paused'), false);
  assert.equal(shouldPlayAmbient('rain', 'completed'), false);
  assert.equal(shouldPlayAmbient('forest', 'paused'), false);
});
