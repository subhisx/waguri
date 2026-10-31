# OpenSource Buddy Backend API

The backend runs at `http://localhost:3000` by default. All responses are JSON.
Error responses use this shape:

```json
{
  "success": false,
  "message": "A concise error description."
}
```

Examples below illustrate response schemas. Any example issue values are
illustrative, not live GitHub results.

## `GET /api/health`

Checks that the Express server is running.

**Request body:** none.

**Success (`200`):**

```json
{
  "success": true,
  "status": "UP",
  "service": "OpenSource Buddy Backend",
  "message": "Backend is running successfully!",
  "timestamp": "2026-10-31T00:00:00.000Z"
}
```

## `POST /api/issues/discover`

Searches GitHub for open issues and returns deterministic matching scores.

**Required request body:**

```json
{
  "skills": ["Python", "HTML", "CSS"],
  "experience": "beginner",
  "category": "web"
}
```

- `skills`: 1–6 non-empty strings, each at most 60 characters.
- `experience`: `beginner`, `intermediate`, or `advanced`.
- `category`: `web`, `backend`, `mobile`, `data`, `devops`,
  `documentation`, or `other`.
- Optional `page`: integer from 1 to 20; defaults to `1`.
- Optional `limit`: integer from 1 to 50; defaults to `20`.

**Success (`200`):**

```json
{
  "success": true,
  "totalCount": 1,
  "issues": [
    {
      "id": 123456789,
      "number": 42,
      "title": "Illustrative issue title",
      "description": "Issue body returned by GitHub.",
      "url": "https://github.com/owner/repository/issues/42",
      "repository": "owner/repository",
      "repositoryUrl": "https://api.github.com/repos/owner/repository",
      "repositoryDescription": null,
      "repositoryLanguage": null,
      "repositoryTopics": [],
      "repositoryMetadata": null,
      "labels": ["help wanted"],
      "assignees": [],
      "createdAt": "2026-10-20T10:00:00Z",
      "updatedAt": "2026-10-29T10:00:00Z",
      "comments": 2,
      "state": "open",
      "availabilityStatus": "apparently_available",
      "freshness": "fresh",
      "estimatedDifficulty": "Beginner",
      "difficultyExplanation": "A beginner-friendly label or an explicit easy/first-issue signal is present.",
      "matchedSkills": ["Python"],
      "missingEssentialSkills": [],
      "componentScores": {
        "skillCompatibility": 100,
        "difficultyCompatibility": 100,
        "freshness": 100,
        "beginnerFriendliness": 75
      },
      "matchScore": 96.25
    }
  ],
  "page": 1,
  "limit": 20,
  "availabilityNote": "Closed and known-archived issues are excluded. Unassigned issues are only apparently available; assigned issues have uncertain availability."
}
```

`totalCount` is GitHub's search count and can differ from the returned issue
count after filtering. Component scores and `matchScore` are numbers from 0 to
100. `availabilityStatus` is `apparently_available` or `uncertain`; neither
value guarantees that an issue is available. `freshness` is `fresh`, `aging`,
`stale`, or `unknown`.

An empty search is a successful `200` with `"issues": []` and a zero (or
GitHub-reported) count.

## `POST /api/ai/explain`

Uses the configured local Ollama model to explain a selected discovered issue.
It does not calculate or replace the deterministic match scores.

**Required request body:**

```json
{
  "skills": ["Python", "HTML", "CSS"],
  "experience": "beginner",
  "issue": {
    "id": 123456789,
    "number": 42,
    "title": "Illustrative issue title",
    "description": "Issue body returned by GitHub.",
    "url": "https://github.com/owner/repository/issues/42",
    "repository": "owner/repository",
    "labels": ["help wanted"],
    "estimatedDifficulty": "Beginner",
    "difficultyExplanation": "A beginner-friendly label or an explicit easy/first-issue signal is present."
  },
  "matchScore": 96.25,
  "componentScores": {
    "skillCompatibility": 100,
    "difficultyCompatibility": 100,
    "freshness": 100,
    "beginnerFriendliness": 75
  }
}
```

- `skills` and `experience` have the same limits and values as discovery.
- `issue.id` is a string or integer; `issue.number` is a positive integer;
  `issue.title` is required. `description` is optional and limited to 100,000
  characters (only the first 20,000 are sent to Ollama). `url`, when supplied,
  must be an HTTPS `github.com` URL. `repository`, `labels`,
  `estimatedDifficulty`, and `difficultyExplanation` are optional.
- `matchScore` and all four named component scores are required numbers from 0
  to 100.

**Success (`200`):**

```json
{
  "success": true,
  "explanation": {
    "summary": "A concise, beginner-friendly summary.",
    "problem": "What the supplied issue says needs solving.",
    "whyItMatches": "How the supplied skills and deterministic scores relate to the issue.",
    "requiredSkills": ["Python"],
    "estimatedDifficulty": {
      "level": "Beginner",
      "explanation": "The deterministic difficulty estimate and its explanation."
    },
    "prerequisites": ["Review the repository contribution instructions."],
    "possibleChallenges": ["The issue may omit implementation details."]
  }
}
```

The response also contains the original `matchScore` and `componentScores`.
Issue descriptions are treated as untrusted data; the model is instructed not
to follow embedded instructions or invent missing repository details.

## `POST /api/ai/roadmap`

