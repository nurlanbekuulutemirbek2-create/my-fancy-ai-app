'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  Plus,
  X
} from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

interface ExtractedTask {
  title: string
  type: 'task' | 'event'
  description: string
  date: string
  time: string | null
  priority: 'low' | 'medium' | 'high'
  category: string
}

interface RecordingHistory {
  id: string
  transcription: string
  tasks: ExtractedTask[]
  timestamp: Date
  duration: number
  language: string
}

export default function VoiceMagicPage() {
  const { user } = useUser()
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isExtractingTasks, setIsExtractingTasks] = useState(false)
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState('')
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([])
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [recordingHistory, setRecordingHistory] = useState<RecordingHistory[]>([])
  const [error, setError] = useState('')
  const [language, setLanguage] = useState('en-US')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

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

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  }

  const categoryColors = {
    work: 'bg-blue-100 text-blue-800',
    personal: 'bg-purple-100 text-purple-800',
    health: 'bg-green-100 text-green-800',
    shopping: 'bg-orange-100 text-orange-800',
    travel: 'bg-indigo-100 text-indigo-800',
    other: 'bg-gray-100 text-gray-800'
  }

  const startRecording = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setRecordingBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
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
    if (!recordingBlob || !user) return

    setIsTranscribing(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('audio', recordingBlob, 'recording.webm')
      formData.append('language', language)

      const response = await fetch('/api/transcribe-voice', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to transcribe audio')
      }

      const data = await response.json()
      setTranscription(data.transcription)

      // Automatically extract tasks after transcription
      await extractTasks(data.transcription)

    } catch (error) {
      console.error('Transcription error:', error)
      setError(error instanceof Error ? error.message : 'Failed to transcribe audio')
    } finally {
      setIsTranscribing(false)
    }
  }

  const extractTasks = async (text: string) => {
    setIsExtractingTasks(true)
    setError('')

    try {
      const response = await fetch('/api/extract-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription: text })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to extract tasks')
      }

      const data = await response.json()
      setExtractedTasks(data.tasks)
      setSelectedTasks(new Set(data.tasks.map((_: any, index: number) => index.toString())))

    } catch (error) {
      console.error('Task extraction error:', error)
      setError(error instanceof Error ? error.message : 'Failed to extract tasks')
    } finally {
      setIsExtractingTasks(false)
    }
  }

  const addSelectedTasksToCalendar = async () => {
    if (!user || selectedTasks.size === 0) return

    setIsAddingToCalendar(true)
    setError('')

    try {
      const selectedTaskObjects = Array.from(selectedTasks).map(index => extractedTasks[parseInt(index)])
      
      for (const task of selectedTaskObjects) {
        await fetch('/api/add-to-calendar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ task, userId: user.id })
        })
      }

      // Save to recording history
      const newRecording: RecordingHistory = {
        id: Date.now().toString(),
        transcription,
        tasks: selectedTaskObjects,
        timestamp: new Date(),
        duration: recordingBlob ? Math.round(recordingBlob.size / 1000) : 0,
        language
      }

      setRecordingHistory(prev => [newRecording, ...prev])
      
      // Reset states
      setTranscription('')
      setExtractedTasks([])
      setSelectedTasks(new Set())
      setRecordingBlob(null)
      setAudioUrl(null)

      alert(`${selectedTaskObjects.length} tasks added to your calendar!`)

    } catch (error) {
      console.error('Add to calendar error:', error)
      setError('Failed to add tasks to calendar')
    } finally {
      setIsAddingToCalendar(false)
    }
  }

  const addSelectedTasksToGoogleCalendar = async () => {
    if (selectedTasks.size === 0) return

    try {
      const selectedTaskObjects = Array.from(selectedTasks).map(index => extractedTasks[parseInt(index)])
      
      // Generate calendar links for each task
      for (const task of selectedTaskObjects) {
        const response = await fetch('/api/create-calendar-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ task })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Open Google Calendar in a new tab
          window.open(data.calendarLinks.google, '_blank')
        }
      }

      // Show success message
      alert(`${selectedTaskObjects.length} tasks opened in Google Calendar! Check your browser tabs.`)

    } catch (error) {
      console.error('Google Calendar error:', error)
      setError('Failed to open Google Calendar')
    }
  }

  const toggleTaskSelection = (index: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedTasks(newSelected)
  }

  const formatDate = (dateStr: string) => {
    if (dateStr === 'today') return 'Today'
    if (dateStr === 'tomorrow') return 'Tomorrow'
    
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Voice Magic
                </h1>
                <p className="text-sm text-gray-600">AI-powered voice planning assistant</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Voice Recording Panel */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900">
                  <Mic className="w-5 h-5 text-blue-600" />
                  <span>Record Your Plans</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Speak naturally about your plans, tasks, and schedule. AI will extract everything for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Language</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="text-gray-900 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Choose language" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value} className="text-gray-900 hover:bg-gray-100">
                          <span className="mr-2">{lang.flag}</span>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Recording Controls */}
                <div className="flex flex-col items-center space-y-4">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg"
                    >
                      <Mic className="w-12 h-12" />
                    </Button>
                  ) : (
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      className="w-32 h-32 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg animate-pulse"
                    >
                      <Square className="w-12 h-12" />
                    </Button>
                  )}
                  
                  <p className="text-sm text-gray-600">
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
                  <Button
                    onClick={transcribeAudio}
                    disabled={isTranscribing}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Transcribing with OpenAI Whisper...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Transcribe with AI
                      </>
                    )}
                  </Button>
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

            {/* Transcription Display */}
            {transcription && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-gray-900">Your Voice Transcription</CardTitle>
                  <CardDescription className="text-gray-600">
                    AI transcribed your recording
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{transcription}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Task Extraction Panel */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span>Extracted Tasks & Events</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  AI has identified these items from your voice recording
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isExtractingTasks ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-gray-600">AI is analyzing your recording...</p>
                    <p className="text-sm text-gray-500">Extracting tasks and events</p>
                  </div>
                ) : extractedTasks.length > 0 ? (
                  <div className="space-y-4">
                    {extractedTasks.map((task, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedTasks.has(index.toString())
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => toggleTaskSelection(index.toString())}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">{task.title}</h4>
                              <Badge variant="outline" className={categoryColors[task.category as keyof typeof categoryColors] || categoryColors.other}>
                                {task.category}
                              </Badge>
                              <Badge variant="outline" className={priorityColors[task.priority]}>
                                {task.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(task.date)}</span>
                              </div>
                              {task.time && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{task.time}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>{task.type}</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-2">
                            {selectedTasks.has(index.toString()) ? (
                              <CheckCircle className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <Plus className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Calendar Integration Buttons */}
                    <div className="space-y-2">
                      {/* Add to Local Calendar Button */}
                      <Button
                        onClick={addSelectedTasksToCalendar}
                        disabled={selectedTasks.size === 0 || isAddingToCalendar}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                      >
                        {isAddingToCalendar ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Adding to Local Calendar...
                          </>
                        ) : (
                          <>
                            <Calendar className="w-4 h-4 mr-2" />
                            Add {selectedTasks.size} Selected to Local Calendar
                          </>
                        )}
                      </Button>

                      {/* Add to Google Calendar Button */}
                      <Button
                        onClick={addSelectedTasksToGoogleCalendar}
                        disabled={selectedTasks.size === 0}
                        variant="outline"
                        className="w-full border-2 border-green-500 text-green-600 hover:bg-green-50"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Add {selectedTasks.size} Selected to Google Calendar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4 text-gray-500">
                    <Calendar className="w-16 h-16 opacity-50" />
                    <p>Tasks will appear here</p>
                    <p className="text-sm">Record your voice to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recording History */}
        {recordingHistory.length > 0 && (
          <div className="mt-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900">Recent Recordings</CardTitle>
                <CardDescription className="text-gray-600">
                  Your latest voice planning sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recordingHistory.map((recording) => (
                    <div key={recording.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Mic className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-600">
                            {recording.language || 'en-US'} • {recording.duration}s • {recording.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {recording.tasks.length} tasks
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {recording.transcription}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {recording.tasks.slice(0, 3).map((task, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {task.title}
                          </Badge>
                        ))}
                        {recording.tasks.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{recording.tasks.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
