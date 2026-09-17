import type { Job, Profile } from './types.js';

export function renderProposal(template: string, job: Job, profile: Profile): string {
  const values: Record<string, string> = {
    clientName: job.client.name,
    jobTitle: job.title,
    introduction: profile.introduction,
    achievements: profile.achievements.map((item) => `- ${item}`).join('\n'),
    displayName: profile.displayName,
    budgetMin: String(job.budgetMin ?? ''),
    budgetMax: String(job.budgetMax ?? '')
  };
  return template.replace(/{{\s*([a-zA-Z]+)\s*}}/g, (_all, key: string) => values[key] ?? '');
}
