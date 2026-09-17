import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

function labeledNumber(text: string, label: string): number | undefined {
  const line = text.split('\n').find((item) => item.includes(label));
  return line ? Number(line.replace(/,/g, '').match(/\d+/)?.[0]) : undefined;
}

describe('CrowdWorks detail fixture', () => {
  it('extracts visible competition fields', async () => {
    const fixture = await readFile(new URL('./fixtures/job-detail.txt', import.meta.url), 'utf8');
    expect(labeledNumber(fixture, '応募した人')).toBe(24);
    expect(labeledNumber(fixture, '契約した人')).toBe(0);
    expect(labeledNumber(fixture, '募集人数')).toBe(4);
    expect(labeledNumber(fixture, '気になる！リスト')).toBe(28);
  });
});
