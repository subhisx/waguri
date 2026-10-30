const axios = require('axios');

const config = require('../config');

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 10000,
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'OpenSource-Buddy',
    ...(config.GITHUB_TOKEN
      ? { Authorization: `Bearer ${config.GITHUB_TOKEN}` }
      : {}),
  },
});

class GitHubApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'GitHubApiError';
    this.statusCode = statusCode;
  }
}

function getRepositoryName(repositoryUrl, issueUrl) {
  try {
    if (repositoryUrl) {
      const repositorySegments = new URL(repositoryUrl).pathname
        .split('/')
        .filter(Boolean);
      return repositorySegments.length >= 2
        ? repositorySegments.slice(-2).join('/')
        : null;
    }

    if (issueUrl) {
      const issueSegments = new URL(issueUrl).pathname
        .split('/')
        .filter(Boolean);
      const issuesIndex = issueSegments.lastIndexOf('issues');
      return issuesIndex >= 2
        ? issueSegments.slice(issuesIndex - 2, issuesIndex).join('/')
        : null;
    }

    return null;
  } catch {
    return null;
  }
}

function getFreshness(updatedAt) {
  const updatedTime = Date.parse(updatedAt);

  if (Number.isNaN(updatedTime)) {
    return 'unknown';
  }

  const ageInDays = (Date.now() - updatedTime) / (1000 * 60 * 60 * 24);

  if (ageInDays <= 30) {
    return 'fresh';
  }

  return ageInDays <= 90 ? 'aging' : 'stale';
}

function normalizeIssue(issue) {
  const repositoryUrl = issue.repository_url || null;
  const repositoryMetadata = issue.repository
    || issue.repository_metadata
    || null;
  const assignees = Array.isArray(issue.assignees)
    ? issue.assignees.map((assignee) => assignee.login).filter(Boolean)
    : [];
  const labels = Array.isArray(issue.labels)
    ? issue.labels.map((label) => label.name).filter(Boolean)
    : [];

  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    description: issue.body ?? null,
    url: issue.html_url || null,
    repository: getRepositoryName(repositoryUrl, issue.html_url),
    repositoryUrl,
    repositoryDescription: repositoryMetadata?.description || null,
    repositoryLanguage: repositoryMetadata?.language || null,
    repositoryTopics: Array.isArray(repositoryMetadata?.topics)
      ? repositoryMetadata.topics
      : [],
    repositoryMetadata: repositoryMetadata
      ? {
        archived: repositoryMetadata.archived === true,
        description: repositoryMetadata.description || null,
        language: repositoryMetadata.language || null,
        name: repositoryMetadata.full_name || repositoryMetadata.name || null,
        topics: Array.isArray(repositoryMetadata.topics)
          ? repositoryMetadata.topics
          : [],
      }
      : null,
    labels,
    assignees,
    createdAt: issue.created_at || null,
    updatedAt: issue.updated_at || null,
    comments: Number.isInteger(issue.comments) ? issue.comments : null,
    state: issue.state,
    availabilityStatus: assignees.length === 0
      ? 'apparently_available'
      : 'uncertain',
    freshness: getFreshness(issue.updated_at),
  };
}

async function searchIssues(query, { page = 1, perPage = 20 } = {}) {
  if (typeof query !== 'string' || !query.trim()) {
    throw new TypeError('A GitHub issue search query is required.');
  }

  if (!Number.isInteger(page) || page < 1 || page > 100) {
    throw new RangeError('Page must be an integer between 1 and 100.');
  }

  if (!Number.isInteger(perPage) || perPage < 1 || perPage > 100) {
    throw new RangeError('perPage must be an integer between 1 and 100.');
  }

  let response;

  try {
    response = await githubApi.get('/search/issues', {
      params: {
        q: query,
        page,
        per_page: perPage,
        sort: 'updated',
        order: 'desc',
      },
    });
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new GitHubApiError('GitHub API request timed out.', 504);
    }

    const status = error.response?.status;
    const headers = error.response?.headers || {};
    const apiMessage = error.response?.data?.message || '';
    const isRateLimit = status === 429
      || (status === 403
        && (String(headers['x-ratelimit-remaining']) === '0'
          || /rate limit/i.test(apiMessage)));

    if (isRateLimit) {
      throw new GitHubApiError(
        'GitHub API rate limit exceeded. Please retry later.',
        503,
      );
    }

    if (status === 401) {
      throw new GitHubApiError(
        'GitHub API authentication failed. Check the server configuration.',
        502,
      );
    }

    throw new GitHubApiError(
      'GitHub issue search is temporarily unavailable.',
      502,
    );
  }

  if (!response.data
    || !Array.isArray(response.data.items)
    || !Number.isInteger(response.data.total_count)
    || response.data.total_count < 0
    || response.data.items.some((issue) => !issue
      || !Number.isInteger(issue.id)
      || !Number.isInteger(issue.number)
      || typeof issue.title !== 'string')) {
    throw new GitHubApiError(
      'GitHub API returned an unexpected search response.',
      502,
    );
  }

  const items = response.data.items;
  const issues = items
    .filter((issue) => issue.state === 'open')
    .filter((issue) => !issue.pull_request)
    .filter((issue) => issue.repository?.archived !== true)
    .map(normalizeIssue);

  return {
    totalCount: response.data.total_count,
    issues,
  };
}

module.exports = {
  searchIssues,
};
