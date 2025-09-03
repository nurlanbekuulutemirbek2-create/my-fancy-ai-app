'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ImageIcon, Download, Save, Sparkles, Loader2, Palette, Camera } from 'lucide-react'
import openai from '@/lib/openai'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase'
import { useUser } from '@clerk/nextjs'

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  style: string
  size: string
  timestamp: Date
}

export default function AIArtStudio() {
  const { user } = useUser()
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('realistic')
  const [size, setSize] = useState('1024x1024')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null)
  const [error, setError] = useState('')
  const [savedImages, setSavedImages] = useState<GeneratedImage[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const artStyles = [
    { value: 'realistic', label: 'Realistic', description: 'Photorealistic style' },
    { value: 'artistic', label: 'Artistic', description: 'Creative artistic style' },
    { value: 'cartoon', label: 'Cartoon', description: 'Fun cartoon style' },
    { value: 'abstract', label: 'Abstract', description: 'Abstract modern art' },
    { value: 'vintage', label: 'Vintage', description: 'Retro vintage style' },
    { value: 'fantasy', label: 'Fantasy', description: 'Magical fantasy style' }
  ]

  const imageSizes = [
    { value: '256x256', label: 'Small (256x256)' },
    { value: '512x512', label: 'Medium (512x512)' },
    { value: '1024x1024', label: 'Large (1024x1024)' },
    { value: '1792x1024', label: 'Wide (1792x1024)' },
    { value: '1024x1792', label: 'Tall (1024x1792)' }
  ]

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const enhancedPrompt = `${prompt}, ${style} style, high quality, detailed`
      
              const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          size: size as "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792",
          quality: "standard",
          n: 1,
        })

      if (response.data && response.data[0]) {
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          url: response.data[0].url!,
          prompt,
          style,
          size,
          timestamp: new Date()
        }
        
        setGeneratedImage(newImage)
        setError('')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image'
      setError(errorMessage)
      console.error('Image generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveToFirebase = async () => {
    if (!generatedImage || !user) return

    try {
      // Download the image and convert to blob
      const response = await fetch(generatedImage.url)
      const blob = await response.blob()
      
      // Create a unique filename
      const filename = `ai-art/${user.id}/${Date.now()}-${generatedImage.prompt.slice(0, 20)}.png`
      const storageRef = ref(storage, filename)
      
      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob)
      const downloadURL = await getDownloadURL(storageRef)
      
      // Save metadata to Firestore
      const docRef = await addDoc(collection(db, 'generatedImages'), {
        userId: user.id,
        userEmail: user.emailAddresses[0]?.emailAddress,
        prompt: generatedImage.prompt,
        style: generatedImage.style,
        size: generatedImage.size,
        imageUrl: downloadURL,
        storagePath: filename,
        timestamp: serverTimestamp(),
        promptTokens: generatedImage.prompt.length,
        totalTokens: generatedImage.prompt.length + 100 // Approximate
      })

      // Update local state
      const savedImage = { ...generatedImage, id: docRef.id, url: downloadURL }
      setSavedImages(prev => [savedImage, ...prev])
      
      alert('Image saved successfully!')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError('Failed to save image: ' + errorMessage)
      console.error('Save error:', err)
    }
  }

  const downloadImage = async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-art-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError('Failed to download image: ' + errorMessage)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Handle file upload logic here
      console.log('File selected:', file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Palette className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-800">AI Art Studio</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Transform your imagination into stunning artwork with the power of AI. 
          Describe what you want to see, choose your style, and watch the magic happen!
        </p>
      </div>

      {/* Main Generation Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>Create Your Artwork</span>
            </CardTitle>
            <CardDescription>
              Describe your vision and let AI bring it to life
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Describe your artwork</label>
              <Textarea
                placeholder="A majestic dragon flying over a medieval castle at sunset, with golden clouds..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 text-right">
                {prompt.length}/1000 characters
              </div>
            </div>

            {/* Style Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Art Style</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select art style" />
                </SelectTrigger>
                <SelectContent>
                  {artStyles.map((styleOption) => (
                    <SelectItem key={styleOption.value} value={styleOption.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{styleOption.label}</span>
                        <span className="text-xs text-gray-500">{styleOption.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Image Size</label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select image size" />
                </SelectTrigger>
                <SelectContent>
                  {imageSizes.map((sizeOption) => (
                    <SelectItem key={sizeOption.value} value={sizeOption.value}>
                      {sizeOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateImage}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Artwork...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Artwork
                </>
              )}
            </Button>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Image Display */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              <span>Your Generated Artwork</span>
            </CardTitle>
            <CardDescription>
              {generatedImage ? 'Your AI masterpiece is ready!' : 'Your artwork will appear here'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedImage ? (
              <div className="space-y-4">
                {/* Image Display */}
                <div className="relative group">
                  <img
                    src={generatedImage.url}
                    alt={generatedImage.prompt}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-2">
                      <Button
                        onClick={downloadImage}
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        onClick={saveToFirebase}
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Image Details */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{generatedImage.style}</Badge>
                    <Badge variant="outline">{generatedImage.size}</Badge>
                  </div>
                                        <p className="text-sm text-gray-600 italic">&ldquo;{generatedImage.prompt}&rdquo;</p>
                  <p className="text-xs text-gray-500">
                    Generated on {generatedImage.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center text-gray-500">
                  <ImageIcon className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>Your artwork will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File Upload Section */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-purple-600" />
            <span>Upload Reference Images</span>
          </CardTitle>
          <CardDescription>
            Upload images to inspire your AI artwork or use as reference
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-dashed border-2 border-gray-300 hover:border-purple-400"
            >
              <Camera className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
            <p className="text-sm text-gray-500">
              Supported formats: JPG, PNG, GIF (Max 10MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            multiple
          />
        </CardContent>
      </Card>

      {/* Saved Images Gallery */}
      {savedImages.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Your Saved Artwork</CardTitle>
            <CardDescription>
              A collection of your AI-generated masterpieces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {savedImages.map((image) => (
                <div key={image.id} className="group relative">
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-32 object-cover rounded-lg shadow-md"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center text-white">
                      <p className="text-xs px-2">{image.prompt.slice(0, 30)}&hellip;</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {image.style}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
