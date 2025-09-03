"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  ImageIcon,
  Music,
  FileText,
  Download,
  Trash2,
  Eye,
  Search,
  Sparkles,
  FolderOpen,
  Grid,
  List,
  Filter,
} from "lucide-react"

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  uploadDate: Date
  url: string
  aiInsights?: string
  category: "image" | "audio" | "document" | "other"
}

export function FileManager() {
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: "1",
      name: "project-mockup.png",
      type: "image/png",
      size: 2048000,
      uploadDate: new Date(Date.now() - 86400000),
      url: "/ai-presentation.png",
      category: "image",
      aiInsights:
        "This appears to be a presentation slide about AI technology with colorful graphics and modern design elements.",
    },
    {
      id: "2",
      name: "meeting-recording.mp3",
      type: "audio/mp3",
      size: 5120000,
      uploadDate: new Date(Date.now() - 3600000),
      url: "#",
      category: "audio",
      aiInsights:
        "Audio recording contains discussion about project timelines and team responsibilities. Key topics: deadlines, resource allocation, next steps.",
    },
    {
      id: "3",
      name: "requirements.pdf",
      type: "application/pdf",
      size: 1024000,
      uploadDate: new Date(Date.now() - 7200000),
      url: "#",
      category: "document",
      aiInsights:
        "Document outlines technical requirements for a web platform including authentication, AI tools, and user management features.",
    },
  ])

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (category: string) => {
    switch (category) {
      case "image":
        return <ImageIcon className="h-5 w-5" />
      case "audio":
        return <Music className="h-5 w-5" />
      case "document":
        return <FileText className="h-5 w-5" />
      default:
        return <Trash2 className="h-5 w-5" />
    }
  }

  const getFileCategory = (type: string): UploadedFile["category"] => {
    if (type.startsWith("image/")) return "image"
    if (type.startsWith("audio/")) return "audio"
    if (type.includes("pdf") || type.includes("document") || type.includes("text")) return "document"
    return "other"
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles) return

    setIsUploading(true)
    setUploadProgress(0)

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress(progress)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Simulate AI analysis
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newFile: UploadedFile = {
        id: Date.now().toString() + i,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date(),
        url: URL.createObjectURL(file),
        category: getFileCategory(file.type),
        aiInsights: generateAIInsights(file.name, getFileCategory(file.type)),
      }

      setFiles((prev) => [newFile, ...prev])
    }

    setIsUploading(false)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const generateAIInsights = (fileName: string, category: UploadedFile["category"]) => {
    const insights = {
      image: "Image analysis shows good composition and lighting. Suitable for presentations or web use.",
      audio: "Audio file detected with clear speech. Contains valuable information for transcription or analysis.",
      document: "Document contains structured information with headings and formatted text. Key topics identified.",
      other: "File uploaded successfully. AI analysis available for supported formats.",
    }
    return insights[category]
  }

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || file.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const deleteFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
    if (selectedFile?.id === id) {
      setSelectedFile(null)
    }
  }

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  File Manager
                  <Sparkles className="h-4 w-4 text-green-500 animate-pulse-soft" />
                </CardTitle>
                <CardDescription>Upload and manage files with AI insights</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="rounded-lg"
              >
                {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg hover:scale-105 transition-transform"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
          />

          {/* Upload Progress */}
          {isUploading && (
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uploading files...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              {["all", "image", "audio", "document", "other"].map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-lg capitalize"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Your Files ({filteredFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredFiles.length === 0 ? (
                <div className="text-center py-12">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">No files found</p>
                  <Button onClick={() => fileInputRef.current?.click()} className="rounded-lg">
                    Upload Your First File
                  </Button>
                </div>
              ) : (
                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-2"}>
                  {filteredFiles.map((file) => (
                    <Card
                      key={file.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow border ${
                        selectedFile?.id === file.id ? "border-primary" : "hover:border-primary/30"
                      }`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <CardContent className="p-4">
                        <div className={viewMode === "grid" ? "space-y-3" : "flex items-center gap-4"}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                              {getFileIcon(file.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{file.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)} • {file.uploadDate.toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {viewMode === "grid" && (
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs capitalize">
                                {file.category}
                              </Badge>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteFile(file.id)
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* File Preview & AI Insights */}
        <div className="lg:col-span-1">
          {selectedFile ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">File Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Preview */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Preview</h4>
                  {selectedFile.category === "image" ? (
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      <img
                        src={selectedFile.url || "/placeholder.svg"}
                        alt={selectedFile.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        {getFileIcon(selectedFile.category)}
                        <p className="text-sm text-muted-foreground mt-2">
                          {selectedFile.category === "audio"
                            ? "Audio File"
                            : selectedFile.category === "document"
                              ? "Document"
                              : "File"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="truncate ml-2">{selectedFile.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span>{formatFileSize(selectedFile.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{selectedFile.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uploaded:</span>
                      <span>{selectedFile.uploadDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* AI Insights */}
                {selectedFile.aiInsights && (
                  <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">AI Insights</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedFile.aiInsights}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-lg bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="destructive" onClick={() => deleteFile(selectedFile.id)} className="rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Select a file to view details and AI insights</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Storage Stats */}
      <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">{files.length}</div>
              <div className="text-sm text-muted-foreground">Total Files</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {files.filter((f) => f.category === "image").length}
              </div>
              <div className="text-sm text-muted-foreground">Images</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">
                {files.filter((f) => f.category === "audio").length}
              </div>
              <div className="text-sm text-muted-foreground">Audio Files</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-orange-600">
                {files.filter((f) => f.category === "document").length}
              </div>
              <div className="text-sm text-muted-foreground">Documents</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
