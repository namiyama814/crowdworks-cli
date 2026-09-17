import { describe, expect, it } from 'vitest';
import { renderProposal } from '../src/domain/proposals.js';
import type { Job, Profile } from '../src/domain/types.js';

describe('renderProposal', () => {
  it('expands local profile and job variables', () => {
    const job: Job = { id: '1', url: 'https://example.test', title: 'API開発', client: { name: 'テスト社' }, competition: {} };
    const profile: Profile = { displayName: '山田', introduction: 'TypeScriptエンジニアです。', achievements: ['CLI開発', 'API設計'] };
    expect(renderProposal('{{clientName}} {{jobTitle}} {{achievements}}', job, profile)).toContain('テスト社 API開発 - CLI開発');
  });
});
