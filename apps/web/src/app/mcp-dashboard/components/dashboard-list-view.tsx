import React from 'react'

export function DashboardListView({ nodes }) {
  // Flatten nodes for list view (only requests, not containers)
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
    <ul className="divide-y divide-muted">
      {flat.map((node) => (
        <li key={node.content.id} className="py-3 px-2 flex flex-col md:flex-row md:items-center md:gap-4">
          <span className="font-mono text-xs text-muted-foreground w-20">{node.content.id}</span>
          <span className="font-semibold flex-1">{node.content.name}</span>
          <span className="text-xs px-2 py-1 rounded bg-muted/50">{node.content.status}</span>
          <span className="flex-1 text-muted-foreground text-xs">{node.content.description}</span>
          <span className="text-xs">{new Date(node.content.date_created).toLocaleString()}</span>
        </li>
      ))}
    </ul>
  )
}
