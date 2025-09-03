'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Plus, Save, Trash2, Edit, Sparkles, Loader2, Calendar, Clock } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import openai from '@/lib/openai'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  category: string
  priority: 'low' | 'medium' | 'high'
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
  aiSummary?: string
}

export default function SmartNotes() {
  const { user } = useUser()
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [showFavorites, setShowFavorites] = useState(false)

  const categories = [
    'work', 'personal', 'ideas', 'meetings', 'tasks', 'learning', 'projects', 'other'
  ]

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
  ]



  const loadNotes = useCallback(() => {
    if (!user) return

    const notesRef = collection(db, 'notes')
    const q = query(
      notesRef,
      where('userId', '==', user.id),
      orderBy('updatedAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData: Note[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        notesData.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          tags: data.tags || [],
          category: data.category || 'other',
          priority: data.priority || 'medium',
          isFavorite: data.isFavorite || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          aiSummary: data.aiSummary
        })
      })
      setNotes(notesData)
    })

    return unsubscribe
  }, [user])

  useEffect(() => {
    if (user) {
      loadNotes()
    }
  }, [user, loadNotes])

  const createNewNote = () => {
    const newNote: Note = {
      id: '',
      title: '',
      content: '',
      tags: [],
      category: 'other',
      priority: 'medium',
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setCurrentNote(newNote)
    setIsEditing(true)
  }

  const saveNote = async () => {
    if (!currentNote || !user) return

    try {
      if (currentNote.id) {
        // Update existing note
        const noteRef = doc(db, 'notes', currentNote.id)
        await updateDoc(noteRef, {
          title: currentNote.title,
          content: currentNote.content,
          tags: currentNote.tags,
          category: currentNote.category,
          priority: currentNote.priority,
          isFavorite: currentNote.isFavorite,
          updatedAt: serverTimestamp()
        })
      } else {
        // Create new note
        await addDoc(collection(db, 'notes'), {
          userId: user.id,
          userEmail: user.emailAddresses[0]?.emailAddress,
          title: currentNote.title,
          content: currentNote.content,
          tags: currentNote.tags,
          category: currentNote.category,
          priority: currentNote.priority,
          isFavorite: currentNote.isFavorite,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      }

      setIsEditing(false)
      setCurrentNote(null)
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      await deleteDoc(doc(db, 'notes', noteId))
      if (currentNote?.id === noteId) {
        setCurrentNote(null)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const editNote = (note: Note) => {
    setCurrentNote(note)
    setIsEditing(true)
  }

  const toggleFavorite = async (note: Note) => {
    try {
      const noteRef = doc(db, 'notes', note.id)
      await updateDoc(noteRef, {
        isFavorite: !note.isFavorite,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const generateAISummary = async (note: Note) => {
    if (!note.content.trim()) return

    setIsGeneratingAI(true)
    try {
      const prompt = `Please provide a concise summary of the following note content in 2-3 sentences:\n\n${note.content}`
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      })

      const summary = response.choices[0]?.message?.content || 'No summary generated'

      // Update the note with AI summary
      const noteRef = doc(db, 'notes', note.id)
      await updateDoc(noteRef, {
        aiSummary: summary,
        updatedAt: serverTimestamp()
      })

      // Update local state
      setNotes(prev => prev.map(n => 
        n.id === note.id ? { ...n, aiSummary: summary } : n
      ))

    } catch (error) {
      console.error('Error generating AI summary:', error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const addTag = (tag: string) => {
    if (!currentNote || !tag.trim()) return
    if (!currentNote.tags.includes(tag.trim())) {
      setCurrentNote({
        ...currentNote,
        tags: [...currentNote.tags, tag.trim()]
      })
    }
  }

  const removeTag = (tagToRemove: string) => {
    if (!currentNote) return
    setCurrentNote({
      ...currentNote,
      tags: currentNote.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory
    const matchesPriority = selectedPriority === 'all' || note.priority === selectedPriority
    const matchesFavorites = !showFavorites || note.isFavorite

    return matchesSearch && matchesCategory && matchesPriority && matchesFavorites
  })

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <FileText className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-800">Smart Notes</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Organize your thoughts with intelligent note-taking. 
          Use AI to summarize your notes and keep everything organized with tags and categories.
        </p>
      </div>

      {/* Controls and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button onClick={createNewNote} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
          <Button
            variant={showFavorites ? "default" : "outline"}
            onClick={() => setShowFavorites(!showFavorites)}
          >
            ⭐ Favorites
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48"
          />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {priorities.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Your Notes</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  currentNote?.id === note.id ? 'ring-2 ring-green-500' : ''
                }`}
                onClick={() => setCurrentNote(note)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {note.title || 'Untitled Note'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {note.content || 'No content'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {note.category}
                        </Badge>
                        <Badge className={`text-xs ${priorities.find(p => p.value === note.priority)?.color}`}>
                          {note.priority}
                        </Badge>
                        {note.isFavorite && <span className="text-yellow-500">⭐</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(note.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          editNote(note)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(note)
                        }}
                      >
                        {note.isFavorite ? '⭐' : '☆'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredNotes.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <FileText className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>No notes found</p>
              </div>
            )}
          </div>
        </div>

        {/* Note Editor/Viewer */}
        <div className="lg:col-span-2">
          {currentNote ? (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span>{isEditing ? 'Edit Note' : 'View Note'}</span>
                    </CardTitle>
                    <CardDescription>
                      {isEditing ? 'Make changes to your note' : 'View and manage your note'}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    {!isEditing && (
                      <>
                        <Button
                          onClick={() => editNote(currentNote)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => generateAISummary(currentNote)}
                          disabled={isGeneratingAI}
                          variant="outline"
                          size="sm"
                        >
                          {isGeneratingAI ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-1" />
                          )}
                          AI Summary
                        </Button>
                      </>
                    )}
                    {isEditing && (
                      <Button onClick={saveNote} className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteNote(currentNote.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    {/* Title Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Title</label>
                      <Input
                        value={currentNote.title}
                        onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                        placeholder="Enter note title..."
                      />
                    </div>

                    {/* Content Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Content</label>
                      <Textarea
                        value={currentNote.content}
                        onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                        placeholder="Write your note here..."
                        className="min-h-[200px] resize-none"
                      />
                    </div>

                    {/* Category and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <Select value={currentNote.category} onValueChange={(value) => setCurrentNote({ ...currentNote, category: value })}>
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
                        <label className="text-sm font-medium text-gray-700">Priority</label>
                        <Select value={currentNote.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setCurrentNote({ ...currentNote, priority: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {priorities.map((priority) => (
                              <SelectItem key={priority.value} value={priority.value}>
                                {priority.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Tags</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {currentNote.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addTag((e.target as HTMLInputElement).value)
                              ;(e.target as HTMLInputElement).value = ''
                            }
                          }}
                        />
                        <Button
                          onClick={() => {
                            const input = document.querySelector('input[placeholder="Add a tag..."]') as HTMLInputElement
                            if (input?.value) {
                              addTag(input.value)
                              input.value = ''
                            }
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Note Display */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {currentNote.title || 'Untitled Note'}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {formatDate(currentNote.createdAt)}</span>
                          <Clock className="w-4 h-4 ml-2" />
                          <span>Updated: {formatDate(currentNote.updatedAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{currentNote.category}</Badge>
                        <Badge className={priorities.find(p => p.value === currentNote.priority)?.color}>
                          {currentNote.priority}
                        </Badge>
                        {currentNote.isFavorite && <span className="text-yellow-500 text-xl">⭐</span>}
                      </div>

                      {currentNote.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {currentNote.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="prose max-w-none">
                        <p className="whitespace-pre-wrap text-gray-700">
                          {currentNote.content || 'No content'}
                        </p>
                      </div>

                      {currentNote.aiSummary && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                            <Sparkles className="w-4 h-4 mr-2" />
                            AI Summary
                          </h4>
                          <p className="text-blue-800">{currentNote.aiSummary}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Note Selected</h3>
                <p className="text-gray-600 mb-4">
                  Select a note from the list to view or edit it
                </p>
                <Button onClick={createNewNote} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Note
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
