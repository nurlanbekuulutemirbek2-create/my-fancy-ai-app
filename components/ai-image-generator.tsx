"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Sparkles, Download, RefreshCw } from "lucide-react"

export function AIImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [style, setStyle] = useState("realistic")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Mock generated image - in real app, this would call AI API
    setGeneratedImage(
      `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(prompt + " " + style + " style")}`,
    )
    setIsGenerating(false)
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              AI Art Studio
              <Sparkles className="h-4 w-4 text-primary animate-pulse-soft" />
            </CardTitle>
            <CardDescription>Create stunning images with AI magic</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your image</Label>
            <Input
              id="prompt"
              placeholder="A magical forest with glowing mushrooms..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Art Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realistic">Realistic</SelectItem>
                <SelectItem value="cartoon">Cartoon</SelectItem>
                <SelectItem value="fantasy">Fantasy</SelectItem>
                <SelectItem value="anime">Anime</SelectItem>
                <SelectItem value="abstract">Abstract</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full rounded-lg h-12 hover:scale-105 transition-transform"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating Magic...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </div>

        {generatedImage && (
          <div className="space-y-4">
            <div className="relative group">
              <img
                src={generatedImage || "/placeholder.svg"}
                alt="Generated artwork"
                className="w-full rounded-lg border-2 border-primary/20 group-hover:border-primary/50 transition-colors"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-lg bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="secondary" onClick={handleGenerate} className="flex-1 rounded-lg">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
            <Badge variant="secondary" className="w-fit">
              Style: {style.charAt(0).toUpperCase() + style.slice(1)}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
