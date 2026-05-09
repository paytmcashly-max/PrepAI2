import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="relative w-full max-w-md">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <CardTitle className="text-2xl text-white">Authentication Error</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Something went wrong during authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300">We encountered an error while processing your request. Please try again.</p>
            <div className="flex gap-3">
              <Button
                asChild
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                <Link href="/auth/login">Try Login Again</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-700"
              >
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
