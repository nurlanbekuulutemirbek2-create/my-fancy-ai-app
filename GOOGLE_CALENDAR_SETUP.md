# Google Calendar API Integration Setup Guide

## 🎯 **Overview**
This guide will help you set up Google Calendar API integration for your Voice Magic feature, allowing users to automatically add extracted tasks and events to their Google Calendar.

## 🚀 **Quick Start (Recommended for Testing)**

### **Option 1: Simple Calendar Links (No API Setup Required)**
- ✅ **Already implemented** - Works immediately
- ✅ No API keys or OAuth setup needed
- ✅ Opens Google Calendar in browser with pre-filled event details
- ⚠️ User needs to manually confirm each event

**How it works:**
1. User records voice and AI extracts tasks
2. User selects tasks and clicks "Add to Google Calendar"
3. Browser opens Google Calendar with pre-filled event details
4. User reviews and saves the event

## 🔧 **Advanced Setup (Full API Integration)**

### **Option 2: Google Calendar API (Production Ready)**
- ✅ **Fully automated** - Events added directly to calendar
- ✅ Professional user experience
- ✅ Can set reminders, colors, and full event details
- ⚠️ Requires OAuth setup and API configuration

### **Step 1: Google Cloud Console Setup**

1. **Go to Google Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **Create a New Project or Select Existing**
   - Click on project dropdown → "New Project"
   - Name: "Voice Magic Calendar Integration"
   - Click "Create"

3. **Enable Google Calendar API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Voice Magic Web Client"
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/google/callback
     https://yourdomain.com/api/auth/google/callback
     ```

5. **Download Credentials**
   - Download the JSON file
   - Save it securely

### **Step 2: Environment Variables**

Add these to your `.env.local` file:

```bash
# Google Calendar API
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### **Step 3: Install Dependencies**

```bash
npm install googleapis
```

### **Step 4: OAuth Flow Implementation**

Create an OAuth callback handler:

```typescript
// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.redirect('/voice-magic?error=no_code')
  }

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    
    // Store tokens securely (session, database, etc.)
    // Redirect back to Voice Magic with success
    return NextResponse.redirect('/voice-magic?success=auth')
  } catch (error) {
    return NextResponse.redirect('/voice-magic?error=auth_failed')
  }
}
```

## 🎨 **Features Available**

### **With Simple Calendar Links:**
- ✅ Event title and description
- ✅ Date and time
- ✅ Priority and category info
- ✅ Opens in Google Calendar
- ✅ Works with Outlook and Apple Calendar too

### **With Full API Integration:**
- ✅ All above features
- ✅ Automatic event creation
- ✅ Custom colors based on priority
- ✅ Reminders (popup + email)
- ✅ Timezone handling
- ✅ Recurring events support
- ✅ Calendar selection

## 🔄 **How It Works**

1. **Voice Recording**: User records their plans
2. **AI Transcription**: OpenAI Whisper converts speech to text
3. **Task Extraction**: AI analyzes text and extracts structured tasks
4. **Calendar Integration**: 
   - **Simple**: Opens Google Calendar with pre-filled details
   - **Advanced**: Directly adds events to user's calendar
5. **User Confirmation**: User reviews and saves events

## 🚨 **Security Considerations**

- **OAuth Tokens**: Store securely, never expose in client code
- **API Quotas**: Google Calendar API has daily limits
- **User Consent**: Always get explicit permission
- **Data Privacy**: Only access calendars user authorizes

## 🧪 **Testing**

### **Test Simple Integration:**
1. Go to Voice Magic page
2. Record a voice message
3. Select extracted tasks
4. Click "Add to Google Calendar"
5. Verify Google Calendar opens with event details

### **Test Full API Integration:**
1. Complete OAuth setup
2. Authorize your Google account
3. Record and extract tasks
4. Verify events appear in your Google Calendar

## 📱 **Mobile Support**

- **Simple Links**: Work on all devices
- **API Integration**: Works on mobile web
- **Native Apps**: Can integrate with mobile calendar apps

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"Failed to open Google Calendar"**
   - Check browser popup blockers
   - Verify API route is working

2. **"OAuth error"**
   - Check client ID/secret
   - Verify redirect URI matches

3. **"API quota exceeded"**
   - Check Google Cloud Console quotas
   - Implement rate limiting

### **Debug Steps:**
1. Check browser console for errors
2. Verify API responses in Network tab
3. Check server logs for backend errors
4. Test API endpoints with Postman/Insomnia

## 🎉 **Next Steps**

1. **Start with Simple Integration** (already working)
2. **Test thoroughly** with different voice inputs
3. **Implement OAuth** when ready for production
4. **Add error handling** and user feedback
5. **Consider adding** calendar selection options

## 📚 **Resources**

- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Calendar Event Format](https://developers.google.com/calendar/api/v3/reference/events)
- [API Quotas and Limits](https://developers.google.com/calendar/api/quotas)

---

**Current Status**: ✅ Simple Calendar Links implemented and working
**Next Phase**: 🔄 Full API integration (when ready)
