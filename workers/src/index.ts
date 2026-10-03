import { McpServer } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'agents/mcp/server';
import { z } from 'zod';
import { CrowdWorksHttpSource } from '../../src/adapters/crowdworks-http.js';
import { sortJobs } from '../../src/domain/jobs.js';
import type { SortField } from '../../src/domain/types.js';
import { formatJobDetail, jobSummary } from '../../src/presentation/format.js';

const text = (value: unknown) => ({
  content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }]
});

async function useSource<T>(fn: (source: CrowdWorksHttpSource) => Promise<T>): Promise<T> {
  return fn(new CrowdWorksHttpSource());
}

function createServer() {
  const server = new McpServer({ name: 'crowdworks-mcp', version: '0.1.0' });

  server.registerTool(
    'search_jobs',
    {
      description: 'キーワードでCrowdWorksの固定報酬プロジェクトを検索する',
      inputSchema: z.object({
        query: z.string().min(1),
        sort: z.enum(['published', 'applicants', 'competition', 'budget', 'client-rating']).optional()
      })
    },
    async ({ query, sort = 'published' }) => {
      const jobs = await useSource((source) => source.search({ name: 'mcp', query }));
      return text(sortJobs(jobs, sort as SortField).map(jobSummary));
    }
  );

  server.registerTool(
    'get_job',
    {
      description: '案件詳細と応募状況を取得する',
      inputSchema: z.object({
        url: z.string().url(),
        include_description: z.boolean().optional()
      })
    },
    async ({ url, include_description = false }) =>
      text(formatJobDetail(await useSource((source) => source.getJob(url)), include_description))
  );

  return server;
}

const handler = createMcpHandler(createServer);

function unauthorized(message: string, status = 401): Response {
  return new Response(message, {
    status,
    headers: {
      'WWW-Authenticate': 'Bearer realm="crowdworks-mcp"',
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}

function requireBearer(request: Request, token: string | undefined): Response | null {
  if (!token) {
    return unauthorized('MCP_AUTH_TOKEN is not configured', 500);
  }
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return unauthorized('Missing Bearer token');
  }
  const provided = header.slice('Bearer '.length).trim();
  if (provided.length !== token.length) {
    return unauthorized('Invalid Bearer token');
  }
  let mismatch = 0;
  for (let i = 0; i < token.length; i += 1) {
    mismatch |= provided.charCodeAt(i) ^ token.charCodeAt(i);
  }
  if (mismatch !== 0) {
    return unauthorized('Invalid Bearer token');
  }
  return null;
}

export default {
  fetch(request, env, ctx) {
    if (request.method !== 'OPTIONS') {
      const authError = requireBearer(request, env.MCP_AUTH_TOKEN);
      if (authError) return authError;
    }
    return handler(request, env, ctx);
  }
} satisfies ExportedHandler<Env>;
