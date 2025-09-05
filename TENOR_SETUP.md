# Tenor API Setup Guide

## Overview
This guide will help you set up the Tenor API integration for your Digital Wonderland app. The Tenor API allows users to search for and copy GIFs directly from your application.

## Prerequisites
- Google Cloud account
- Tenor API enabled in Google Cloud Console

## Step 1: Enable Tenor API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Tenor API"
5. Click on "Tenor API" and then click "Enable"

## Step 2: Create API Key
1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Optional) Restrict the API key to only Tenor API for security

## Step 3: Configure Environment Variables
1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add the following line:
   ```
   NEXT_PUBLIC_TENOR_API_KEY=your_actual_api_key_here
   ```
3. Replace `your_actual_api_key_here` with the API key you copied in Step 2

## Step 4: Restart Your Development Server
After adding the environment variable, restart your Next.js development server:
```bash
npm run dev
# or
yarn dev
```

## Features
Once configured, users can:
- Search for GIFs using keywords
- View trending GIFs
- Copy GIF URLs to clipboard
- Download GIFs directly
- Browse full-screen in the dedicated Tenor page

## API Limits
- The Tenor API has rate limits based on your Google Cloud project
- Default limit is 1000 requests per day
- You can request quota increases in Google Cloud Console

## Troubleshooting
- **"API key is not configured"**: Check that your `.env.local` file exists and contains the correct API key
- **"Failed to search GIFs"**: Verify your API key is correct and the Tenor API is enabled
- **Rate limiting errors**: Check your Google Cloud Console for current usage and limits

## Security Notes
- The API key is exposed to the client (hence `NEXT_PUBLIC_` prefix)
- For production use, consider implementing server-side API calls
- You can restrict the API key to only work from specific domains in Google Cloud Console

## Support
If you encounter issues:
1. Check the browser console for error messages
2. Verify your API key in Google Cloud Console
3. Ensure the Tenor API is enabled for your project
4. Check your API quota and usage limits
