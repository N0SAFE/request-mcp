import React from 'react'

export function DashboardGridView({ nodes }) {
  // Flatten nodes for grid view (only requests, not containers)
  const flattenNodes = (nodes) => {
    let result = []
    for (const node of nodes) {
      if (node.type === 'request') {
        result.push(node)
      } else if (node.type === 'container' && node.children) {
        result = result.concat(flattenNodes(node.children))
      }
    }
    return result
  }
  const flat = flattenNodes(nodes)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {flat.map((node) => (
        <div key={node.content.id} className="border rounded-lg p-4 bg-background shadow-sm">
          <div className="font-semibold mb-1">{node.content.name}</div>
          <div className="text-xs text-muted-foreground mb-2">{node.content.description}</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono">{node.content.id}</span>
            <span className="px-2 py-0.5 rounded bg-muted/50">{node.content.status}</span>
            <span>{new Date(node.content.date_created).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
