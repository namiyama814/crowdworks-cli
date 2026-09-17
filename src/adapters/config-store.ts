import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';
import { configPath, draftsDirectory, templatesDirectory } from './paths.js';
import type { AppConfig, Profile, SavedSearch } from '../domain/types.js';

const profileSchema = z.object({ displayName: z.string(), introduction: z.string(), achievements: z.array(z.string()), defaultPrice: z.number().optional(), defaultDeliveryDays: z.number().int().positive().optional() });
const searchSchema = z.object({ name: z.string().min(1), query: z.string().min(1), exclude: z.array(z.string()).optional(), minBudget: z.number().nonnegative().optional(), category: z.string().optional(), publishedWithinDays: z.number().int().positive().optional(), minClientRating: z.number().min(0).max(5).optional(), requireVerifiedClient: z.boolean().optional(), minClientJobsPosted: z.number().int().nonnegative().optional() });
const configSchema = z.object({ profile: profileSchema, savedSearches: z.array(searchSchema) });

export const defaultConfig: AppConfig = { profile: { displayName: '', introduction: '', achievements: [] }, savedSearches: [] };

export async function initializeConfig(): Promise<void> {
  await Promise.all([mkdir(templatesDirectory(), { recursive: true }), mkdir(draftsDirectory(), { recursive: true })]);
  try { await readFile(configPath(), 'utf8'); } catch {
    await saveConfig(defaultConfig);
    await writeFile(path.join(templatesDirectory(), 'default.md'), 'こんにちは、{{clientName}}様。\n\n{{jobTitle}}の募集を拝見し、応募いたします。\n\n{{introduction}}\n\n実績:\n{{achievements}}\n\nご検討のほどよろしくお願いいたします。\n', 'utf8');
  }
}

export async function loadConfig(): Promise<AppConfig> {
  const raw = await readFile(configPath(), 'utf8');
  return configSchema.parse(YAML.parse(raw));
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await mkdir(path.dirname(configPath()), { recursive: true });
  await writeFile(configPath(), YAML.stringify(config), 'utf8');
}

export async function addSavedSearch(search: SavedSearch): Promise<void> {
  const config = await loadConfig();
  if (config.savedSearches.some((item) => item.name === search.name)) throw new Error(`保存検索「${search.name}」は既に存在します。`);
  config.savedSearches.push(search);
  await saveConfig(config);
}

export async function profile(): Promise<Profile> { return (await loadConfig()).profile; }
