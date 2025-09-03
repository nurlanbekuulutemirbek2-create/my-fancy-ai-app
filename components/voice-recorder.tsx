"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, Play, Pause, Download, Trash2 } from "lucide-react"

interface Recording {
  id: string
  name: string
  duration: number
  timestamp: Date
  blob?: Blob
}

export function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState<Recording[]>([
    { id: "1", name: "Meeting Notes", duration: 120, timestamp: new Date(Date.now() - 86400000) },
    { id: "2", name: "Creative Ideas", duration: 45, timestamp: new Date(Date.now() - 3600000) },
  ])
  const [currentTime, setCurrentTime] = useState(0)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout>()

  const startRecording = () => {
    setIsRecording(true)
    setCurrentTime(0)

    // Simulate recording timer
    intervalRef.current = setInterval(() => {
      setCurrentTime((prev) => prev + 1)
    }, 1000)
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Add new recording
    const newRecording: Recording = {
      id: Date.now().toString(),
      name: `Recording ${recordings.length + 1}`,
      duration: currentTime,
      timestamp: new Date(),
    }

    setRecordings((prev) => [newRecording, ...prev])
    setCurrentTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const togglePlayback = (id: string) => {
    setPlayingId(playingId === id ? null : id)
  }

  const deleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-secondary to-accent rounded-lg flex items-center justify-center">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Voice Magic</CardTitle>
            <CardDescription>Record and manage your audio notes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Controls */}
        <div className="text-center space-y-4">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-secondary/20 to-accent/20 rounded-full flex items-center justify-center border-4 border-secondary/30">
            <div className={`text-3xl font-mono ${isRecording ? "text-red-500 animate-pulse" : "text-secondary"}`}>
              {formatTime(currentTime)}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="rounded-full w-16 h-16 hover:scale-110 transition-transform"
              >
                <Mic className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="rounded-full w-16 h-16 hover:scale-110 transition-transform"
              >
                <Square className="h-6 w-6" />
              </Button>
            )}
          </div>

          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              Recording in progress...
            </Badge>
          )}
        </div>

        {/* Recordings List */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground">Recent Recordings</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recordings.map((recording) => (
              <div key={recording.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                <div className="flex-1">
                  <div className="font-medium text-sm">{recording.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(recording.duration)} • {recording.timestamp.toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => togglePlayback(recording.id)} className="rounded-lg">
                    {playingId === recording.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-lg">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteRecording(recording.id)}
                    className="rounded-lg text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
