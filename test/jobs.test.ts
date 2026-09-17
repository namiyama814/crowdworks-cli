import { describe, expect, it } from 'vitest';
import { competitionRate, matchesSavedSearch, sortJobs } from '../src/domain/jobs.js';
import type { Job } from '../src/domain/types.js';

const jobs: Job[] = [
  { id: '1', url: 'https://crowdworks.jp/public/jobs/1', title: 'TypeScript 開発', category: '開発', budgetMax: 50000, publishedAt: '2026-09-16', client: { name: 'A', rating: 4.8, verified: true, jobsPosted: 20 }, competition: { applicants: 10, openings: 2 } },
  { id: '2', url: 'https://crowdworks.jp/public/jobs/2', title: 'TypeScript 保守', category: '開発', budgetMax: 30000, publishedAt: '2026-09-17', client: { name: 'B', rating: 4.2, verified: true, jobsPosted: 2 }, competition: { applicants: 2, openings: 2 } }
];

describe('job utilities', () => {
  it('calculates competition rate only when openings are available', () => {
    expect(competitionRate(jobs[0].competition)).toBe(5);
    expect(competitionRate({ applicants: 3 })).toBeUndefined();
  });
  it('filters jobs using saved-search criteria', () => {
    expect(matchesSavedSearch(jobs[0], { name: 'good', query: 'typescript', minBudget: 40000, requireVerifiedClient: true, minClientRating: 4.5 })).toBe(true);
    expect(matchesSavedSearch(jobs[1], { name: 'good', query: 'typescript', minBudget: 40000 })).toBe(false);
  });
  it('sorts lower competition first', () => expect(sortJobs(jobs, 'competition').map((job) => job.id)).toEqual(['2', '1']));
});
