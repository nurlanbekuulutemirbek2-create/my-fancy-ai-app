'use client'

import { useState } from 'react'
import { SignIn, SignUp, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Mic, ImageIcon, FileText, Bot, Star, Heart, Zap, Upload } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 animate-float">
          <Sparkles className="w-8 h-8 text-purple-400" />
        </div>
        <div className="absolute top-40 right-20 animate-bounce-gentle">
          <Star className="w-6 h-6 text-yellow-400" />
        </div>
        <div className="absolute bottom-40 left-20 animate-pulse-soft">
          <Heart className="w-7 h-7 text-pink-400" />
        </div>
        <div className="absolute top-60 left-1/2 animate-float">
          <Zap className="w-5 h-5 text-blue-400" />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Digital Wonderland
                </h1>
                <p className="text-sm text-muted-foreground">Your AI-powered playground for creativity and fun! ✨</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <SignedOut>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAuthMode('signin')}
                  >
                    Sign In
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setAuthMode('signup')}
                  >
                    Sign Up
                  </Button>
                </div>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center space-x-2">
                  <Link href="/file-upload">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Upload className="w-4 h-4 mr-2" />
                      File Upload & Calendar
                    </Button>
                  </Link>
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10"
                      }
                    }}
                  />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <SignedOut>
        <main className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Welcome to Digital Wonderland! 🎨
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Join our magical AI-powered playground where creativity knows no bounds! 
              Create stunning artwork, transform voice to text, and explore endless possibilities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800">AI Art Studio</h3>
                <p className="text-sm text-gray-600">Create amazing artwork</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800">Voice Magic</h3>
                <p className="text-sm text-gray-600">Transform voice to text</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800">AI Buddy</h3>
                <p className="text-sm text-gray-600">Your creative companion</p>
              </div>
            </div>
            
            {/* Single Authentication Component */}
            <div className="max-w-md mx-auto">
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    {authMode === 'signup' ? 'Join Digital Wonderland' : 'Welcome Back!'}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {authMode === 'signup' 
                      ? 'Create your account to start creating amazing AI art and more!'
                      : 'Sign in to continue your creative journey!'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {authMode === 'signup' ? (
                    <SignUp routing="hash" />
                  ) : (
                    <SignIn routing="hash" />
                  )}
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-purple-600"
                        onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                      >
                        {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
                      </Button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </SignedOut>

      {/* Signed In Content */}
      <SignedIn>
        <main className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Welcome to Your Digital Playground! 🎨
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore the magic of AI-powered creativity with our suite of innovative tools. 
              From generating stunning artwork to transcribing voice notes, everything you need is here!
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* AI Art Studio */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800">AI Art Studio</CardTitle>
                <CardDescription className="text-gray-600">
                  Create stunning artwork with the power of AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/ai-art-studio" className="w-full">
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    Start Creating
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Voice Magic */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800">Voice Magic</CardTitle>
                <CardDescription className="text-gray-600">
                  Transform your voice into text with AI transcription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/voice-magic" className="w-full">
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                  >
                    Start Recording
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Smart Notes */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800">Smart Notes</CardTitle>
                <CardDescription className="text-gray-600">
                  Organize your thoughts with intelligent note-taking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/smart-notes" className="w-full">
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    Start Writing
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* AI Buddy */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800">AI Buddy</CardTitle>
                <CardDescription className="text-gray-600">
                  Chat with your personal AI assistant for help and ideas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/ai-buddy" className="w-full">
                  <Button
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                  >
                    Chat Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Feature Overview */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border-0">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Explore Your AI Tools</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Click on any of the feature cards above to dive into that specific tool. Each feature opens in its own dedicated page 
                with a full interface designed for that particular functionality. Navigate back to the dashboard anytime using the 
                &ldquo;Back to Dashboard&rdquo; link in each tool&apos;s header.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Zap className="w-4 h-4" />
                <span>Each tool is optimized for its specific use case</span>
              </div>
            </div>
          </div>
        </main>
      </SignedIn>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            Made with ❤️ by Temir | Powered by Next.js & Clerk
          </p>
        </div>
      </footer>
    </div>
  )
}
