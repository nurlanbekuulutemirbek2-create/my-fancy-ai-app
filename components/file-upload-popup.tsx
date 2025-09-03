'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, Upload, File, X, Download, Trash2, Eye, CalendarDays, FolderOpen, Loader2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase'
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  storagePath: string
  uploadDate: Date
  selectedDate: Date
  category: string
  description: string
  userId: string
}

export default function FileUploadPopup() {
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [description, setDescription] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const categories = [
    'general', 'work', 'personal', 'documents', 'images', 'videos', 'audio', 'archives'
  ]

  const fileTypes = {
    'image': ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    'video': ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    'audio': ['mp3', 'wav', 'flac', 'aac', 'ogg'],
    'document': ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
    'spreadsheet': ['xls', 'xlsx', 'csv', 'ods'],
    'presentation': ['ppt', 'pptx', 'odp'],
    'archive': ['zip', 'rar', '7z', 'tar', 'gz']
  }

  // Load calendar events when component mounts
  useEffect(() => {
    if (isOpen && user) {
      loadCalendarEvents()
    }
  }, [isOpen, user])

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (fileTypes.image.includes(extension || '')) return '🖼️'
    if (fileTypes.video.includes(extension || '')) return '🎥'
    if (fileTypes.audio.includes(extension || '')) return '🎵'
    if (fileTypes.document.includes(extension || '')) return '📄'
    if (fileTypes.spreadsheet.includes(extension || '')) return '📊'
    if (fileTypes.presentation.includes(extension || '')) return '📽️'
    if (fileTypes.archive.includes(extension || '')) return '📦'
    return '📁'
  }

  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    for (const [type, extensions] of Object.entries(fileTypes)) {
      if (extensions.includes(extension || '')) return type
    }
    return 'other'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
  }

  const uploadFiles = async () => {
    if (!selectedFiles.length || !user) return

    setIsUploading(true)
    setError('')
    const newUploadedFiles: UploadedFile[] = []

    try {
      for (const file of selectedFiles) {
        const fileType = getFileType(file.name)
        const filename = `${Date.now()}-${file.name}`
        const storagePath = `uploads/${user.id}/${fileType}/${filename}`
        const storageRef = ref(storage, storagePath)

        // Upload file to Firebase Storage
        await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(storageRef)

        // Create file metadata
        const fileData: UploadedFile = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: downloadURL,
          storagePath,
          uploadDate: new Date(),
          selectedDate,
          category: selectedCategory,
          description,
          userId: user.id
        }

        // Save metadata to Firestore
        const docRef = await addDoc(collection(db, 'uploadedFiles'), {
          userId: user.id,
          userEmail: user.emailAddresses[0]?.emailAddress,
          name: file.name,
          size: file.size,
          type: file.type,
          url: downloadURL,
          storagePath,
          uploadDate: serverTimestamp(),
          selectedDate: selectedDate,
          category: selectedCategory,
          description,
          fileType
        })

        fileData.id = docRef.id
        newUploadedFiles.push(fileData)
      }

      // Update local state
      setUploadedFiles(prev => [...newUploadedFiles, ...prev])
      setSelectedFiles([])
      setDescription('')
      setSelectedDate(new Date())
      
      // Refresh calendar events
      loadCalendarEvents()

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError('Upload failed: ' + errorMessage)
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const loadCalendarEvents = async () => {
    if (!user) return

    try {
      const filesRef = collection(db, 'uploadedFiles')
      const q = query(
        filesRef,
        where('userId', '==', user.id),
        orderBy('selectedDate', 'desc')
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const filesData: UploadedFile[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          filesData.push({
            id: doc.id,
            name: data.name,
            size: data.size,
            type: data.type,
            url: data.url,
            storagePath: data.storagePath,
            uploadDate: data.uploadDate?.toDate() || new Date(),
            selectedDate: data.selectedDate?.toDate() || new Date(),
            category: data.category,
            description: data.description,
            userId: data.userId
          })
        })

        setUploadedFiles(filesData)
      })

      return unsubscribe
    } catch (error) {
      console.error('Error loading calendar events:', error)
      setError('Failed to load calendar events')
    }
  }

  const deleteFile = async (file: UploadedFile) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      // Delete from Firebase Storage
      const storageRef = ref(storage, file.storagePath)
      await deleteObject(storageRef)

      // Delete from Firestore
      await deleteDoc(doc(db, 'uploadedFiles', file.id))

      // Update local state
      setUploadedFiles(prev => prev.filter(f => f.id !== file.id))
      
      // Refresh calendar events
      loadCalendarEvents()

    } catch (error) {
      console.error('Error deleting file:', error)
      setError('Failed to delete file')
    }
  }

  const downloadFile = async (file: UploadedFile) => {
    try {
      const response = await fetch(file.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading file:', error)
      setError('Failed to download file')
    }
  }

  const openFile = (file: UploadedFile) => {
    window.open(file.url, '_blank')
  }

  const getCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    const days = eachDayOfInterval({ start, end })
    
    return days
  }

  const getFilesForDate = (date: Date) => {
    return uploadedFiles.filter(file => isSameDay(file.selectedDate, date))
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1))

  return (
    <>
      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Upload className="w-4 h-4 mr-2" />
        File Upload & Calendar
      </Button>

      {/* Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">File Upload & Calendar</h2>
                <p className="text-gray-600">Upload files and organize them by date</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* File Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    <span>Upload Files</span>
                  </CardTitle>
                  <CardDescription>
                    Select files and assign them to specific dates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select Files</label>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="border-dashed border-2 border-gray-300 hover:border-blue-400"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Files
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <span className="text-sm text-gray-500">
                        {selectedFiles.length} file(s) selected
                      </span>
                    </div>
                  </div>

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Selected Files</label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                            <span>{getFileIcon(file.name)}</span>
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date and Category Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Date</label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={format(selectedDate, 'yyyy-MM-dd')}
                          onChange={(e) => setSelectedDate(new Date(e.target.value))}
                          className="pr-10"
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional description..."
                      />
                    </div>
                  </div>

                  {/* Upload Button */}
                  <Button
                    onClick={uploadFiles}
                    disabled={!selectedFiles.length || isUploading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Files
                      </>
                    )}
                  </Button>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Calendar Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarDays className="w-5 h-5 text-green-600" />
                    <span>File Calendar</span>
                  </CardTitle>
                  <CardDescription>
                    View your files organized by date
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Calendar Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <Button variant="outline" onClick={prevMonth}>
                      ← Previous
                    </Button>
                    <h3 className="text-lg font-semibold">
                      {format(currentMonth, 'MMMM yyyy')}
                    </h3>
                    <Button variant="outline" onClick={nextMonth}>
                      Next →
                    </Button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day Headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
                        {day}
                      </div>
                    ))}

                    {/* Calendar Days */}
                    {getCalendarDays().map((day, index) => {
                      const filesForDay = getFilesForDate(day)
                      const isCurrentDay = isToday(day)
                      const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                      const isSelected = isSameDay(day, selectedDate)

                      return (
                        <div
                          key={index}
                          className={`p-2 min-h-[80px] border border-gray-200 hover:bg-gray-50 cursor-pointer transition-all duration-200 ease-in-out ${
                            isCurrentDay ? 'bg-blue-50 border-blue-300 shadow-sm' : ''
                          } ${!isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''} ${
                            isSelected ? 'ring-2 ring-blue-400 bg-blue-100' : ''
                          }`}
                          onClick={() => setSelectedDate(day)}
                        >
                          <div className={`text-sm font-medium mb-1 ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
                            {format(day, 'd')}
                          </div>
                          {filesForDay.length > 0 && (
                            <div className="space-y-1 animate-in">
                              {filesForDay.slice(0, 2).map(file => (
                                <div
                                  key={file.id}
                                  className="text-xs bg-blue-100 text-blue-800 p-1 rounded truncate hover:bg-blue-200 transition-colors duration-150"
                                  title={file.name}
                                >
                                  {getFileIcon(file.name)} {file.name.slice(0, 10)}...
                                </div>
                              ))}
                              {filesForDay.length > 2 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{filesForDay.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Files List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FolderOpen className="w-5 h-5 text-purple-600" />
                    <span>Uploaded Files</span>
                  </CardTitle>
                  <CardDescription>
                    Manage your uploaded files
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getFileIcon(file.name)}</span>
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>{formatFileSize(file.size)}</span>
                              <span>•</span>
                              <span>{format(file.selectedDate, 'MMM d, yyyy')}</span>
                              <span>•</span>
                              <Badge variant="outline">{file.category}</Badge>
                            </div>
                            {file.description && (
                              <p className="text-xs text-gray-600 mt-1">{file.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openFile(file)}
                            title="View file"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadFile(file)}
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFile(file)}
                            title="Delete file"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {uploadedFiles.length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <FolderOpen className="w-16 h-16 mx-auto mb-2 opacity-50" />
                        <p>No files uploaded yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
