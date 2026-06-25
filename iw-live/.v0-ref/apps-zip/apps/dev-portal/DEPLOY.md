# Deploy to Cloudflare Pages

## Method 1: Git Integration (Recommended)

### Step 1: Create GitHub Repo
1. Go to https://github.com/new
2. Repository name: `integratewise-dev-portal`
3. Make it **Private** (this is internal)
4. Click **Create repository**

### Step 2: Push Code
Copy and run these commands:

```bash
cd /Users/nirmal/Github/integratewise-dev-portal
git remote add origin https://github.com/YOUR_USERNAME/integratewise-dev-portal.git
git branch -M main
git push -u origin main
```

### Step 3: Connect to Cloudflare Pages
1. Go to https://dash.cloudflare.com
2. Navigate to **Pages** → **Create a project**
3. Click **Connect to Git**
4. Select your GitHub account → `integratewise-dev-portal` repo
5. Click **Begin setup**

### Step 4: Build Settings
| Setting | Value |
|---------|-------|
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npm run build` |
| Build output directory | `out` |

Click **Save and Deploy**

### Step 5: Custom Domain
1. After deployment, go to the project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `integratewise.ai`
4. Follow DNS instructions (add CNAME record)

---

## Method 2: Direct Upload (No Git)

If you don't want to use GitHub:

1. Go to https://dash.cloudflare.com → **Pages** → **Create a project**
2. Click **Upload assets** instead of "Connect to Git"
3. Drag and drop the entire `integratewise-dev-portal` folder
4. Add custom domain `integratewise.ai`

**Note:** With direct upload, you'll need to re-upload for every change.

---

## Method 3: Wrangler CLI (If you have Node.js elsewhere)

```bash
npm install -g wrangler
npx wrangler login
npx wrangler pages deploy out --project-name=integratewise-ai-portal
```

---

## Post-Deployment Checklist

- [ ] Site loads at `https://integratewise.ai`
- [ ] AI Context files accessible:
  - `https://integratewise.ai/llm.txt`
  - `https://integratewise.ai/context.json`
  - `https://integratewise.ai/.well-known/ai-context.json`
- [ ] All 6 tabs working
- [ ] Mobile responsive
