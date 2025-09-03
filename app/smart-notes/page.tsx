'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Search, Calendar, Edit3, Trash2, Star, ArrowLeft, Save, Lightbulb } from 'lucide-react'
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

  const categories = [
    { value: 'all', label: 'All Notes', color: 'bg-gray-100 text-gray-800' },
    { value: 'work', label: 'Work', color: 'bg-blue-100 text-blue-800' },
    { value: 'personal', label: 'Personal', color: 'bg-green-100 text-green-800' },
    { value: 'ideas', label: 'Ideas', color: 'bg-purple-100 text-purple-800' },
    { value: 'meetings', label: 'Meetings', color: 'bg-orange-100 text-orange-800' },
    { value: 'tasks', label: 'Tasks', color: 'bg-red-100 text-red-800' }
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
            
            {/* Debug Button */}


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
                        <h4 className="font-medium text-gray-900 truncate flex-1">
                          {note.title}
                        </h4>
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
