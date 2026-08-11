---
name: preview
description: Preview server start, stop, and status check. Local development server management.
version: 1.0.0
requires_agents: frontend-specialist
requires_skills: verify-changes
artifact_outputs: preview-status, runtime-findings
---

# /wf_preview - Preview Management

$ARGUMENTS

---

## Task

Manage preview server: start, stop, status check.

### Commands

```
/wf_preview           - Show current status
/wf_preview start     - Start server
/wf_preview stop      - Stop server
/wf_preview restart   - Restart
/wf_preview check     - Health check
```

---

## Usage Examples

### Start Server
```
/wf_preview start

Response:
🚀 Starting preview...
   Port: 3000
   Type: Next.js

✅ Preview ready!
   URL: http://localhost:3000
```

### Status Check
```
/wf_preview

Response:
=== Preview Status ===

🌐 URL: http://localhost:3000
📁 Project: C:/projects/my-app
🏷️ Type: nextjs
💚 Health: OK
```

### Port Conflict
```
/wf_preview start

Response:
⚠️ Port 3000 is in use.

Options:
1. Start on port 3001
2. Close app on 3000
3. Specify different port

Which one? (default: 1)
```

---

## Technical

Auto preview uses `auto_preview.py` script:

```bash
python scripts/auto_preview.py start [port]
python scripts/auto_preview.py stop
python scripts/auto_preview.py status
```

