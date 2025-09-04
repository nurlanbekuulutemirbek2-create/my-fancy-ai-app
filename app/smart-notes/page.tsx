'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Search, Calendar, Edit3, Trash2, Star, ArrowLeft, Save, Lightbulb, Mic, MicOff, Square, Loader2, AlertCircle, X } from 'lucide-react'
import Link from 'next/link'

interface Note {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
}

export default function SmartNotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState('')
  const [language, setLanguage] = useState('en-US')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const categories = [
    { value: 'all', label: 'All Notes', color: 'bg-gray-100 text-gray-800' },
    { value: 'work', label: 'Work', color: 'bg-blue-100 text-blue-800' },
    { value: 'personal', label: 'Personal', color: 'bg-green-100 text-green-800' },
    { value: 'ideas', label: 'Ideas', color: 'bg-purple-100 text-purple-800' },
    { value: 'meetings', label: 'Meetings', color: 'bg-orange-100 text-orange-800' },
    { value: 'tasks', label: 'Tasks', color: 'bg-red-100 text-red-800' }
  ]

  const languages = [
    { value: 'en-US', label: 'English (US)', flag: '🇺🇸' },
    { value: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
    { value: 'es-ES', label: 'Spanish', flag: '🇪🇸' },
    { value: 'fr-FR', label: 'French', flag: '🇫🇷' },
    { value: 'de-DE', label: 'German', flag: '🇩🇪' },
    { value: 'it-IT', label: 'Italian', flag: '🇮🇹' },
    { value: 'pt-BR', label: 'Portuguese', flag: '🇧🇷' },
    { value: 'ja-JP', label: 'Japanese', flag: '🇯🇵' },
    { value: 'ko-KR', label: 'Korean', flag: '🇰🇷' },
    { value: 'zh-CN', label: 'Chinese', flag: '🇨🇳' }
  ]



  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('smart-notes')
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes).map((note: unknown) => {
          const noteData = note as { 
            id: string; 
            title: string; 
            content: string; 
            category: string; 
            tags: string[]; 
            isFavorite: boolean;
            createdAt: string; 
            updatedAt: string 
          }
          return {
            ...noteData,
            createdAt: new Date(noteData.createdAt),
            updatedAt: new Date(noteData.updatedAt)
          }
        })
        setNotes(parsedNotes)
      } catch (error) {
        console.error('Error parsing saved notes:', error)
        setNotes([])
      }
    }
  }, [])

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem('smart-notes', JSON.stringify(notes))
  }, [notes])

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      category: 'personal',
      tags: [],
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setNotes(prev => [newNote, ...prev])
    setCurrentNote(newNote)
    setIsEditing(true)
  }

  const saveNote = () => {
    if (!currentNote) return

    const updatedNote = {
      ...currentNote,
      updatedAt: new Date()
    }

    // Update the notes array
    setNotes(prev => {
      const newNotes = prev.map(note => 
        note.id === currentNote.id ? updatedNote : note
      )
      
      return newNotes
    })
    
    // Update current note
    setCurrentNote(updatedNote)
    setIsEditing(false)
    
    // Force a re-render by updating localStorage
    setTimeout(() => {
      localStorage.setItem('smart-notes', JSON.stringify([updatedNote, ...notes.filter(note => note.id !== currentNote.id)]))
    }, 100)
  }

  const deleteNote = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      setNotes(prev => prev.filter(note => note.id !== noteId))
      if (currentNote?.id === noteId) {
        setCurrentNote(null)
        setIsEditing(false)
      }
    }
  }

  const toggleFavorite = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId ? { ...note, isFavorite: !note.isFavorite } : note
    ))
    if (currentNote?.id === noteId) {
      setCurrentNote(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null)
    }
  }

  const addTag = (noteId: string, tag: string) => {
    if (!tag.trim()) return
    
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, tags: [...new Set([...note.tags, tag.trim()])] }
        : note
    ))
    if (currentNote?.id === noteId) {
      setCurrentNote(prev => prev ? { ...prev, tags: [...new Set([...prev.tags, tag.trim()])] } : null)
    }
  }

  const removeTag = (noteId: string, tagToRemove: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, tags: note.tags.filter(tag => tag !== tagToRemove) }
        : note
    ))
    if (currentNote?.id === noteId) {
      setCurrentNote(prev => prev ? { ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) } : null)
    }
  }

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory
    const matchesFavorites = !showFavoritesOnly || note.isFavorite
    
    const result = matchesSearch && matchesCategory && matchesFavorites
    console.log(`Note "${note.title}": search=${matchesSearch}, category=${matchesCategory}, favorites=${matchesFavorites}, result=${result}`)
    
    return result
  })

  const sortedNotes = filteredNotes.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1
    if (!a.isFavorite && b.isFavorite) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  // Audio conversion function
  const convertToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    const length = audioBuffer.length
    const numberOfChannels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
    const view = new DataView(arrayBuffer)
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * numberOfChannels * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * numberOfChannels * 2, true)
    
    // Convert audio data
    let offset = 44
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]))
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
        offset += 2
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  // Voice recording functions
  const startRecording = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Prioritize Whisper-compatible formats
      const supportedFormats = [
        'audio/webm;codecs=opus',  // Best quality, widely supported
        'audio/webm',               // WebM without codec specification
        'audio/mp4',                // MP4 audio
        'audio/wav',                // WAV format
        'audio/ogg;codecs=opus',   // OGG with Opus codec
        'audio/ogg',                // OGG format
        'audio/mpeg',               // MPEG audio
        'audio/mpga'                // MPEG audio alternative
      ]
      
      let selectedMimeType = ''
      
      // Find the first supported format
      for (const format of supportedFormats) {
        if (MediaRecorder.isTypeSupported(format)) {
          selectedMimeType = format
          break
        }
      }
      
      // If no specific format is supported, let browser choose
      if (!selectedMimeType) {
        selectedMimeType = ''
        console.log('No specific format supported, using browser default')
      } else {
        console.log('Selected audio format:', selectedMimeType)
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: selectedMimeType || undefined
      })
      
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: selectedMimeType || 'audio/webm' 
        })
        setRecordingBlob(audioBlob)
        setAudioUrl(URL.createObjectURL(audioBlob))
        
        console.log('Recording completed:', {
          size: audioBlob.size,
          type: audioBlob.type,
          duration: audioChunksRef.current.length
        })
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      setError('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async () => {
    if (!recordingBlob) return

    setIsTranscribing(true)
    setError('')

    try {
      // Check if the audio format is Whisper-compatible
      const whisperFormats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm']
      const currentFormat = recordingBlob.type.toLowerCase()
      const isWhisperCompatible = whisperFormats.some(format => 
        currentFormat.includes(format) || currentFormat.includes(`audio/${format}`)
      )

      console.log('Audio format check:', {
        currentType: recordingBlob.type,
        currentFormatLower: currentFormat,
        whisperFormats: whisperFormats,
        isWhisperCompatible: isWhisperCompatible,
        size: recordingBlob.size
      })

      let audioBlob = recordingBlob
      
      if (!isWhisperCompatible) {
        console.warn('Audio format may not be compatible with Whisper API:', recordingBlob.type)
        setError(`Warning: Audio format "${recordingBlob.type}" may not be supported. Trying to convert...`)
        
        // Try to convert to a more compatible format
        try {
          const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
          const arrayBuffer = await recordingBlob.arrayBuffer()
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
          
          // Create a new blob with WAV format (more compatible)
          audioBlob = await convertToWav(audioBuffer)
          console.log('Converted to WAV format:', audioBlob.type, audioBlob.size)
          setError('✅ Audio converted to WAV format for better compatibility')
        } catch (conversionError) {
          console.warn('Failed to convert audio format, using original:', conversionError)
          setError(`⚠️ Could not convert audio format. Using original: ${recordingBlob.type}`)
        }
      }

      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('language', language)

      console.log('Sending transcription request:', {
        audioSize: recordingBlob.size,
        audioType: recordingBlob.type,
        language: language
      })

      // First, test if the API endpoint is reachable
      try {
        const testResponse = await fetch('/api/transcribe-voice', {
          method: 'HEAD'
        })
        console.log('API endpoint test response:', testResponse.status)
      } catch (testError) {
        console.error('API endpoint test failed:', testError)
        throw new Error('API endpoint not reachable. Please check if the server is running.')
      }

      const response = await fetch('/api/transcribe-voice', {
        method: 'POST',
        body: formData
      })

      console.log('Transcription response status:', response.status)
      console.log('Transcription response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        let errorMessage = 'Failed to transcribe audio'
        let errorDetails = {}
        
        try {
          const errorData = await response.json()
          console.error('Raw API Error response:', errorData)
          
          // Extract error message from OpenAI API response
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message
          } else if (errorData.error) {
            errorMessage = errorData.error
          } else if (typeof errorData === 'string') {
            errorMessage = errorData
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`
          }
          
          errorDetails = errorData
          console.error('Processed API Error details:', errorDetails)
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        
        console.error('Full error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          errorDetails: errorDetails,
          parsedErrorMessage: errorMessage
        })
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Transcription success:', data)
      
      if (!data.transcription) {
        throw new Error('No transcription received from API')
      }

      setTranscription(data.transcription)

    } catch (error) {
      console.error('Transcription error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio'
      setError(errorMessage)
      
      // Show more specific error information
      if (errorMessage.includes('Failed to fetch')) {
        setError('Network error: Please check your internet connection')
      } else if (errorMessage.includes('API endpoint not reachable')) {
        setError('Server error: API endpoint not accessible')
      } else if (errorMessage.includes('No transcription received')) {
        setError('API returned empty response. Please try again.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsTranscribing(false)
    }
  }

  const createNoteFromTranscription = () => {
    if (!transcription.trim()) return

    const newNote: Note = {
      id: Date.now().toString(),
      title: transcription.split(' ').slice(0, 5).join(' ') + '...',
      content: transcription,
      category: 'personal',
      tags: ['voice-note'],
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setNotes(prev => [newNote, ...prev])
    setCurrentNote(newNote)
    setIsEditing(true)
    
    // Clear recording states
    setTranscription('')
    setRecordingBlob(null)
    setAudioUrl(null)
    setError('')
  }

  const clearRecording = () => {
    setTranscription('')
    setRecordingBlob(null)
    setAudioUrl(null)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
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
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Smart Notes
                </h1>
                <p className="text-sm text-gray-600">Organize your thoughts intelligently</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notes Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create Note Button */}
            <Button
              onClick={createNewNote}
              size="lg"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Note
            </Button>

            {/* Voice Recording Section */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900">
                  <Mic className="w-5 h-5 text-green-600" />
                  <span>Voice Notes</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Record and transcribe your voice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Language Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Language</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="text-gray-900 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value} className="text-gray-900 hover:bg-gray-100">
                          <div className="flex items-center space-x-2">
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Recording Controls */}
                <div className="flex flex-col items-center space-y-3">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                    >
                      <Mic className="w-8 h-8" />
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      className="w-24 h-24 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg animate-pulse"
                    >
                      <Square className="w-8 h-8" />
                    </Button>
                  )}
                  
                  <p className="text-sm text-gray-600 text-center">
                    {isRecording ? 'Click to stop recording' : 'Click to start recording'}
                  </p>
                </div>

                {/* Audio Playback */}
                {audioUrl && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Your Recording</label>
                    <audio controls className="w-full" src={audioUrl} />
                  </div>
                )}

                {/* Transcribe Button */}
                {recordingBlob && (
                  <div className="space-y-2">
                    <Button
                      onClick={transcribeAudio}
                      disabled={isTranscribing}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                    >
                      {isTranscribing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Transcribing...
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Transcribe Audio
                        </>
                      )}
                    </Button>
                    
                    {/* Fallback for testing */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          setTranscription('This is a test transcription. Please check your API configuration and try the real transcription.')
                          setError('')
                        }}
                        variant="outline"
                        className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Test Transcription (Debug)
                      </Button>
                      
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/transcribe-voice', { method: 'HEAD' })
                            if (response.ok) {
                              setError('✅ API endpoint is reachable')
                            } else {
                              setError(`❌ API endpoint error: ${response.status}`)
                            }
                          } catch (error) {
                            setError(`❌ API endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                          }
                        }}
                        variant="outline"
                        className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Test API Endpoint
                      </Button>
                      
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/test-env')
                            const data = await response.json()
                            console.log('Environment check:', data)
                            if (data.environment.hasOpenAIKey) {
                              setError(`✅ OpenAI API key found (${data.environment.openAIKeyLength} chars)`)
                            } else {
                              setError('❌ OpenAI API key not found. Check your .env.local file.')
                            }
                          } catch (error) {
                            setError(`❌ Environment check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                          }
                        }}
                        variant="outline"
                        className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Check Environment
                      </Button>
                    </div>
                  </div>
                )}

                {/* Transcription Display */}
                {transcription && (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h6 className="font-medium text-blue-900 mb-2">Transcription</h6>
                      <p className="text-sm text-blue-800">{transcription}</p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        onClick={createNoteFromTranscription}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Save as Note
                      </Button>
                      <Button
                        onClick={clearRecording}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Search and Filters */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900">Search & Filter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Search Notes</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 text-gray-900 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                      style={{ color: '#111827' }}
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                                          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="text-gray-900 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500" style={{ color: '#111827' }}>
                            <SelectValue placeholder="All categories" />
                          </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value} className="text-gray-900 hover:bg-gray-100">
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Favorites Filter */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="favorites-only"
                    checked={showFavoritesOnly}
                    onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor="favorites-only" className="text-sm text-gray-700">
                    Show favorites only
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Notes List */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900">Your Notes</CardTitle>
                <CardDescription className="text-gray-600">
                  {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sortedNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => {
                        setCurrentNote(note)
                        setIsEditing(false)
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                        currentNote?.id === note.id ? 'bg-green-100 border border-green-300' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {note.title}
                            </h4>
                            {note.tags.includes('voice-note') && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border border-blue-300">
                                <Mic className="w-3 h-3 mr-1" />
                                Voice
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(note.id)
                            }}
                            className="text-yellow-500 hover:text-yellow-600"
                          >
                            <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNote(note.id)
                            }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {note.content || 'No content'}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{note.category}</span>
                        <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      </div>
                      
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 text-gray-800 border border-gray-300">
                              {tag}
                            </Badge>
                          ))}
                          {note.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800 border border-gray-300">
                              +{note.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {sortedNotes.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No notes found</p>
                      <p className="text-sm">Create your first note to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Note Editor */}
          <div className="lg:col-span-2">
            {currentNote ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {isEditing ? (
                        <Input
                          value={currentNote.title}
                          onChange={(e) => setCurrentNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                          className="text-xl font-bold text-gray-900 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                          placeholder="Note title..."
                          style={{ color: '#111827' }}
                        />
                      ) : (
                        <CardTitle className="text-gray-900">{currentNote.title}</CardTitle>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <Button onClick={saveNote} className="bg-green-600 hover:bg-green-700 text-white">
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      ) : (
                        <Button onClick={() => setIsEditing(true)} variant="outline">
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {currentNote.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Edit3 className="w-4 h-4" />
                      <span>Updated: {currentNote.updatedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Category and Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      {isEditing ? (
                        <Select 
                          value={currentNote.category} 
                          onValueChange={(value) => setCurrentNote(prev => prev ? { ...prev, category: value } : null)}
                        >
                          <SelectTrigger className="text-gray-900 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500" style={{ color: '#111827' }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200">
                            {categories.slice(1).map((category) => (
                              <SelectItem key={category.value} value={category.value} className="text-gray-900 hover:bg-gray-100">
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={categories.find(c => c.value === currentNote.category)?.color}>
                          {categories.find(c => c.value === currentNote.category)?.label}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {currentNote.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center space-x-1 bg-gray-100 text-gray-800 border border-gray-300">
                            {tag}
                            {isEditing && (
                              <button
                                onClick={() => removeTag(currentNote.id, tag)}
                                className="ml-1 text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            )}
                          </Badge>
                        ))}
                        {isEditing && (
                                                  <Input
                          placeholder="Add tag..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addTag(currentNote.id, e.currentTarget.value)
                              e.currentTarget.value = ''
                            }
                          }}
                          className="w-24 h-6 text-xs text-gray-900 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                          style={{ color: '#111827' }}
                        />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Note Content */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Content</label>
                    {isEditing ? (
                      <Textarea
                        value={currentNote.content}
                        onChange={(e) => setCurrentNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                        className="min-h-[400px] resize-none text-gray-900 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                        placeholder="Write your note here..."
                        style={{ color: '#111827' }}
                      />
                    ) : (
                      <div className="min-h-[400px] p-4 bg-gray-50 rounded-lg text-gray-900 whitespace-pre-wrap">
                        {currentNote.content || 'No content yet. Click Edit to add content.'}
                      </div>
                    )}
                  </div>

                  {/* AI Suggestions */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">AI Suggestions</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      💡 Try adding tags like &ldquo;important&rdquo;, &ldquo;follow-up&rdquo;, or &ldquo;completed&rdquo; to organize your notes better.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">No Note Selected</h3>
                  <p className="text-gray-500 text-center mb-6">
                    Choose a note from the sidebar or create a new one to get started
                  </p>
                  <Button onClick={createNewNote} className="bg-green-600 hover:bg-green-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Note
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
