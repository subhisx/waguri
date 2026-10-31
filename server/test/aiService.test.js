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

test('extracts valid JSON from fenced or surrounding model text', () => {
  const expected = { problem: 'The issue is not specified.' };

  assert.deepEqual(
    aiService.parseJsonContent(`Here is the response:\n\`\`\`json\n${JSON.stringify(expected)}\n\`\`\``),
    expected,
  );
  assert.deepEqual(
    aiService.parseJsonContent(`\uFEFF${JSON.stringify(expected)}\nDone.`),
    expected,
  );
});

test('rejects malformed or incomplete explanation JSON', () => {
  assert.throws(
    () => aiService.parseJsonContent('{"problem":'),
    /response was not valid JSON/,
  );
  assert.throws(
    () => aiService.validateExplanationResponse({
      summary: 'Summary.',
      problem: ' ',
      whyItMatches: 'Reason.',
      requiredSkills: [],
      estimatedDifficulty: {
        level: 'Beginner',
        explanation: 'Based on supplied data.',
      },
      prerequisites: [],
      possibleChallenges: [],
    }),
    /expected non-empty problem/,
  );
});

test('requires exactly nine complete roadmap steps and accepts valid output', () => {
  const validRoadmap = {
    steps: Array.from({ length: 9 }, (_, index) => ({
      number: index + 1,
      title: `Model title ${index + 1}`,
      instructions: `Step ${index + 1} instructions.`,
    })),
    learningTopics: [],
    recommendedTools: [],
    testingAdvice: 'Follow the repository testing instructions.',
    pullRequestAdvice: 'Describe the changes and link the issue.',
  };

  assert.throws(
    () => aiService.validateRoadmapResponse({
      ...validRoadmap,
      steps: validRoadmap.steps.slice(0, 8),
    }),
    /expected exactly nine roadmap steps/,
  );
  assert.equal(aiService.validateRoadmapResponse(validRoadmap).steps.length, 9);
});
