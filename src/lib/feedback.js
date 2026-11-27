// Builds pre-filled GitHub "new issue" URLs. No tokens, no API calls:
// the user submits the issue with their own GitHub account.
// Only the app version and a trimmed user agent are included, never app data.

export const REPO_URL = 'https://github.com/lance6x5/chore-board';

const TEMPLATES = {
  bug: { template: 'bug_report.yml', title: '[Bug]: ' },
  feature: { template: 'feature_request.yml', title: '[Feature]: ' },
};

/** Shorten the user agent so URLs stay short. */
export function trimUserAgent(ua, max = 120) {
  const s = String(ua || '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/**
 * @param {'bug'|'feature'} kind
 * @param {{ version?: string, userAgent?: string }} info
 */
export function buildIssueUrl(kind, { version = '', userAgent = '' } = {}) {
  const t = TEMPLATES[kind];
  if (!t) throw new Error(`Unknown feedback kind: ${kind}`);
  const params = new URLSearchParams();
  params.set('template', t.template);
  params.set('title', t.title);
  if (version) params.set('version', version);
  if (kind === 'bug' && userAgent) params.set('environment', trimUserAgent(userAgent));
  return `${REPO_URL}/issues/new?${params.toString()}`;
}
