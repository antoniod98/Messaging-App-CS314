# GitHub Actions CI/CD Workflows

## What This Does

Runs tests automatically on every push to make sure nothing breaks.

### Workflow: `ci.yml`

**Runs when:**
- Pushing to `main` or `antonio-branch`
- Opening a PR to `main`

**Jobs:**

1. **Backend Tests** (`backend-tests`)
   - Ubuntu + Node.js 22.x
   - Clean install with `npm ci`
   - Sets up test env vars
   - Runs 151 Jest tests
   - Coverage report
   - Uploads to Codecov (optional, can skip)

2. **Frontend Tests** (`frontend-tests`)
   - Ubuntu + Node.js 22.x
   - Clean install with `npm ci`
   - ESLint checks
   - Runs 43 Vitest tests
   - Coverage report
   - Uploads to Codecov (optional)

3. **Build Frontend** (`build-frontend`)
   - Only runs if frontend tests pass
   - Vite production build
   - Keeps artifacts for 7 days

4. **Integration Check** (`integration-check`)
   - Only runs after both test suites pass
   - Spins up backend server
   - Hits API health check endpoint

### Coverage Thresholds

**Backend:**
- Statements: 70%+
- Branches: 69%+
- Functions: 70%+
- Lines: 70%+

**Frontend:**
- Just runs the tests, no hard thresholds

### Running Locally

Want to test before pushing? Run these:

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run lint
npm run test:coverage

# Frontend build
cd frontend
npm run build
```

### Add a Status Badge (Optional)

Put this at the top of your README.md:

```markdown
![CI Status](https://github.com/YOUR_USERNAME/Messaging-App-CS314/workflows/CI%2FCD%20Pipeline/badge.svg)
```

Just swap `YOUR_USERNAME` with your actual GitHub handle.

### Codecov Setup (If You Want It)

Track coverage trends over time:

1. Sign up at codecov.io with GitHub
2. Connect your repo
3. Add `CODECOV_TOKEN` to repo secrets (Settings → Secrets → Actions)
4. Done - uploads happen automatically

### Deployment (Not Set Up Yet)

There's a deploy job commented out in the workflow. When you're ready:

1. Uncomment the deploy section
2. Add your deploy commands
3. Set up deployment secrets
4. Push to main and it'll auto-deploy

### Common Issues

**Tests pass locally but fail in CI?**
- Make sure you're on Node 22.x
- Check that everything's in package.json, not just installed locally
- Could be env-specific weirdness

**Coverage uploads failing?**
- They're set to `continue-on-error` so they won't block anything
- Totally optional, ignore if you're not using Codecov

**CI taking forever?**
- Already using `npm ci` which is faster than `npm install`
- Dependencies get cached so subsequent runs are quicker
