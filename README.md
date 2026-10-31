# OpenSource Buddy

OpenSource Buddy's Vite frontend is in `client/`; its Express API, GitHub issue
discovery, deterministic matching, and Gemma AI endpoints are in `server/`.
The backend API contract is documented in [server/API_DOCUMENTATION.md](./server/API_DOCUMENTATION.md).

## Start the local Gemma gateway and Cloudflare tunnel

Requirements: Windows PowerShell, Node.js 18+, Ollama with `gemma4:e4b`
installed, and `cloudflared.exe`.

The private gateway key is stored in
`C:\Users\subho\ollama-gateway\.env`. Keep this file private; the gateway
folder's `.gitignore` excludes it. The same key must be entered as the
backend's `OLLAMA_API_KEY` secret in Render.

Run this one command from PowerShell to check Ollama, start/reuse the
localhost-only authenticated gateway, start/reuse a Cloudflare Quick Tunnel,
and test local plus public model access:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\subho\ollama-gateway\start-gemma-stack.ps1"
```

Ollama remains bound to localhost on port `11434`; the gateway listens only
on `127.0.0.1:11435`. The public tunnel points to the authenticated gateway,
not directly to Ollama. The script does not terminate existing processes.

## Configure the Render backend

In the Render backend service's environment settings, configure:

| Variable | Value |
| --- | --- |
| `OLLAMA_BASE_URL` | The root HTTPS `*.trycloudflare.com` URL printed by the startup script; do not append `/api`. |
| `OLLAMA_API_KEY` | The gateway's `GATEWAY_API_KEY`, entered as a Render secret. Never set this in Vercel. |
| `OLLAMA_MODEL` | `gemma4:e4b` |

Render supplies `PORT`. Keep any existing `GITHUB_TOKEN` configuration. Restart
or redeploy the Render service after changing environment variables. No
frontend redesign or gateway secret in Vercel is required; the client should
continue to call the Render API using its existing `VITE_API_BASE_URL`.

Cloudflare Quick Tunnel hostnames are temporary and can change after the
tunnel restarts. Update Render's `OLLAMA_BASE_URL` when the printed hostname
changes. The PC, Ollama, gateway, and tunnel must remain online. This setup
does not deploy the site or provide an always-on/free production endpoint.

## Tests

From `server/`, run `npm test` for backend tests. From the gateway folder,
run `npm test` for gateway proxy tests. The startup script runs authenticated
local and public `/api/tags` checks automatically.
