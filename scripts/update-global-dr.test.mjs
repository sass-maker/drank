import { describe, expect, it } from 'vitest';

import { configuredTargets } from './configured-targets.mjs';

describe('configuredTargets', () => {
  it('prefers explicit targets and removes duplicates', () => {
    expect(configuredTargets(['one.example.com'], ['example.com', 'example.com'])).toEqual([
      'example.com',
    ]);
  });

  it('normalizes configured targets when no explicit list is supplied', () => {
    expect(configuredTargets([' Example.com ', '', 'example.com'])).toEqual(['example.com']);
  });
});
