const assert = require('node:assert/strict');
const test = require('node:test');
const axios = require('axios');

const originalOllamaEnvironment = {
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
  OLLAMA_API_KEY: process.env.OLLAMA_API_KEY,
  OLLAMA_MODEL: process.env.OLLAMA_MODEL,
};
const originalAxiosCreate = axios.create;
const outgoingRequests = [];
let adapterError = null;

process.env.OLLAMA_BASE_URL = 'https://gateway.example.com';
process.env.OLLAMA_API_KEY = 'test-gateway-key-that-is-at-least-thirty-two-characters';
process.env.OLLAMA_MODEL = 'gemma4:e4b';

axios.create = (configuration) => originalAxiosCreate({
  ...configuration,
  adapter: async (request) => {
    outgoingRequests.push(request);
    if (adapterError) {
      throw adapterError;
    }

    return {
      data: {
        message: {
          content: JSON.stringify({
            steps: Array.from({ length: 9 }, (_, index) => ({
              number: index + 1,
              title: `Step ${index + 1}`,
              instructions: 'Follow the repository guidance.',
            })),
            learningTopics: [],
            recommendedTools: [],
            testingAdvice: 'Follow the repository testing instructions.',
            pullRequestAdvice: 'Describe and link the changes.',
          }),
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: request,
    };
  },
});

const aiService = require('../services/aiService');
axios.create = originalAxiosCreate;

for (const [name, value] of Object.entries(originalOllamaEnvironment)) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

const { getOllamaConfiguration } = aiService;

const gatewayKey = 'test-gateway-key-that-is-at-least-thirty-two-characters';

test('allows local Ollama without gateway authentication', () => {
  const configuration = getOllamaConfiguration(
    'http://127.0.0.1:11434',
    '',
  );

  assert.equal(configuration.baseURL, 'http://127.0.0.1:11434');
  assert.equal(configuration.timeout, 120000);
  assert.equal(configuration.maxRedirects, 0);
  assert.equal(configuration.headers['x-api-key'], undefined);
});

test('sends authenticated roadmap requests to a remote HTTPS gateway', async () => {
  const result = await aiService.generateRoadmap({
    skills: ['Python'],
    experience: 'beginner',
    issue: {
      id: 123,
      number: 42,
      title: 'Improve beginner documentation',
      description: 'Update the guide with a clear example.',
      url: 'https://github.com/example/project/issues/42',
      repository: 'example/project',
      labels: ['good first issue'],
    },
  });

  assert.equal(result.steps.length, 9);
  assert.equal(outgoingRequests.length, 1);
  const [request] = outgoingRequests;
  assert.equal(request.baseURL, 'https://gateway.example.com');
  assert.equal(request.url, '/api/chat');
  assert.equal(request.headers.get('x-api-key'), gatewayKey);
  assert.equal(JSON.parse(request.data).model, 'gemma4:e4b');
});

test('logs sanitized Axios diagnostics for network failures', async () => {
  const loggedErrors = [];
  const originalConsoleError = console.error;
  adapterError = new axios.AxiosError(
    `socket hang up; x-api-key=${gatewayKey}`,
    'ECONNRESET',
  );
  console.error = (...args) => loggedErrors.push(args);

  try {
    await assert.rejects(
      aiService.generateRoadmap({
        skills: ['Python'],
        experience: 'beginner',
        issue: {
          id: 123,
          number: 42,
          title: 'Improve beginner documentation',
          description: 'Update the guide with a clear example.',
          url: 'https://github.com/example/project/issues/42',
          repository: 'example/project',
          labels: ['good first issue'],
        },
      }),
      { statusCode: 503 },
    );
  } finally {
    adapterError = null;
    console.error = originalConsoleError;
  }

  assert.equal(loggedErrors.length, 1);
  assert.equal(loggedErrors[0][0], '[aiService] Ollama request failed');
  assert.equal(loggedErrors[0][1].status, null);
  assert.equal(loggedErrors[0][1].code, 'ECONNRESET');
  assert.match(loggedErrors[0][1].message, /socket hang up/);
  assert.ok(!JSON.stringify(loggedErrors).includes(gatewayKey));
  assert.match(JSON.stringify(loggedErrors), /\[REDACTED\]/);
});

test('configures authenticated local gateway requests', () => {
  const configuration = getOllamaConfiguration(
    'http://127.0.0.1:11435/',
    gatewayKey,
  );

  assert.equal(configuration.baseURL, 'http://127.0.0.1:11435');
  assert.ok(configuration.headers['x-api-key'] === gatewayKey);
});

test('requires a long API key for remote HTTPS gateways', () => {
  const configuration = getOllamaConfiguration(
    'https://example.trycloudflare.com',
    gatewayKey,
  );

  assert.equal(configuration.baseURL, 'https://example.trycloudflare.com');
  assert.ok(configuration.headers['x-api-key'] === gatewayKey);
  assert.equal(
    getOllamaConfiguration('https://gateway.example.com:8443', gatewayKey).baseURL,
    'https://gateway.example.com:8443',
  );
  assert.throws(
    () => getOllamaConfiguration('https://gateway.example.com', ''),
    { name: 'AIServiceError' },
  );
  assert.throws(
    () => getOllamaConfiguration('https://gateway.example.com', 'short'),
    { name: 'AIServiceError' },
  );
});

test('rejects non-loopback HTTP URLs and malformed remote endpoints', () => {
  for (const baseUrl of [
    'http://192.168.1.5:11434',
    'http://example.trycloudflare.com',
    'https://user:password@example.trycloudflare.com',
    'https://example.trycloudflare.com/unexpected-path',
    'https://example.trycloudflare.com?redirect=true',
  ]) {
    assert.throws(
      () => getOllamaConfiguration(baseUrl, gatewayKey),
      { name: 'AIServiceError' },
      'unsafe Ollama URL should be rejected',
    );
  }
});
