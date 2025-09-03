# Firebase Setup Guide

To use the file upload and calendar functionality, you need to set up Firebase. Follow these steps:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Follow the setup wizard

## 2. Enable Firebase Services

### Enable Firestore Database
1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location close to your users

### Enable Firebase Storage
1. Go to "Storage" in your Firebase project
2. Click "Get started"
3. Choose "Start in test mode" for development
4. Select a location close to your users

## 3. Get Firebase Configuration

1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web app icon (</>)
5. Register your app with a nickname
6. Copy the Firebase configuration object

## 4. Create Environment File

Create a `.env.local` file in your project root with the following content:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Clerk Configuration (if using Clerk for auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

Replace the placeholder values with your actual Firebase configuration.

## 5. Update Security Rules

### Firestore Rules
In your Firestore Database, go to "Rules" and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own uploaded files
    match /uploadedFiles/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Allow users to read and write their own user data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default deny all other requests
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Storage Rules
In your Storage, go to "Rules" and update with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow users to read and write their own uploads
    match /uploads/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default deny all other requests
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## 6. Enable Authentication

Since you're using Clerk for authentication, you need to:

1. Go to Firebase Console > Authentication
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Anonymous" authentication (temporary for development)
5. Or set up proper authentication providers

## 7. Test the Functionality

1. Start your development server: `npm run dev`
2. Click "File Upload & Calendar" button (now opens a separate page)
3. Sign in with Clerk authentication
4. Try uploading files and organizing them by date
5. Check your Firebase console to see uploaded files

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Add your domain to Firebase Auth authorized domains
- For localhost, add `localhost` and `127.0.0.1`

### "Firebase: Error (storage/unauthorized)"
- Check your Storage security rules
- Make sure the rules match the file structure: `/uploads/{userId}/{fileType}/{filename}`

### "Firebase: Error (firestore/permission-denied)"
- Check your Firestore security rules
- Make sure the user is authenticated
- Verify the `userId` field matches the authenticated user's UID

### "Missing or insufficient permissions"
- This usually means the security rules are too restrictive
- Check that your rules allow the authenticated user to access their data
- Make sure the `userId` field in your documents matches the user's UID

## Security Notes

- The current rules allow authenticated users to access only their own files
- For production, implement proper user authentication and authorization
- Consider implementing file size limits and file type restrictions
- Monitor your Firebase usage to avoid unexpected costs
- The rules use `request.auth.uid` which should match the Clerk user ID

## File Structure

Files are organized in Firebase Storage as:
```
uploads/
  {userId}/
    {fileType}/
      {timestamp}-{filename}
```

And metadata is stored in Firestore as:
```
uploadedFiles/
  {documentId}/
    userId: string
    name: string
    size: number
    type: string
    url: string
    storagePath: string
    uploadDate: timestamp
    selectedDate: timestamp
    category: string
    description: string
    fileType: string
```
