# Digital Wonderland - AI-Powered Creative Platform

A comprehensive Next.js application featuring AI-powered tools for creativity, built with Clerk authentication, OpenAI integration, and Firebase database/storage.

## ✨ Features

### 🎨 AI Art Studio
- Generate stunning artwork using OpenAI's DALL-E 3
- Multiple art styles (realistic, artistic, cartoon, abstract, vintage, fantasy)
- Various image sizes (256x256 to 1792x1024)
- Save generated images to Firebase Storage
- Download and manage your AI artwork

### 🎤 Voice Magic
- Record audio using your microphone
- AI-powered speech-to-text transcription
- Save audio recordings and transcriptions
- Play, download, and manage recordings
- Firebase integration for persistent storage

### 📝 Smart Notes
- Intelligent note-taking with AI assistance
- Organize notes by categories and priorities
- Tag-based organization system
- AI-powered note summaries
- Full CRUD operations with Firebase

### 🤖 AI Buddy
- Chat with multiple AI models (GPT-3.5, GPT-4, GPT-4 Turbo)
- Conversation history and management
- Customizable system prompts
- Quick start prompt templates
- Firebase integration for chat persistence

### 📁 File Upload & Calendar
- Upload files with date-based organization
- Interactive calendar view of uploaded files
- File categorization and descriptions
- Firebase Storage integration
- File preview, download, and management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Clerk account for authentication
- OpenAI API key
- Firebase project

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd my-fancy-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory with the following variables:

   ```bash
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # OpenAI API
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### Firebase Setup

1. **Create a Firebase project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database
   - Enable Storage
   - Get your configuration details

2. **Set up Firestore Database**
   - Create the following collections:
     - `generatedImages` - for AI-generated artwork
     - `voiceRecordings` - for audio recordings
     - `notes` - for smart notes
     - `conversations` - for AI chat history
     - `uploadedFiles` - for file uploads

3. **Set up Storage Rules**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

4. **Set up Firestore Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null && 
           request.auth.uid == resource.data.userId;
       }
     }
   }
   ```

### Clerk Setup

1. **Create a Clerk application**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Create a new application
   - Get your publishable and secret keys
   - Configure authentication methods

### OpenAI Setup

1. **Get OpenAI API key**
   - Go to [OpenAI Platform](https://platform.openai.com/)
   - Create an account and get your API key
   - Add billing information for API usage

## 🏃‍♂️ Running the Application

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Sign up or sign in with Clerk
   - Start exploring the AI-powered features!

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Authentication**: Clerk
- **AI Services**: OpenAI API (GPT-4, DALL-E 3, Whisper)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Styling**: Tailwind CSS, shadcn/ui components
- **Icons**: Lucide React

## 📱 Component Structure

```
components/
├── ai-art-studio.tsx      # AI image generation
├── voice-magic.tsx        # Voice recording & transcription
├── smart-notes.tsx        # Note-taking with AI
├── ai-buddy.tsx          # AI chat assistant
├── file-upload-popup.tsx  # File management & calendar
└── ui/                    # Reusable UI components
```

## 🔧 API Endpoints

The application uses client-side API calls to OpenAI and Firebase. For production, consider creating API routes to secure your API keys.

## 🚨 Important Notes

- **API Keys**: Never commit your `.env.local` file to version control
- **Firebase Security**: Ensure proper security rules are set up
- **Rate Limits**: Be aware of OpenAI API rate limits and costs
- **File Uploads**: Large files may take time to upload to Firebase Storage

## 🎯 Future Enhancements

- [ ] Real-time collaboration features
- [ ] Advanced AI model selection
- [ ] Batch processing for multiple files
- [ ] Export functionality for notes and conversations
- [ ] Mobile app version
- [ ] Advanced analytics and insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the Firebase and Clerk documentation
2. Review the console for error messages
3. Ensure all environment variables are set correctly
4. Verify Firebase security rules are properly configured

---

**Happy Creating! 🎨✨**
