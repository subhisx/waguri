const express = require('express');

const githubService = require('../services/githubService');
const matchingService = require('../services/matchingService');

const router = express.Router();

const experienceLevels = new Set(['beginner', 'intermediate', 'advanced']);
const categories = {
  web: 'web',
  backend: 'backend',
  mobile: 'mobile',
  data: 'data',
  devops: 'devops',
  documentation: 'documentation',
  other: 'open source',
};

const programmingLanguages = new Set([
  'assembly', 'c', 'c#', 'c++', 'clojure', 'coffeescript', 'crystal',
  'dart', 'elixir', 'elm', 'erlang', 'f#', 'fortran', 'go', 'groovy',
  'haskell', 'java', 'javascript', 'julia', 'kotlin', 'lua', 'objective-c',
  'perl', 'php', 'powershell', 'python', 'r', 'ruby', 'rust', 'scala',
  'shell', 'swift', 'typescript',
]);

function createRequestError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function quoteSearchTerm(term) {
  return `"${term.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function buildSearchQuery(skills, category) {
  const skillTerms = skills.map(quoteSearchTerm);
  const categoryTerm = quoteSearchTerm(categories[category]);
  const languageTerms = skills
    .filter((skill) => programmingLanguages.has(skill.toLowerCase()))
    .map((language) => `language:${language}`);
  const queryParts = [
    `(${skillTerms.join(' OR ')})`,
    categoryTerm,
    'is:issue',
    'is:open',
  ];

  if (languageTerms.length === 1) {
    queryParts.push(languageTerms[0]);
  }

  return queryParts.join(' ');
}

function validateRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createRequestError('Request body must be a JSON object.');
  }

  if (!Array.isArray(body.skills) || body.skills.length === 0) {
    throw createRequestError('skills must be a non-empty array of strings.');
  }

  if (body.skills.length > 6
    || body.skills.some((skill) => typeof skill !== 'string'
      || !skill.trim()
      || skill.trim().length > 60
      || /[\u0000-\u001f\u007f]/.test(skill))) {
    throw createRequestError(
      'skills must contain between 1 and 6 non-empty strings of at most 60 characters.',
    );
  }

  if (typeof body.experience !== 'string'
    || !experienceLevels.has(body.experience.trim().toLowerCase())) {
    throw createRequestError(
      'experience must be beginner, intermediate, or advanced.',
    );
  }

  if (typeof body.category !== 'string'
    || !Object.hasOwn(categories, body.category.trim().toLowerCase())) {
    throw createRequestError(
      `category must be one of: ${Object.keys(categories).join(', ')}.`,
    );
  }

  const page = body.page === undefined ? 1 : body.page;
  const limit = body.limit === undefined ? 20 : body.limit;

  if (!Number.isInteger(page) || page < 1 || page > 20) {
    throw createRequestError('page must be an integer between 1 and 20.');
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw createRequestError('limit must be an integer between 1 and 50.');
  }

  return {
    skills: [...new Set(body.skills.map((skill) => skill.trim()))],
    experience: body.experience.trim().toLowerCase(),
    category: body.category.trim().toLowerCase(),
    page,
    limit,
  };
}

// POST /api/issues/discover
router.post('/discover', async (req, res) => {
  const request = validateRequest(req.body);
  const query = buildSearchQuery(request.skills, request.category);
  const result = await githubService.searchIssues(query, {
    page: request.page,
    perPage: request.limit,
  });
  const issues = matchingService.matchIssues(result.issues, request);

  res.status(200).json({
    success: true,
    totalCount: result.totalCount,
    issues,
    page: request.page,
    limit: request.limit,
    availabilityNote: 'Closed and known-archived issues are excluded. Unassigned issues are only apparently available; assigned issues have uncertain availability.',
  });
});

module.exports = router;
