---
name: wf_deploy
description: Deployment command for production releases. Pre-flight checks and deployment execution.
version: 1.0.0
requires_agents: devops-engineer
requires_skills: deployment-procedures, verify-changes
artifact_outputs: deployment-plan, deployment-report, rollback-plan
---

# /wf_deploy - Production Deployment

$ARGUMENTS

---

## Purpose

This command handles production deployment with pre-flight checks, deployment execution, and verification.

---

## Sub-commands

```
/wf_deploy            - Interactive deployment wizard
/wf_deploy check      - Run pre-deployment checks only
/wf_deploy preview    - Deploy to preview/staging
/wf_deploy production - Deploy to production
/wf_deploy rollback   - Rollback to previous version
```

---

## Pre-Deployment Checklist

Before any deployment:

```markdown
## 🚀 Pre-Deploy Checklist

### Code Quality
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] ESLint passing (`npx eslint .`)
- [ ] All tests passing (`npm test`)

### Security
- [ ] No hardcoded secrets
- [ ] Environment variables documented
- [ ] Dependencies audited (`npm audit`)

### Performance
- [ ] Bundle size acceptable
- [ ] No console.log statements
- [ ] Images optimized

### Documentation
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] API docs current

### Ready to deploy? (y/n)
```

---

## Deployment Flow

```
┌─────────────────┐
│  /wf_deploy     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pre-flight     │
│  checks         │
└────────┬────────┘
         │
    Pass? ──No──► Fix issues
         │
        Yes
         │
         ▼
┌─────────────────┐
│  Build          │
│  application    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Deploy to      │
│  platform       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Health check   │
│  & verify       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ✅ Complete    │
└─────────────────┘
```

---

## Output Format

### Successful Deploy

```markdown
## 🚀 Deployment Complete

### Summary
- **Version:** v1.2.3
- **Environment:** production
- **Duration:** [build + deploy time]
- **Platform:** Vercel

### URLs
- 🌐 Production: https://app.example.com
- 📊 Dashboard: https://vercel.com/project

### What Changed
- Added user profile feature
- Fixed login bug
- Updated dependencies

### Health Check
✅ API responding (200 OK)
✅ Database connected
✅ All services healthy
```

### Failed Deploy

```markdown
## ❌ Deployment Failed

### Error
Build failed at step: TypeScript compilation

### Details
```
error TS2345: Argument of type 'string' is not assignable...
```

### Resolution
1. Fix TypeScript error in `src/services/user.ts:45`
2. Run `npm run build` locally to verify
3. Try `/wf_deploy` again

### Rollback Available
Previous version (v1.2.2) is still active.
Run `/wf_deploy rollback` if needed.
```

---

## Platform Support

| Platform | Command | Notes |
|----------|---------|-------|
| **Angular** | `ng build --configuration=production` | Static files → serve with Nginx/Apache |
| **Spring Boot (JAR)** | `mvn package -DskipTests` → `java -jar target/*.jar` | Fat JAR, runs anywhere with Java 17+ |
| **Spring Boot (Docker)** | `docker build -t app .` → `docker run -p 8080:8080 app` | Dockerfile with multi-stage build |
| **.NET Core** | `dotnet publish -c Release -o ./publish` | Self-contained or framework-dependent |
| **.NET (Docker)** | `docker build -t app .` → `docker run -p 5000:5000 app` | Official .NET runtime image |
| **Docker Compose** | `docker compose up -d` | Backend + DB + Frontend together |
| **Kubernetes** | `kubectl apply -f k8s/` | For production orchestration |
| **Azure App Service** | `az webapp deploy` | Best for .NET Core apps |
| **AWS ECS / EKS** | Via ECR + task definition | For containerized deployments |

---

## Examples

```
/wf_deploy
/wf_deploy check
/wf_deploy preview
/wf_deploy production
/wf_deploy rollback
```
