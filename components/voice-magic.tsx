'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Mic, MicOff, Play, Pause, Download, Save, Trash2, Loader2, Volume2, FileAudio } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase'

interface AudioRecording {
  id: string
  audioBlob: Blob
  audioUrl: string
  transcription: string
  duration: number
  timestamp: Date
  filename: string
}

export default function VoiceMagic() {
  const { user } = useUser()
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentRecording, setCurrentRecording] = useState<AudioRecording | null>(null)
  const [recordings, setRecordings] = useState<AudioRecording[]>([])
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState('')
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null)

  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Initialize audio context
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const context = new AudioContextClass()
    setAudioContext(context)

    return () => {
      context.close()
    }
  }, [])

  const startRecording = async () => {
    try {
      setError('')
      setAudioChunks([])
      setRecordingTime(0)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus' as string
      })

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data])
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        const duration = recordingTime

        const newRecording: AudioRecording = {
          id: Date.now().toString(),
          audioBlob,
          audioUrl,
          transcription: '',
          duration,
          timestamp: new Date(),
          filename: `recording-${Date.now()}.webm`
        }

        setCurrentRecording(newRecording)
        setRecordings(prev => [newRecording, ...prev])
        setTranscription('')
      }

      setMediaRecorder(recorder)
      recorder.start()
      setIsRecording(true)

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError('Failed to start recording: ' + errorMessage)
      console.error('Recording error:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  const transcribeAudio = async () => {
    if (!currentRecording) return

    setIsTranscribing(true)
    setError('')

    try {
      // Convert audio blob to FormData for OpenAI API
      const formData = new FormData()
      formData.append('file', currentRecording.audioBlob, 'audio.webm')
      formData.append('model', 'whisper-1')

      // Note: In production, you should use an API route instead of calling OpenAI directly from the client
      // This is just for demonstration purposes
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const result = await response.json()
      const transcribedText = result.text

      setTranscription(transcribedText)

      // Update the recording with transcription
      setCurrentRecording(prev => prev ? { ...prev, transcription: transcribedText } : null)
      setRecordings(prev => prev.map(rec => 
        rec.id === currentRecording.id 
          ? { ...rec, transcription: transcribedText }
          : rec
      ))

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError('Transcription failed: ' + errorMessage)
      console.error('Transcription error:', err)
    } finally {
      setIsTranscribing(false)
    }
  }

  const playAudio = async (audioUrl: string) => {
    if (!audioContext) return

    try {
      const response = await fetch(audioUrl)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      if (audioSource) {
        audioSource.stop()
      }

      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContext.destination)
      source.start(0)

      setAudioSource(source)
      setIsPlaying(true)

      source.onended = () => {
        setIsPlaying(false)
        setAudioSource(null)
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError('Failed to play audio: ' + errorMessage)
    }
  }

  const stopAudio = () => {
    if (audioSource) {
      audioSource.stop()
      setAudioSource(null)
    }
    setIsPlaying(false)
  }

  const saveToFirebase = async (recording: AudioRecording) => {
    if (!user) return

    try {
      // Upload audio file to Firebase Storage
      const filename = `voice-recordings/${user.id}/${Date.now()}-${recording.filename}`
      const storageRef = ref(storage, filename)
      
      await uploadBytes(storageRef, recording.audioBlob)
      const downloadURL = await getDownloadURL(storageRef)
      
      // Save metadata to Firestore
      await addDoc(collection(db, 'voiceRecordings'), {
        userId: user.id,
        userEmail: user.emailAddresses[0]?.emailAddress,
        filename: recording.filename,
        audioUrl: downloadURL,
        storagePath: filename,
        transcription: recording.transcription,
        duration: recording.duration,
        timestamp: serverTimestamp(),
        fileSize: recording.audioBlob.size
      })

      alert('Recording saved successfully!')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError('Failed to save recording: ' + errorMessage)
      console.error('Save error:', err)
    }
  }

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(rec => rec.id !== id))
    if (currentRecording?.id === id) {
      setCurrentRecording(null)
      setTranscription('')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const downloadAudio = (recording: AudioRecording) => {
    const url = recording.audioUrl
    const a = document.createElement('a')
    a.href = url
    a.download = recording.filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Volume2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Voice Magic</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Transform your voice into text with AI-powered transcription. 
          Record, transcribe, and save your audio recordings with ease!
        </p>
      </div>

      {/* Recording Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recording Controls */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mic className="w-5 h-5 text-blue-600" />
              <span>Voice Recorder</span>
            </CardTitle>
            <CardDescription>
              Record your voice and convert it to text
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Recording Status */}
            <div className="text-center">
              {isRecording ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <MicOff className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-2xl font-mono font-bold text-red-600">
                    {formatTime(recordingTime)}
                  </div>
                  <p className="text-red-600 font-medium">Recording...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                    <Mic className="w-10 h-10 text-gray-600" />
                  </div>
                  <p className="text-gray-600">Ready to record</p>
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div className="flex justify-center space-x-4">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="lg"
                >
                  <MicOff className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transcription Panel */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileAudio className="w-5 h-5 text-blue-600" />
              <span>Transcription</span>
            </CardTitle>
            <CardDescription>
              Your voice converted to text
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentRecording ? (
              <>
                {/* Audio Player */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => isPlaying ? stopAudio() : playAudio(currentRecording.audioUrl)}
                      variant="outline"
                      size="sm"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <span className="text-sm text-gray-600">
                      {formatTime(currentRecording.duration)}
                    </span>
                    <Badge variant="outline">
                      {Math.round(currentRecording.audioBlob.size / 1024)} KB
                    </Badge>
                  </div>
                </div>

                {/* Transcribe Button */}
                <Button
                  onClick={transcribeAudio}
                  disabled={isTranscribing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Transcribing...
                    </>
                  ) : (
                    <>
                      <FileAudio className="w-4 h-4 mr-2" />
                      Transcribe Audio
                    </>
                  )}
                </Button>

                {/* Transcription Text */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Transcription</label>
                  <Textarea
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    placeholder="Your transcription will appear here..."
                    className="min-h-[120px] resize-none"
                    readOnly={!transcription}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button
                    onClick={() => saveToFirebase(currentRecording)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    onClick={() => downloadAudio(currentRecording)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FileAudio className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>Record something to see transcription here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recordings History */}
      {recordings.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recording History</CardTitle>
            <CardDescription>
              Your previous voice recordings and transcriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileAudio className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {recording.filename}
                      </p>
                      <p className="text-sm text-gray-600">
                        {recording.timestamp.toLocaleString()} • {formatTime(recording.duration)}
                      </p>
                      {recording.transcription && (
                        <p className="text-sm text-gray-700 mt-1 max-w-md truncate">
                          &ldquo;{recording.transcription}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => playAudio(recording.audioUrl)}
                      variant="outline"
                      size="sm"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => downloadAudio(recording)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => saveToFirebase(recording)}
                      variant="outline"
                      size="sm"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deleteRecording(recording.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
