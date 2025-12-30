# GitHub Pages Deployment Guide

This project is configured to deploy to GitHub Pages using `gh-pages`.

## Prerequisites

1. Make sure you have `gh-pages` installed (already installed as dev dependency)
2. Ensure your repository is connected to GitHub
3. Make sure you have push access to the repository

## Deployment Steps

### First Time Setup

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

   This will:
   - Build your project (via `predeploy` script)
   - Deploy the `dist` folder to the `gh-pages` branch
   - Make your site available at: `https://praneth2580.github.io/Storix`

### Subsequent Deployments

Simply run:
```bash
npm run deploy
```

## Configuration

- **Base Path**: The app is configured with base path `/Storix/` in `vite.config.ts`
- **Homepage**: Set in `package.json` as `https://praneth2580.github.io/Storix`

### Changing the Base Path

If your repository name is different, update:

1. **vite.config.ts:**
   ```typescript
   base: process.env.NODE_ENV === 'production' ? '/Your-Repo-Name/' : '/',
   ```

2. **package.json:**
   ```json
   "homepage": "https://YOUR_USERNAME.github.io/Your-Repo-Name",
   ```

### For User/Organization Pages

If your repository is named `username.github.io`, set the base to `/`:

**vite.config.ts:**
```typescript
base: '/',
```

**package.json:**
```json
"homepage": "https://YOUR_USERNAME.github.io",
```

## GitHub Repository Settings

After the first deployment:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Ensure the source is set to **Deploy from a branch**
4. Select **gh-pages** branch
5. Select the `/ (root)` folder
6. Click **Save**

Your site should be live at: `https://praneth2580.github.io/Storix`

## Troubleshooting

- If the site shows a 404, verify the base path matches your repository name
- If assets aren't loading, check that the base path in `vite.config.ts` is correct
- Clear browser cache after deployment if you see old content
- Check the `gh-pages` branch was created and contains your `dist` files

