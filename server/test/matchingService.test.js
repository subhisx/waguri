const assert = require('node:assert/strict');
const test = require('node:test');

const matchingService = require('../services/matchingService');
const scoreCalculator = require('../utils/scoreCalculator');

const now = Date.parse('2026-10-31T00:00:00Z');

function createIssue(overrides = {}) {
  return {
    id: 1,
    title: 'Python beginner task',
    description: 'Python is required for this fix.',
    repository: 'sample/python-project',
    repositoryMetadata: {
      archived: false,
      description: 'A project built with Python.',
      topics: ['python'],
    },
    labels: ['good first issue'],
    updatedAt: '2026-10-30T00:00:00Z',
    state: 'open',
    ...overrides,
  };
}

test('uses the requested component weights and bounded scores', () => {
  assert.deepEqual(scoreCalculator.WEIGHTS, {
    skillCompatibility: 0.4,
    difficultyCompatibility: 0.25,
    freshness: 0.2,
    beginnerFriendliness: 0.15,
  });

  const issues = matchingService.matchIssues(
    [createIssue()],
    { skills: ['Python'], experience: 'beginner' },
    { now },
  );
  const [issue] = issues;

  assert.ok(issue.matchScore >= 0 && issue.matchScore <= 100);
  for (const score of Object.values(issue.componentScores)) {
    assert.ok(score >= 0 && score <= 100);
  }
});

test('matches skills from labels, descriptions, and repository metadata', () => {
  const result = scoreCalculator.calculateSkillCompatibility(
    createIssue({
      title: 'Update docs',
      description: 'Implement the requested change.',
      labels: ['TypeScript'],
      repository: 'sample/project',
      repositoryMetadata: { description: 'Python utilities' },
    }),
    ['Python', 'TypeScript', 'CSS'],
  );

  assert.equal(result.score, 66.67);
  assert.deepEqual(result.matchedSkills, ['Python', 'TypeScript']);
});

test('penalizes skills explicitly marked as essential but missing from the user', () => {
  const result = scoreCalculator.calculateSkillCompatibility(
    createIssue({
      description: 'Python is required. Rust is required for this subsystem.',
    }),
    ['Python'],
  );

  assert.equal(result.score, 85);
  assert.deepEqual(result.missingEssentialSkills, ['Rust']);
});

test('estimates issue difficulty and explains the estimate', () => {
  assert.deepEqual(
    scoreCalculator.estimateDifficulty(createIssue()),
    {
      level: 'Beginner',
      explanation: 'A beginner-friendly label or an explicit easy/first-issue signal is present.',
    },
  );

  assert.equal(
    scoreCalculator.estimateDifficulty(createIssue({
      title: 'Architectural overhaul',
      labels: [],
    })).level,
    'Advanced',
  );
});

test('calculates freshness deterministically from the supplied reference time', () => {
  assert.equal(
    scoreCalculator.calculateFreshness('2026-10-30T00:00:00Z', now),
    100,
  );
  assert.equal(scoreCalculator.calculateFreshness('invalid-date', now), 0);
});

test('rewards beginner labels and help wanted labels', () => {
  assert.equal(
    scoreCalculator.calculateBeginnerFriendliness(
      createIssue({ labels: ['good first issue'] }),
    ),
    100,
  );
  assert.equal(
    scoreCalculator.calculateBeginnerFriendliness(
      createIssue({ labels: ['help wanted'] }),
    ),
    75,
  );
});

test('filters closed, pull request, and archived results and sorts by match score', () => {
  const results = matchingService.matchIssues(
    [
      createIssue({ id: 1 }),
      createIssue({ id: 2, state: 'closed' }),
      createIssue({ id: 3, pull_request: true }),
      createIssue({
        id: 4,
        repositoryMetadata: { archived: true },
      }),
      createIssue({
        id: 5,
        title: 'Unrelated issue',
        description: 'Nothing relevant here.',
        repository: 'other/project',
        repositoryMetadata: null,
        labels: [],
      }),
    ],
    { skills: ['Python'], experience: 'beginner' },
    { now },
  );

  assert.deepEqual(results.map((issue) => issue.id), [1, 5]);
  assert.ok(results[0].matchScore > results[1].matchScore);
});

test('produces identical scores for identical issues, preferences, and reference time', () => {
  const issue = createIssue();
  const preferences = { skills: ['Python'], experience: 'beginner' };

  assert.deepEqual(
    matchingService.matchIssues([issue], preferences, { now }),
    matchingService.matchIssues([issue], preferences, { now }),
  );
});
