# GitHub Repository Secrets Configuration for Vercel Deployment

This document provides instructions for configuring GitHub repository secrets required for automated Vercel deployment via GitHub Actions.

## Required Secrets

The following secrets must be configured in your GitHub repository settings:

### 1. VERCEL_TOKEN
- **Value**: `K3chphJF2l1u8W0fS1w51qRZ`
- **Description**: Vercel authentication token for API access
- **Usage**: Authenticates GitHub Actions with Vercel for deployment

### 2. VERCEL_PROJECT_ID
- **Value**: `prj_deSZmSE8rnuE4W514spMlCYPNOcj`
- **Description**: Unique identifier for your Vercel project
- **Usage**: Specifies which Vercel project to deploy to

### 3. VERCEL_ORG_ID
- **Value**: `team_Yovw702yUJcSMLmLnpbPzO0H`
- **Description**: Vercel team/organization identifier
- **Usage**: Specifies the Vercel organization context for deployment

## How to Configure Secrets

1. Navigate to your GitHub repository
2. Go to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name and value listed above
5. Ensure all three secrets are properly configured before triggering deployment

## Verification

After configuring the secrets:
1. Push changes to the main/master branch
2. Monitor the GitHub Actions workflow in the **Actions** tab
3. Verify successful deployment to Vercel

## Troubleshooting

- **Authentication Error**: Verify VERCEL_TOKEN is correct and has proper permissions
- **Project Not Found**: Ensure VERCEL_PROJECT_ID matches your Vercel project
- **Organization Error**: Confirm VERCEL_ORG_ID corresponds to your Vercel team

## Security Notes

- Never commit these values to your repository
- Keep secrets confidential and rotate them periodically
- Only authorized team members should have access to these credentials