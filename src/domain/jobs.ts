import type { Competition, Job, SavedSearch, SortField } from './types.js';

export function competitionRate(competition: Competition): number | undefined {
  if (!competition.applicants || !competition.openings || competition.openings <= 0) return undefined;
  return competition.applicants / competition.openings;
}

export function sortJobs(jobs: Job[], sort: SortField): Job[] {
  return [...jobs].sort((a, b) => {
    switch (sort) {
      case 'applicants': return (a.competition.applicants ?? Number.MAX_SAFE_INTEGER) - (b.competition.applicants ?? Number.MAX_SAFE_INTEGER);
      case 'competition': return (competitionRate(a.competition) ?? Number.MAX_SAFE_INTEGER) - (competitionRate(b.competition) ?? Number.MAX_SAFE_INTEGER);
      case 'budget': return (b.budgetMax ?? b.budgetMin ?? 0) - (a.budgetMax ?? a.budgetMin ?? 0);
      case 'client-rating': return (b.client.rating ?? 0) - (a.client.rating ?? 0);
      case 'published': return Date.parse(b.publishedAt ?? '1970-01-01') - Date.parse(a.publishedAt ?? '1970-01-01');
    }
  });
}

export function matchesSavedSearch(job: Job, criteria: SavedSearch): boolean {
  const haystack = `${job.title}\n${job.description ?? ''}`.toLowerCase();
  if (!haystack.includes(criteria.query.toLowerCase())) return false;
  if (criteria.exclude?.some((term) => haystack.includes(term.toLowerCase()))) return false;
  if (criteria.minBudget && (job.budgetMax ?? job.budgetMin ?? 0) < criteria.minBudget) return false;
  if (criteria.category && job.category !== criteria.category) return false;
  if (criteria.minClientRating && (job.client.rating ?? 0) < criteria.minClientRating) return false;
  if (criteria.requireVerifiedClient && !job.client.verified) return false;
  if (criteria.minClientJobsPosted && (job.client.jobsPosted ?? 0) < criteria.minClientJobsPosted) return false;
  if (criteria.publishedWithinDays && job.publishedAt) {
    const age = Date.now() - Date.parse(job.publishedAt);
    if (age > criteria.publishedWithinDays * 86_400_000) return false;
  }
  return true;
}
