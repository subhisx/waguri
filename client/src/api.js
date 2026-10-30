const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'https://waguri-vndh.onrender.com'
).replace(/\/+$/, '')

async function request(path, { method = 'GET', body, signal } = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error(`Could not connect to the backend at ${API_BASE_URL}.`)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Backend returned an invalid response (HTTP ${response.status}).`)
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Backend request failed (HTTP ${response.status}).`)
  }

  return data
}

export function checkBackend(options = {}) {
  return request('/api/health', options)
}

const categoryIds = {
  'Any category': 'other',
  Frontend: 'web',
  'Backend & APIs': 'backend',
  Documentation: 'documentation',
  'Developer tools': 'other',
  'Data & SQL': 'data',
}

export function discoverIssues({ skills, experience, category }, options = {}) {
  const categoryId = categoryIds[category]
  if (!categoryId) {
    throw new Error(`Unsupported project category: ${category}.`)
  }

  return request('/api/issues/discover', {
    ...options,
    method: 'POST',
    body: {
      skills,
      experience: experience.toLowerCase(),
      category: categoryId,
      limit: 20,
    },
  })
}

function issuePayload(issue) {
  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    description: issue.description,
    url: issue.url,
    repository: issue.repository,
    labels: issue.labels,
    estimatedDifficulty: issue.estimatedDifficulty,
    difficultyExplanation: issue.difficultyExplanation,
  }
}

export function explainIssue({ skills, experience, issue }, options = {}) {
  return request('/api/ai/explain', {
    ...options,
    method: 'POST',
    body: {
      skills,
      experience: experience.toLowerCase(),
      issue: issuePayload(issue),
      matchScore: issue.matchScore,
      componentScores: issue.componentScores,
    },
  })
}

export function createRoadmap({ skills, experience, issue }, options = {}) {
  return request('/api/ai/roadmap', {
    ...options,
    method: 'POST',
    body: {
      skills,
      experience: experience.toLowerCase(),
      issue: issuePayload(issue),
    },
  })
}

export { API_BASE_URL }
