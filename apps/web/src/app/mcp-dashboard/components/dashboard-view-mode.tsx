import React from 'react'
import { Button } from '@repo/ui/components/shadcn/button'

const VIEW_MODES = [
  { key: 'card', label: 'Card' },
  { key: 'table', label: 'Table' },
  { key: 'list', label: 'List' },
  { key: 'grid', label: 'Grid' },
]

export function DashboardViewMode({ mode, setMode }) {
  return (
    <div className="flex gap-2 items-center">
      {VIEW_MODES.map((v) => (
        <Button
          key={v.key}
          variant={mode === v.key ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode(v.key)}
        >
          {v.label}
        </Button>
      ))}
    </div>
  )
}
