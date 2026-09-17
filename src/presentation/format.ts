import type { Job } from '../domain/types.js';
import { competitionRate } from '../domain/jobs.js';

export function jobSummary(job: Job): Record<string, string> {
  const rate = competitionRate(job.competition);
  return {
    id: job.id,
    title: job.title,
    budget: [job.budgetMin, job.budgetMax].filter((value) => value !== undefined).join('〜') + (job.budgetMin ? '円' : ''),
    applicants: String(job.competition.applicants ?? '-'),
    competition: rate === undefined ? '-' : `${rate.toFixed(1)}倍`,
    published: job.publishedAt ?? '-',
    client: job.client.name,
    url: job.url
  };
}

export function formatJobDetail(job: Job, includeDescription = false): string {
  const rate = competitionRate(job.competition);
  return [
    `案件: ${job.title}`,
    `URL: ${job.url}`,
    `報酬: ${job.budgetMin ?? '-'}〜${job.budgetMax ?? '-'}円`,
    `発注者: ${job.client.name} / 評価 ${job.client.rating ?? '-'} / 本人確認 ${job.client.verified ? '済み' : '未確認'}`,
    `応募状況: 応募 ${job.competition.applicants ?? '-'}人 / 契約 ${job.competition.contracted ?? '-'}人 / 募集 ${job.competition.openings ?? '-'}人 / 気になる ${job.competition.interested ?? '-'}人`,
    `競争率: ${rate === undefined ? '-' : `${rate.toFixed(1)}倍`}`,
    ...(includeDescription ? [`\n仕事の詳細:\n${job.description ?? '詳細を取得できませんでした。'}`] : [])
  ].join('\n');
}
