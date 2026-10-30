const assert = require('node:assert/strict');
const test = require('node:test');

const aiService = require('../services/aiService');

const validRequest = {
  skills: ['Python', 'HTML'],
  experience: 'beginner',
  issue: {
    id: 123,
    number: 42,
    title: 'Improve beginner documentation',
    description: 'Update the guide with a clear example.',
    url: 'https://github.com/example/project/issues/42',
    repository: 'example/project',
    labels: ['good first issue'],
    estimatedDifficulty: 'Beginner',
    difficultyExplanation: 'The issue has a good first issue label.',
  },
};

test('validates explanation requests and deterministic match scores', () => {
  const request = {
    ...validRequest,
    matchScore: 87.5,
    componentScores: {
      skillCompatibility: 90,
      difficultyCompatibility: 100,
      freshness: 75,
      beginnerFriendliness: 100,
    },
  };

  assert.equal(aiService.validateExplanationInput(request).issue.number, 42);
  assert.throws(
    () => aiService.validateExplanationInput({
      ...request,
      matchScore: 101,
    }),
    /matchScore/,
  );
  assert.throws(
    () => aiService.validateExplanationInput({
      ...request,
      componentScores: { skillCompatibility: 50 },
    }),
    /componentScores/,
  );
});

test('validates roadmap requests and rejects invalid GitHub issue URLs', () => {
  assert.equal(aiService.validateRoadmapInput(validRequest).skills.length, 2);
  assert.throws(
    () => aiService.validateRoadmapInput({
      ...validRequest,
      issue: { ...validRequest.issue, url: 'https://example.com/issues/42' },
    }),
    /GitHub HTTPS URL/,
  );
});

test('validates skills, experience, and issue content limits', () => {
  assert.throws(
    () => aiService.validateRoadmapInput({ ...validRequest, skills: [] }),
    /at least one skill/,
  );
  assert.throws(
    () => aiService.validateRoadmapInput({
      ...validRequest,
      experience: 'expert',
    }),
    /experience/,
  );
  assert.throws(
    () => aiService.validateRoadmapInput({
      ...validRequest,
      issue: { ...validRequest.issue, description: 'x'.repeat(100001) },
    }),
    /issue.description/,
  );
});
