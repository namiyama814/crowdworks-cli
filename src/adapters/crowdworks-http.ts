import axios from 'axios';
import * as cheerio from 'cheerio';
import { matchesSavedSearch } from '../domain/jobs.js';
import type { Job, JobSource, SavedSearch } from '../domain/types.js';

const BASE_URL = 'https://crowdworks.jp';
const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'User-Agent': 'crowdworks-cli/0.1 (+https://github.com/namiyama/crowdworks-cli)' },
  timeout: 20_000
});

function numberFrom(value?: string): number | undefined {
  const match = value?.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function dateFrom(value?: string): string | undefined {
  const match = value?.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  return match ? `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}` : undefined;
}

function tableValue($: cheerio.CheerioAPI, selector: string, label: string): string | undefined {
  const row = $(selector).filter((_index, element) => $(element).find('th').text().trim() === label).first();
  const value = row.find('td').text().replace(/\s+/g, ' ').trim();
  return value || undefined;
}

function parseDetail(html: string, url: string): Job {
  const $ = cheerio.load(html);
  const body = $('body').text().replace(/\s+/g, ' ').trim();
  const description = $('#job_offer_detail .detail_information').last().text().replace(/\n[ \t]*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const title = $('h1').first().text().trim();
  if (!title) throw new Error('案件タイトルを取得できませんでした。サイトの表示変更の可能性があります。');
  const id = new URL(url).pathname.match(/\/jobs\/(\d+)/)?.[1] ?? url;
  const budget = $('.fixed_price_budget').first().text();
  const amounts = (budget.replace(/,/g, '').match(/\d+/g) ?? []).map(Number);
  const rating = numberFrom($('.client_rating .star_container').first().text());
  return {
    id, url, title, description: description || body, budgetMin: amounts[0], budgetMax: amounts[1] ?? amounts[0],
    publishedAt: dateFrom(tableValue($, '.cw-table.summary tr', '掲載日')),
    deadline: dateFrom(tableValue($, '.cw-table.summary tr', '応募期限')),
    client: { name: $('.client_name').first().text().trim() || '不明なクライアント', rating, verified: $('.identity_verified').length > 0, jobsPosted: numberFrom(tableValue($, '.client_detail_table tr', '募集実績')) },
    competition: { applicants: numberFrom(tableValue($, '.application_status_table tr', '応募した人')), contracted: numberFrom(tableValue($, '.application_status_table tr', '契約した人')), openings: numberFrom(tableValue($, '.application_status_table tr', '募集人数')), interested: numberFrom(tableValue($, '.application_status_table tr', '気になる！リスト')) }
  };
}

interface SearchItem { job_offer: { id: number; title: string; description_digest: string; category_id: number; last_released_at?: string }; payment: { fixed_price_payment?: { min_budget?: number; max_budget?: number } }; entry: { project_entry?: { num_contracts?: number; project_contract_hope_number?: number } }; client: { username: string; is_employer_certification: boolean }; }

function parseSearchResults(html: string): Job[] {
  const raw = cheerio.load(html)('#vue-container').attr('data');
  if (!raw) throw new Error('案件一覧データを取得できませんでした。サイトの表示変更の可能性があります。');
  const data = JSON.parse(raw) as { searchResult: { job_offers: SearchItem[] } };
  return data.searchResult.job_offers.flatMap(({ job_offer: offer, payment, entry, client }) => {
    const fixed = payment.fixed_price_payment;
    if (!fixed) return [];
    return [{ id: String(offer.id), url: `${BASE_URL}/public/jobs/${offer.id}`, title: offer.title, description: offer.description_digest, category: String(offer.category_id), budgetMin: fixed.min_budget, budgetMax: fixed.max_budget, publishedAt: offer.last_released_at?.slice(0, 10), client: { name: client.username, verified: client.is_employer_certification }, competition: { contracted: entry.project_entry?.num_contracts, openings: entry.project_entry?.project_contract_hope_number } }];
  });
}

export class CrowdWorksHttpSource implements JobSource {
  async search(criteria: SavedSearch): Promise<Job[]> {
    const response = await http.get('/public/jobs');
    const candidates = parseSearchResults(response.data);
    const matching = candidates.filter((job) => matchesSavedSearch(job, criteria));
    const details = await Promise.all(matching.map((job) => this.getJob(job.url)));
    return details;
  }

  async getJob(url: string): Promise<Job> {
    const response = await http.get(url);
    return parseDetail(response.data, url);
  }
}
