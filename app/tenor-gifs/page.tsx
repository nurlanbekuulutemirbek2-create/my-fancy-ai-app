'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, Copy, Download, TrendingUp, ArrowLeft, Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { searchTenorGifs, getTrendingGifs, copyGifToClipboard, downloadGif, type TenorGif } from '@/lib/tenor'
import { useToast } from '@/hooks/use-toast'

export default function TenorGifsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [gifs, setGifs] = useState<TenorGif[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [nextPos, setNextPos] = useState<string | null>(null)
  const [apiKeyConfigured, setApiKeyConfigured] = useState(true)
  const [selectedGif, setSelectedGif] = useState<TenorGif | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  // Check if API key is configured
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_TENOR_API_KEY
    if (!apiKey || apiKey === 'your_tenor_api_key_here') {
      setApiKeyConfigured(false)
    }
  }, [])

  useEffect(() => {
    // Don't load anything by default - let user search or click trending
  }, [])

  const loadTrendingGifs = async () => {
    setLoading(true)
    try {
      const response = await getTrendingGifs(20)
      setGifs(response.results)
      setNextPos(response.next)
    } catch (error: unknown) {
      console.error('Error loading trending GIFs:', error)
      let errorMessage = "Failed to load trending GIFs."
      
      if (error instanceof Error) {
        if (error.message?.includes('API key is not configured')) {
          errorMessage = "Tenor API key is not configured. Please check your .env.local file."
        } else if (error.message?.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your internet connection and API key."
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const response = await searchTenorGifs(searchQuery, 20)
      setGifs(response.results)
      setNextPos(response.next)
    } catch (error: unknown) {
      console.error('Error searching GIFs:', error)
      let errorMessage = "Failed to search GIFs."
      
      if (error instanceof Error) {
        if (error.message?.includes('API key is not configured')) {
          errorMessage = "Tenor API key is not configured. Please check your .env.local file."
        } else if (error.message?.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your internet connection and API key."
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  const loadMore = async () => {
    if (!nextPos || !searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await searchTenorGifs(searchQuery, 20, nextPos)
      setGifs(prev => [...prev, ...response.results])
      setNextPos(response.next)
    } catch (error: unknown) {
      console.error('Error loading more GIFs:', error)
      let errorMessage = "Failed to load more GIFs."
      
      if (error instanceof Error) {
        if (error.message?.includes('API key is not configured')) {
          errorMessage = "Tenor API key is not configured. Please check your .env.local file."
        } else if (error.message?.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your internet connection and API key."
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  const handleCopyAnimatedGif = async (gif: TenorGif) => {
    try {
      // Show loading state
      toast({
        title: "Copying GIF...",
        description: "Fetching and copying animated GIF to clipboard",
      })

      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.write) {
        console.log('Clipboard API not available, falling back to URL copy')
        await copyGifToClipboard(gif.media_formats.gif.url)
        toast({
          title: "URL Copied",
          description: "Clipboard API not available. URL copied instead - you can right-click and 'Save image as' to download the animated GIF.",
          variant: "default",
        })
        return
      }

      // Fetch the original GIF blob
      let blob
      try {
        const response = await fetch(gif.media_formats.gif.url)
        if (!response.ok) {
          throw new Error('Failed to fetch GIF data')
        }
        blob = await response.blob()
        console.log('GIF blob size:', blob.size, 'type:', blob.type)
      } catch (fetchError) {
        console.log('Failed to fetch GIF blob:', fetchError)
        await copyGifToClipboard(gif.media_formats.gif.url)
        toast({
          title: "URL Copied",
          description: "Failed to fetch GIF data. URL copied instead - you can right-click and 'Save image as' to download the animated GIF.",
          variant: "default",
        })
        return
      }
      
      // Try different approaches to copy the GIF
      let copySuccess = false
      
      // Approach 1: Try copying as image/gif
      try {
        const clipboardItem = new ClipboardItem({
          'image/gif': blob
        })
        await navigator.clipboard.write([clipboardItem])
        copySuccess = true
        
        toast({
          title: "Animated GIF Copied! 🎬",
          description: "GIF with full animation copied to clipboard - paste it anywhere to see the animation!",
        })
      } catch (gifError) {
        console.log('GIF copy failed:', gifError)
        
        // Approach 2: Try copying as generic image
        try {
          const clipboardItem = new ClipboardItem({
            'image/png': blob
          })
          await navigator.clipboard.write([clipboardItem])
          copySuccess = true
          
          toast({
            title: "GIF Copied!",
            description: "GIF copied to clipboard - animation may be preserved depending on the application you paste into.",
          })
        } catch (pngError) {
          console.log('PNG copy failed:', pngError)
          
          // Approach 3: Try copying as webp
          try {
            const clipboardItem = new ClipboardItem({
              'image/webp': blob
            })
            await navigator.clipboard.write([clipboardItem])
            copySuccess = true
            
            toast({
              title: "GIF Copied!",
              description: "GIF copied to clipboard as WebP format.",
            })
          } catch (webpError) {
            console.log('WebP copy failed:', webpError)
          }
        }
      }
      
      if (copySuccess) {
        return
      }
      
      // If all clipboard approaches fail, fall back to URL copy
      console.log('All clipboard copy methods failed, falling back to URL copy')
      await copyGifToClipboard(gif.media_formats.gif.url)
      toast({
        title: "URL Copied",
        description: "GIF copy to clipboard not supported in this browser. URL copied instead - you can right-click the URL and 'Save image as' to download the animated GIF.",
        variant: "default",
      })
      
    } catch (error: unknown) {
      console.error('Copy animated GIF failed:', error)
      
      // Final fallback: Copy URL and provide instructions
      try {
        await copyGifToClipboard(gif.media_formats.gif.url)
        toast({
          title: "URL Copied",
          description: "GIF copy to clipboard not supported in this browser. URL copied instead - you can right-click the URL and 'Save image as' to download the animated GIF.",
          variant: "default",
        })
      } catch (urlError) {
        toast({
          title: "Copy Failed",
          description: "Unable to copy GIF. Please try downloading instead.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDownloadGif = (gif: TenorGif) => {
    try {
      downloadGif(gif.media_formats.gif.url, `${gif.title || 'tenor-gif'}.gif`)
      toast({
        title: "Downloading",
        description: "GIF download started",
      })
    } catch (error: unknown) {
      console.error('Download failed:', error)
      toast({
        title: "Error",
        description: "Failed to download GIF",
        variant: "destructive",
      })
    }
  }

  const handleOpenGifPopup = (gif: TenorGif) => {
    setSelectedGif(gif)
    setIsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Tenor GIFs
                  </h1>
                  <p className="text-sm text-muted-foreground">Search and discover amazing GIFs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Configuration Warning */}
        {!apiKeyConfigured && (
          <Card className="mb-6 border-0 bg-yellow-50 border-yellow-200 shadow-lg">
            <CardContent className="py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-800">API Key Not Configured</h3>
                  <p className="text-sm text-yellow-700">
                    Please add your Tenor API key to the <code className="bg-yellow-100 px-1 rounded">.env.local</code> file 
                    and restart the server. See <code className="bg-yellow-100 px-1 rounded">TENOR_SETUP.md</code> for instructions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Search Section */}
        <Card className="mb-8 border border-gray-200 bg-white shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Search for the Perfect GIF
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Find and copy amazing GIFs to use anywhere
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSearch} className="flex gap-4">
              <Input
                type="text"
                placeholder="Search for GIFs (e.g., 'dancing cat', 'funny reaction', 'epic fail', 'meme')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-lg border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
              <Button 
                type="submit" 
                disabled={searching || !searchQuery.trim() || !apiKeyConfigured}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 text-white font-semibold px-8"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Search
              </Button>
            </form>
            
            {!searchQuery && (
              <div className="mt-6 text-center">
                <Button 
                  onClick={loadTrendingGifs} 
                  variant="outline"
                  disabled={loading || !apiKeyConfigured}
                  className={`border-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 font-semibold px-6 ${!apiKeyConfigured ? "opacity-50" : ""}`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TrendingUp className="w-4 h-4 mr-2" />
                  )}
                  Show Popular GIFs
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {gifs.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">
                {searchQuery ? `Results for "${searchQuery}"` : 'Popular GIFs'}
              </h2>
              <Badge variant="secondary" className="text-sm bg-orange-100 text-orange-800 border-orange-200 font-semibold">
                {gifs.length} GIFs
              </Badge>
            </div>

            {/* GIF Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {gifs.map((gif) => (
                <Card 
                  key={gif.id} 
                  className="group hover:shadow-2xl transition-all duration-300 border border-gray-200 bg-white shadow-lg hover:shadow-2xl hover:scale-[1.02] cursor-pointer"
                  onClick={() => handleOpenGifPopup(gif)}
                >
                  <CardContent className="p-4">
                    <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={gif.media_formats.gif.url}
                        alt={gif.title || 'GIF'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenGifPopup(gif)
                            }}
                            className="bg-white/90 hover:bg-white text-gray-800 shadow-lg"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View GIF
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-tight">
                        {gif.title || 'Untitled GIF'}
                      </h3>
                      
                      {gif.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {gif.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                              {tag}
                            </Badge>
                          ))}
                          {gif.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-gray-200">
                              +{gif.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {nextPos && searchQuery && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !searching && gifs.length === 0 && searchQuery && (
          <Card className="text-center border border-gray-200 bg-white shadow-xl">
            <CardContent className="py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No GIFs Found
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                Try searching for different keywords or check your spelling.
              </p>
              <Button 
                onClick={loadTrendingGifs} 
                variant="outline"
                className="border-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 font-semibold px-6"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Show Trending GIFs Instead
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* GIF Popup Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 border-2 border-orange-200 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 -m-6 mb-4 rounded-t-lg">
            <DialogTitle className="text-xl font-bold text-white">
              {selectedGif?.title || 'Untitled GIF'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedGif && (
            <div className="space-y-6">
              {/* GIF Display */}
              <div className="relative w-full max-h-96 overflow-hidden rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 border-2 border-blue-200 shadow-lg">
                <img
                  src={selectedGif.media_formats.gif.url}
                  alt={selectedGif.title || 'GIF'}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Tags */}
              {selectedGif.tags.length > 0 && (
                <div className="space-y-3 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Tags:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedGif.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-300 hover:from-blue-200 hover:to-purple-200 transition-colors">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* URL */}
              <div className="space-y-3 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-orange-800 flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  URL:
                </h4>
                <div className="text-xs text-gray-700 break-all bg-white p-3 rounded border border-orange-200 shadow-sm">
                  {selectedGif.media_formats.gif.url}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <Button
                  onClick={() => handleCopyAnimatedGif(selectedGif)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Animated GIF
                </Button>
                <Button
                  onClick={() => handleDownloadGif(selectedGif)}
                  variant="outline"
                  className="flex-1 border-2 border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
