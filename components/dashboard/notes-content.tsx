'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Tag,
  FileText,
  BookOpen,
  Calculator,
  Brain,
  Globe,
} from 'lucide-react'
import { createNote, updateNote, deleteNote } from '@/lib/actions'
import type { Note, Subject } from '@/lib/types'
import { format } from 'date-fns'

interface NotesContentProps {
  notes: Note[]
  subjects: Subject[]
}

const subjectIcons: Record<string, React.ReactNode> = {
  'quant': <Calculator className="h-4 w-4" />,
  'reasoning': <Brain className="h-4 w-4" />,
  'english': <BookOpen className="h-4 w-4" />,
  'ga': <Globe className="h-4 w-4" />,
}

export function NotesContent({ notes: initialNotes, subjects }: NotesContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [notes, setNotes] = useState(initialNotes)
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    chapter: '',
    content: '',
    tags: '',
  })

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])))

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (note.chapter?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

    const matchesTag = !selectedTag || (note.tags || []).includes(selectedTag)

    return matchesSearch && matchesTag
  })

  const resetForm = () => {
    setFormData({
      title: '',
      subject_id: '',
      chapter: '',
      content: '',
      tags: '',
    })
    setEditingNote(null)
  }

  const handleCreateNote = () => {
    startTransition(async () => {
      try {
        const newNote = await createNote({
          title: formData.title,
          subject_id: formData.subject_id || null,
          chapter: formData.chapter || null,
          content: formData.content || null,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        })
        setNotes(prev => [newNote, ...prev])
        setIsCreateOpen(false)
        resetForm()
      } catch (error) {
        console.error('Failed to create note:', error)
      }
    })
  }

  const handleUpdateNote = () => {
    if (!editingNote) return

    startTransition(async () => {
      try {
        await updateNote(editingNote.id, {
          title: formData.title,
          subject_id: formData.subject_id || null,
          chapter: formData.chapter || null,
          content: formData.content || null,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        })
        setNotes(prev => prev.map(n => 
          n.id === editingNote.id 
            ? { 
                ...n, 
                title: formData.title,
                subject_id: formData.subject_id || null,
                chapter: formData.chapter || null,
                content: formData.content || null,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
              }
            : n
        ))
        setEditingNote(null)
        resetForm()
      } catch (error) {
        console.error('Failed to update note:', error)
      }
    })
  }

  const handleDeleteNote = (noteId: string) => {
    startTransition(async () => {
      try {
        await deleteNote(noteId)
        setNotes(prev => prev.filter(n => n.id !== noteId))
      } catch (error) {
        console.error('Failed to delete note:', error)
      }
    })
  }

  const openEditDialog = (note: Note) => {
    setEditingNote(note)
    setFormData({
      title: note.title,
      subject_id: note.subject_id || '',
      chapter: note.chapter || '',
      content: note.content || '',
      tags: (note.tags || []).join(', '),
    })
  }

  const NoteForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div>
        <Input
          placeholder="Note title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select
          value={formData.subject_id}
          onValueChange={(value) => setFormData(prev => ({ ...prev, subject_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Chapter (optional)"
          value={formData.chapter}
          onChange={(e) => setFormData(prev => ({ ...prev, chapter: e.target.value }))}
        />
      </div>
      <Textarea
        placeholder="Note content..."
        value={formData.content}
        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
        rows={6}
      />
      <Input
        placeholder="Tags (comma-separated)"
        value={formData.tags}
        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
      />
      <DialogFooter>
        <Button
          onClick={isEdit ? handleUpdateNote : handleCreateNote}
          disabled={!formData.title || isPending}
        >
          {isPending ? 'Saving...' : isEdit ? 'Update Note' : 'Create Note'}
        </Button>
      </DialogFooter>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Notes</h1>
          <p className="text-muted-foreground">Organize and review your notes</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
              <DialogDescription>
                Add a new study note to your collection.
              </DialogDescription>
            </DialogHeader>
            <NoteForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search notes by title, subject, or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Filter by Tag</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTag(null)}
            >
              All Notes
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex-1 mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold group-hover:text-primary transition-colors mb-2">
                        {note.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {note.subject && (
                          <Badge variant="secondary" className="text-xs">
                            {subjectIcons[note.subject_id || ''] || <BookOpen className="h-3 w-3" />}
                            <span className="ml-1">{note.subject.name}</span>
                          </Badge>
                        )}
                        {note.chapter && (
                          <Badge variant="outline" className="text-xs">
                            {note.chapter}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {note.content && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {note.content}
                    </p>
                  )}

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((tag) => (
                        <span 
                          key={tag} 
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(note.updated_at), 'MMM d, yyyy')}
                  </p>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => openEditDialog(note)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Notes Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedTag 
                ? 'Try a different search or filter.'
                : 'Create your first study note to get started.'}
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Note
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Notes Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Notes</p>
              <p className="text-3xl font-bold">{notes.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Subjects Covered</p>
              <p className="text-3xl font-bold">
                {new Set(notes.filter(n => n.subject_id).map((n) => n.subject_id)).size}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Unique Tags</p>
              <p className="text-3xl font-bold">{allTags.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingNote} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Update your study note.
            </DialogDescription>
          </DialogHeader>
          <NoteForm isEdit />
        </DialogContent>
      </Dialog>
    </div>
  )
}
