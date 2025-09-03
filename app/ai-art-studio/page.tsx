'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageIcon, Palette, Download, Share2, ArrowLeft, Sparkles, Wand2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AIArtStudioPage() {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('realistic')
  const [size, setSize] = useState('1024x1024')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState('')
  const [error, setError] = useState('')
  const [generationHistory, setGenerationHistory] = useState<Array<{
    id: string
    prompt: string
    style: string
    size: string
    imageUrl: string
    timestamp: Date
    revisedPrompt?: string
  }>>([])

  const artStyles = [
    { value: 'realistic', label: 'Realistic', description: 'Photorealistic images' },
    { value: 'artistic', label: 'Artistic', description: 'Creative and stylized' },
    { value: 'cartoon', label: 'Cartoon', description: 'Fun and animated style' },
    { value: 'abstract', label: 'Abstract', description: 'Non-representational art' },
    { value: 'vintage', label: 'Vintage', description: 'Retro and classic look' },
    { value: 'fantasy', label: 'Fantasy', description: 'Magical and mystical' }
  ]

  const imageSizes = [
    { value: '512x512', label: '512x512' },
    { value: '1024x1024', label: '1024x1024' },
    { value: '1024x1792', label: 'Portrait (1024x1792)' },
    { value: '1792x1024', label: 'Landscape (1792x1024)' }
  ]

  const generateArt = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError('')
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          style,
          size
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const data = await response.json()
      
      const newArt = {
        id: Date.now().toString(),
        prompt,
        style,
        size,
        imageUrl: data.imageUrl,
        timestamp: new Date(),
        revisedPrompt: data.revisedPrompt
      }
      
      setGeneratedImage(data.imageUrl)
      setGenerationHistory(prev => [newArt, ...prev])
      
    } catch (error) {
      console.error('Generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = (imageUrl: string, prompt: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `ai-art-${prompt.slice(0, 20).replace(/\s+/g, '-')}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareImage = async (imageUrl: string, prompt: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Art',
          text: `Check out this AI-generated art: ${prompt}`,
          url: imageUrl
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(imageUrl)
      alert('Image URL copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Art Studio
                </h1>
                <p className="text-sm text-gray-600">Create stunning artwork with OpenAI DALL-E</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generation Panel */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900">
                  <Wand2 className="w-5 h-5 text-purple-600" />
                  <span>Create Your Art</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Describe what you want to create and let OpenAI DALL-E bring it to life
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Describe your artwork</label>
                  <Textarea
                    placeholder="A majestic dragon flying over a mystical forest at sunset..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] resize-none text-gray-900 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    rows={4}
                  />
                </div>

                {/* Style and Size Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Art Style</label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger className="text-gray-900 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue placeholder="Choose style" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {artStyles.map((styleOption) => (
                          <SelectItem key={styleOption.value} value={styleOption.value} className="text-gray-900 hover:bg-gray-100">
                            <div>
                              <div className="font-medium">{styleOption.label}</div>
                              <div className="text-xs text-gray-500">{styleOption.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Image Size</label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger className="text-gray-900 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue placeholder="Choose size" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {imageSizes.map((sizeOption) => (
                          <SelectItem key={sizeOption.value} value={sizeOption.value} className="text-gray-900 hover:bg-gray-100">
                            {sizeOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={generateArt}
                  disabled={!prompt.trim() || isGenerating}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating with DALL-E...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Artwork
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generation History */}
            {generationHistory.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-gray-900">Recent Creations</CardTitle>
                  <CardDescription className="text-gray-600">
                    Your latest AI-generated artworks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {generationHistory.map((art) => (
                      <div key={art.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 mb-2">
                          <img
                            src={art.imageUrl}
                            alt={art.prompt}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate" title={art.prompt}>
                              {art.prompt}
                            </p>
                            <p className="text-xs text-gray-500">
                              {art.style} • {art.size} • {art.timestamp.toLocaleDateString()}
                            </p>
                            {art.revisedPrompt && (
                              <p className="text-xs text-blue-600 mt-1" title={art.revisedPrompt}>
                                AI enhanced: {art.revisedPrompt.slice(0, 50)}...
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadImage(art.imageUrl, art.prompt)}
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => shareImage(art.imageUrl, art.prompt)}
                            title="Share"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Generated Image Display */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900">
                  <Palette className="w-5 h-5 text-pink-600" />
                  <span>Generated Artwork</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Your AI-created masterpiece will appear here
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                    <p className="text-gray-600">OpenAI DALL-E is creating your artwork...</p>
                    <p className="text-sm text-gray-500">This usually takes 10-30 seconds</p>
                  </div>
                ) : generatedImage ? (
                  <div className="space-y-4">
                    <img
                      src={generatedImage}
                      alt={prompt}
                      className="w-full h-auto rounded-lg shadow-lg"
                    />
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => downloadImage(generatedImage, prompt)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        onClick={() => shareImage(generatedImage, prompt)}
                        variant="outline"
                        className="flex-1"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4 text-gray-500">
                    <ImageIcon className="w-16 h-16 opacity-50" />
                    <p>Your artwork will appear here</p>
                    <p className="text-sm">Enter a prompt and click generate to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
