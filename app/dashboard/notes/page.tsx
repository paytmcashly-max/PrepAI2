'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Trash2, Edit, Tag } from 'lucide-react'

const sampleNotes = [
  {
    id: '1',
    title: 'Quadratic Equations Formula',
    subject: 'Mathematics',
    chapter: 'Algebra',
    tags: ['formulas', 'important'],
    preview: 'Standard form: ax² + bx + c = 0. Solution: x = (-b ± √(b²-4ac))/2a',
    createdAt: '2025-05-08',
  },
  {
    id: '2',
    title: 'Types of Governments',
    subject: 'General Knowledge',
    chapter: 'Polity',
    tags: ['gk', 'government'],
    preview: 'Democracy, Autocracy, Oligarchy, Monarchy, Theocracy, etc.',
    createdAt: '2025-05-07',
  },
  {
    id: '3',
    title: 'Hindi Tenses Summary',
    subject: 'Hindi',
    chapter: 'Grammar',
    tags: ['grammar', 'hindi', 'tenses'],
    preview: 'Present, Past, and Future tenses with their formations and usage rules.',
    createdAt: '2025-05-06',
  },
  {
    id: '4',
    title: 'Logical Reasoning Techniques',
    subject: 'Reasoning',
    chapter: 'Logic',
    tags: ['techniques', 'important'],
    preview: 'Deduction, Induction, Analogy, Classification, Series, etc.',
    createdAt: '2025-05-05',
  },
  {
    id: '5',
    title: 'Newton\'s Laws of Motion',
    subject: 'Physics',
    chapter: 'Mechanics',
    tags: ['physics', 'mechanics'],
    preview: '1st: Object in motion stays in motion. 2nd: F=ma. 3rd: Action-Reaction',
    createdAt: '2025-05-04',
  },
]

const subjectColors: Record<string, string> = {
  'Mathematics': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'General Knowledge': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Hindi': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Reasoning': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Physics': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

export default function NotesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const allTags = Array.from(new Set(sampleNotes.flatMap((n) => n.tags)))

  const filteredNotes = sampleNotes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.preview.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTag = !selectedTag || note.tags.includes(selectedTag)

    return matchesSearch && matchesTag
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Study Notes</h1>
            <p className="text-sm text-slate-400">Organize and review your notes</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Back to Dashboard
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              type="text"
              placeholder="Search notes by title, subject, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tag Filter */}
        <div className="mb-8">
          <p className="text-slate-400 text-sm font-semibold mb-3">Filter by Tag</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                selectedTag === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              All Notes
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm hover:from-slate-750 hover:to-slate-700/60 transition-all group cursor-pointer"
              >
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="flex-1 mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-1">
                          {note.title}
                        </h3>
                        <div className="flex gap-2 mb-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${subjectColors[note.subject]}`}>
                            {note.subject}
                          </span>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-700/50 text-slate-300">
                            {note.chapter}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-400 text-sm line-clamp-2 mb-4">{note.preview}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {note.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-500">{note.createdAt}</p>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-slate-700 rounded transition-colors">
                        <Edit className="w-4 h-4 text-slate-400 hover:text-blue-400" />
                      </button>
                      <button className="p-2 hover:bg-slate-700 rounded transition-colors">
                        <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <p className="text-slate-400 mb-4">No notes found. Try a different search or create a new note.</p>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Note
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Notes Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Notes</p>
                <p className="text-3xl font-bold text-white">{sampleNotes.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Subjects Covered</p>
                <p className="text-3xl font-bold text-white">{new Set(sampleNotes.map((n) => n.subject)).size}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Unique Tags</p>
                <p className="text-3xl font-bold text-white">{allTags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
