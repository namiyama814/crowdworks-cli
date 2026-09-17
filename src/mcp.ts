#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { CrowdWorksHttpSource } from './adapters/crowdworks-http.js';
import { loadConfig, profile } from './adapters/config-store.js';
import { draftsDirectory, templatesDirectory } from './adapters/paths.js';
import { sortJobs } from './domain/jobs.js';
import { renderProposal } from './domain/proposals.js';
import type { SortField } from './domain/types.js';
import { formatJobDetail, jobSummary } from './presentation/format.js';

const server = new McpServer({ name: 'crowdworks-cli', version: '0.1.0' });
const text = (value: unknown) => ({ content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] });

async function useSource<T>(fn: (source: CrowdWorksHttpSource) => Promise<T>): Promise<T> {
  return fn(new CrowdWorksHttpSource());
}

server.registerTool('list_saved_searches', { description: '保存済みの案件検索条件を一覧表示する' }, async () => text((await loadConfig()).savedSearches));
server.registerTool('search_jobs', {
  description: 'キーワードでCrowdWorksの固定報酬プロジェクトを検索する',
  inputSchema: { query: z.string().min(1), sort: z.enum(['published', 'applicants', 'competition', 'budget', 'client-rating']).optional() }
}, async ({ query, sort = 'published' }) => {
  const jobs = await useSource((source) => source.search({ name: 'mcp', query }));
  return text(sortJobs(jobs, sort as SortField).map(jobSummary));
});
server.registerTool('run_saved_search', {
  description: '保存済み検索条件を実行する', inputSchema: { name: z.string().min(1), sort: z.enum(['published', 'applicants', 'competition', 'budget', 'client-rating']).optional() }
}, async ({ name, sort = 'published' }) => {
  const criteria = (await loadConfig()).savedSearches.find((item) => item.name === name);
  if (!criteria) return { content: [{ type: 'text' as const, text: `保存検索「${name}」がありません。` }], isError: true };
  const jobs = await useSource((source) => source.search(criteria));
  return text(sortJobs(jobs, sort as SortField).map(jobSummary));
});
server.registerTool('get_job', { description: '案件詳細と応募状況を取得する', inputSchema: { url: z.string().url(), include_description: z.boolean().optional() } }, async ({ url, include_description = false }) => text(formatJobDetail(await useSource((source) => source.getJob(url)), include_description)));
server.registerTool('create_proposal', {
  description: '案件用の提案文下書きを生成する。応募送信は行わない。', inputSchema: { url: z.string().url(), template: z.string().default('default') }
}, async ({ url, template }) => {
  const job = await useSource((source) => source.getJob(url));
  const draft = renderProposal(await readFile(path.join(templatesDirectory(), `${template}.md`), 'utf8'), job, await profile());
  const target = path.join(draftsDirectory(), `${job.id}.md`);
  await writeFile(target, draft, 'utf8');
  return text({ draftPath: target, proposal: draft });
});

await server.connect(new StdioServerTransport());
