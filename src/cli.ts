#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Command } from 'commander';
import { CrowdWorksHttpSource } from './adapters/crowdworks-http.js';
import { addSavedSearch, initializeConfig, loadConfig, profile } from './adapters/config-store.js';
import { draftsDirectory, templatesDirectory } from './adapters/paths.js';
import { sortJobs } from './domain/jobs.js';
import { renderProposal } from './domain/proposals.js';
import type { SavedSearch, SortField } from './domain/types.js';
import { formatJobDetail, jobSummary } from './presentation/format.js';

const program = new Command().name('cw').description('CrowdWorksの案件検索と応募準備を行うローカルCLI').version('0.1.0');

function source(): CrowdWorksHttpSource { return new CrowdWorksHttpSource(); }

async function withSource<T>(action: (client: CrowdWorksHttpSource) => Promise<T>): Promise<T> {
  const client = source();
  return action(client);
}

function asNumber(value: string | undefined): number | undefined { return value === undefined ? undefined : Number(value); }

async function resolveSearch(name: string): Promise<SavedSearch> {
  const config = await loadConfig();
  const search = config.savedSearches.find((item) => item.name === name);
  if (!search) throw new Error(`保存検索「${name}」がありません。`);
  return search;
}

program.command('init').description('ローカル設定と提案文テンプレートを初期化する').action(async () => {
  await initializeConfig();
  console.log('初期化しました。プロフィールは設定ファイルを編集して入力してください。');
});

program.command('search [query]')
  .description('案件を検索する。保存検索名または --query を指定する')
  .option('--query <keyword>')
  .option('--sort <field>', 'published|applicants|competition|budget|client-rating', 'published')
  .action(async (name: string | undefined, options: { query?: string; sort: SortField }) => {
    const criteria = options.query ? { name: 'temporary', query: options.query } : await resolveSearch(name ?? '');
    const jobs = await withSource((client) => client.search(criteria));
    console.table(sortJobs(jobs, options.sort).map(jobSummary));
  });

const saved = program.command('saved-search').description('保存検索を管理する');
saved.command('list').action(async () => console.table((await loadConfig()).savedSearches));
saved.command('add <name> <query>')
  .option('--exclude <words...>')
  .option('--min-budget <amount>')
  .option('--category <category>')
  .option('--days <days>')
  .option('--min-rating <rating>')
  .option('--verified')
  .option('--min-jobs <count>')
  .action(async (name: string, query: string, options: Record<string, string | boolean | undefined>) => {
    await addSavedSearch({ name, query, exclude: options.exclude as string[] | undefined, minBudget: asNumber(options.minBudget as string), category: options.category as string, publishedWithinDays: asNumber(options.days as string), minClientRating: asNumber(options.minRating as string), requireVerifiedClient: options.verified as boolean, minClientJobsPosted: asNumber(options.minJobs as string) });
    console.log(`保存検索「${name}」を追加しました。`);
  });
saved.command('run <name>').option('--sort <field>', undefined, 'published').action(async (name: string, options: { sort: SortField }) => {
  const criteria = await resolveSearch(name);
  const jobs = await withSource((client) => client.search(criteria));
  console.table(sortJobs(jobs, options.sort).map(jobSummary));
});

const jobCommand = program.command('job').description('案件を表示する');
jobCommand.command('show <url>').description('案件詳細と応募状況を表示する').action(async (url: string) => {
  const job = await withSource((client) => client.getJob(url));
  console.log(formatJobDetail(job));
});

const proposal = program.command('proposal').description('提案文を作成する');
proposal.command('create <url>')
  .option('--template <name>', 'テンプレート名', 'default')
  .action(async (url: string, options: { template: string }) => {
    const job = await withSource((client) => client.getJob(url));
    const templatePath = path.join(templatesDirectory(), `${options.template}.md`);
    const rendered = renderProposal(await readFile(templatePath, 'utf8'), job, await profile());
    const draftPath = path.join(draftsDirectory(), `${job.id}.md`);
    await writeFile(draftPath, rendered, 'utf8');
    console.log(draftPath);
  });

program.parseAsync().catch((error: unknown) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