Uses the local Ollama model to create a contribution roadmap for a selected
issue.

**Required request body:**

```json
{
  "skills": ["Python", "HTML", "CSS"],
  "experience": "beginner",
  "issue": {
    "id": 123456789,
    "number": 42,
    "title": "Illustrative issue title",
    "description": "Issue body returned by GitHub.",
    "url": "https://github.com/owner/repository/issues/42",
    "repository": "owner/repository",
    "labels": ["help wanted"]
  }
}
```

Issue fields and limits are the same as those documented for the explanation
route, except match scores are not required.

**Success (`200`):**

```json
{
  "success": true,
  "roadmap": {
    "steps": [
      {"number": 1, "title": "Understand the issue", "instructions": "Review the supplied issue and note any unclear requirements."},
      {"number": 2, "title": "Explore the repository", "instructions": "Read the repository documentation and contribution guidance."},
      {"number": 3, "title": "Set up the development environment", "instructions": "Follow the setup instructions documented by the repository."},
      {"number": 4, "title": "Locate relevant code", "instructions": "Search the repository for code related to the issue."},
      {"number": 5, "title": "Implement a solution", "instructions": "Make a focused change that addresses the issue."},
      {"number": 6, "title": "Test changes", "instructions": "Run the documented checks and add suitable tests."},
      {"number": 7, "title": "Create a Git branch", "instructions": "Create a separate branch for the change."},
      {"number": 8, "title": "Commit changes", "instructions": "Commit the focused change with a clear message."},
      {"number": 9, "title": "Open a pull request", "instructions": "Describe the change and link the issue when opening a pull request."}
    ],
    "learningTopics": ["Python", "Git"],
    "recommendedTools": ["Git", "A code editor"],
    "testingAdvice": "Use the repository's documented test commands; ask maintainers if they are unclear.",
    "pullRequestAdvice": "Summarize what changed, how it was tested, and link the issue."
  }
}
```

Roadmap steps always use the nine titles and order shown above. Repository
paths, setup commands, and requirements are not invented when the issue does
not specify them.

## Error status codes

Errors use `{"success":false,"message":"..."}`.

| Status | Meaning |
| --- | --- |
| `400` | Invalid request fields or malformed JSON. |
| `404` | Unknown route. |
| `413` | Request body exceeds Express's JSON parser limit. |
| `500` | Unexpected backend error. |
| `502` | GitHub/Ollama upstream failure, GitHub authentication failure, or invalid Ollama response. |
| `503` | GitHub rate limit, Ollama unavailable, or configured Ollama model not found. |
| `504` | GitHub or Ollama request timed out. |

## Configuration

The server loads `server/.env` using dotenv. Supported variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Express listening port. |
| `NODE_ENV` | `development` | Node environment label. |
| `GITHUB_TOKEN` | empty | Optional GitHub REST API authentication; remains server-side. |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Local Ollama HTTP URL or remote HTTPS gateway URL. |
| `OLLAMA_API_KEY` | empty | Gateway `x-api-key`; required for remote HTTPS gateways. Keep this secret on the backend only. |
| `OLLAMA_MODEL` | `gemma4:e4b` | Ollama model identifier. |

Do not expose `GITHUB_TOKEN` to clients or commit `.env`.
Do not expose `OLLAMA_API_KEY` to clients or commit `.env`. The AI service
validates the Ollama URL during startup: it accepts loopback HTTP or a remote
HTTPS gateway, requires a key for remote URLs, and rejects other protocols,
URL credentials, paths, query strings, and redirects. Requests use the
`x-api-key` header and a 120-second timeout.

### Render configuration for a local Ollama gateway

Set these variables in the Render backend service:

| Variable | Value |
| --- | --- |
| `OLLAMA_BASE_URL` | The current root HTTPS URL printed by `start-gemma-stack.ps1`, for example `https://<generated-name>.trycloudflare.com`. Do not add `/api`. |
| `OLLAMA_API_KEY` | The same secret as `GATEWAY_API_KEY` in the local gateway `.env`. Enter it in Render's secret environment-variable field; never put it in Vercel. |
| `OLLAMA_MODEL` | `gemma4:e4b` |

Render's `PORT` is supplied by Render. Keep `GITHUB_TOKEN` configured there
if the backend's GitHub API integration needs authenticated rate limits.
Cloudflare Quick Tunnel hostnames change when the tunnel restarts; update
`OLLAMA_BASE_URL` in Render to the newly printed URL. The PC, Ollama, gateway,
and tunnel must remain online for Render's AI routes to reach the model.

## Starting the backend

From the `server` directory:

```powershell
npm install
npm start
```

The API listens on `http://localhost:3000` unless `PORT` is set. The test
suite can be run with:

```powershell
npm test
```

## Starting Ollama locally

Install Ollama, then in a separate PowerShell window start the local service
and pull the configured model if it is not already installed:

```powershell
ollama serve
ollama pull gemma4:e4b
```

Verify the model is available:

```powershell
ollama list
```

Keep Ollama bound to localhost; expose only the authenticated gateway through
the Cloudflare tunnel or another trusted HTTPS gateway. AI endpoints return
an error if Ollama, the gateway, the tunnel, or the configured model is
unavailable; the backend does not fabricate AI responses.

## CORS

The Express CORS middleware allows the frontend origin `http://localhost:5173`.
