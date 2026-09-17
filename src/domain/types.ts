export type SortField = 'published' | 'applicants' | 'competition' | 'budget' | 'client-rating';

export interface Competition {
  applicants?: number;
  contracted?: number;
  openings?: number;
  interested?: number;
}

export interface Client {
  name: string;
  rating?: number;
  verified?: boolean;
  jobsPosted?: number;
}

export interface Job {
  id: string;
  url: string;
  title: string;
  category?: string;
  budgetMin?: number;
  budgetMax?: number;
  publishedAt?: string;
  deadline?: string;
  description?: string;
  client: Client;
  competition: Competition;
}

export interface SavedSearch {
  name: string;
  query: string;
  exclude?: string[];
  minBudget?: number;
  category?: string;
  publishedWithinDays?: number;
  minClientRating?: number;
  requireVerifiedClient?: boolean;
  minClientJobsPosted?: number;
}

export interface Profile {
  displayName: string;
  introduction: string;
  achievements: string[];
  defaultPrice?: number;
  defaultDeliveryDays?: number;
}

export interface AppConfig {
  profile: Profile;
  savedSearches: SavedSearch[];
}

export interface JobSource {
  search(criteria: SavedSearch): Promise<Job[]>;
  getJob(url: string): Promise<Job>;
}
