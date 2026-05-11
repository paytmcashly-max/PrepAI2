'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ListTodo,
  Map,
  BookOpen,
  FileText,
  ClipboardList,
  History,
  GraduationCap,
  Bot,
  Settings,
  RotateCcw,
  Inbox,
  Brain,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar'

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Daily Tasks',
    href: '/dashboard/tasks',
    icon: ListTodo,
  },
  {
    title: 'Roadmap',
    href: '/dashboard/roadmap',
    icon: Map,
  },
  {
    title: 'Subjects',
    href: '/dashboard/subjects',
    icon: BookOpen,
  },
]

const studyNavItems = [
  {
    title: 'My Notes',
    href: '/dashboard/notes',
    icon: FileText,
  },
  {
    title: 'Mock Tests',
    href: '/dashboard/mock-tests',
    icon: ClipboardList,
  },
  {
    title: 'PYQ Practice',
    href: '/dashboard/pyq',
    icon: History,
  },
  {
    title: 'Original Practice',
    href: '/dashboard/practice/original',
    icon: Brain,
  },
  {
    title: 'Revision Queue',
    href: '/dashboard/revision',
    icon: RotateCcw,
  },
  {
    title: 'Backlog',
    href: '/dashboard/backlog',
    icon: Inbox,
  },
  {
    title: 'AI Assistant',
    href: '/dashboard/ai',
    icon: Bot,
  },
  {
    title: 'Plan Settings',
    href: '/dashboard/settings/plan',
    icon: Settings,
  },
]

interface DashboardSidebarProps {
  examName?: string | null
  targetDays?: number | null
  hasActivePlan?: boolean
}

export function DashboardSidebar({ examName, targetDays, hasActivePlan = false }: DashboardSidebarProps) {
  const pathname = usePathname()
  const subtitle = hasActivePlan ? examName || 'Active Exam' : 'No Active Plan'
  const footerLabel = hasActivePlan && targetDays ? `${targetDays}-Day Plan Active` : 'No Active Plan'

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">PrepTrack</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Study</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studyNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className={hasActivePlan ? 'h-2 w-2 rounded-full bg-green-500' : 'h-2 w-2 rounded-full bg-muted-foreground/40'} />
          <span>{footerLabel}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
