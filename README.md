# PU IntelliQ - Deployment Guide

## Deploying to Netlify

This application is ready to be deployed as a static Single Page Application (SPA) on Netlify.

### Prerequisites

- A [Netlify](https://www.netlify.com/) account.
- A [Gemini API Key](https://aistudio.google.com/app/apikey).

### Deployment Steps

1. **Push your code to a Git repository** (GitHub, GitLab, or Bitbucket).
2. **Connect your repository to Netlify**:
   - Go to your Netlify dashboard and click **"Add new site"** > **"Import an existing project"**.
   - Select your Git provider and the repository.
3. **Configure Build Settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. **Set Environment Variables**:
   - In the Netlify dashboard, go to **Site settings** > **Environment variables**.
   - Add a new variable:
     - **Key**: `GEMINI_API_KEY`
     - **Value**: Your actual Gemini API key.
5. **Deploy**:
   - Click **"Deploy site"**. Netlify will build and host your application.

### Important Note on Full-Stack Features

The current application uses an Express server (`server.ts`) for local development and health checks. When deployed to Netlify as a static site, this server will **not** run. However, since the AI generation logic is implemented in the frontend, the core functionality will work perfectly as a static site.
