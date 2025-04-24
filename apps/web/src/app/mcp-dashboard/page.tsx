'use client'

import { McpDataProvider } from '@/contexts/McpDataContext'
import { Dashboard } from './components/dashboard'

export default function DashboardPage() {
    return (
        <McpDataProvider>
            <Dashboard />
        </McpDataProvider>
    )
}
