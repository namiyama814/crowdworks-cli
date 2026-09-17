import { describe, expect, it } from 'vitest';
import { formatJobDetail } from '../src/presentation/format.js';
import type { Job } from '../src/domain/types.js';

const job: Job = { id: '1', url: 'https://example.test/jobs/1', title: '動画編集', description: '完成尺：15分\n報酬：18,000円〜', client: { name: '発注者' }, competition: {} };

describe('formatJobDetail', () => {
  it('shows the job description only when requested', () => {
    expect(formatJobDetail(job)).not.toContain('完成尺');
    expect(formatJobDetail(job, true)).toContain('完成尺：15分');
  });
});
