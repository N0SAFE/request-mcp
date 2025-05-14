// Table view for dashboard using shadcn-table
import React from 'react'
// Import Table components from shadcn-table package
import { DataTable } from '@repo/shadcn-table/components/data-table';
import { DataTableToolbar } from '@repo/shadcn-table/components/data-table-toolbar';
import { DataTablePagination } from '@repo/shadcn-table/components';
import { DataTableViewOptions } from '@repo/shadcn-table/components/data-table-view-options';
import { DataTableDragHandle } from '@repo/shadcn-table/components/data-table-drag-handle';
import { ActionGeneratorOptions, TasksTableFloatingBar } from '@repo/shadcn-table/components/floating-bar';
import { DataTableRowAction, ExtendedSortingState, Filter } from '@repo/shadcn-table/types';
import { directusFilterAdapter, exportTableToCSV } from '@repo/shadcn-table/utils';
import { Archive, ArrowUp, CheckCircle2, ClipboardCopy, Download, Loader, Printer, Star, Tag, Trash2 } from 'lucide-react';
import { Button } from '@repo/ui/components/shadcn/button'
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectLabel, SelectSeparator, SelectItem } from '@repo/ui/components/shadcn/select'
import { Tooltip, TooltipTrigger, TooltipContent } from '@repo/ui/components/shadcn/tooltip'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@repo/ui/components/shadcn/input'
import { Badge } from '@repo/ui/components/shadcn/badge'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@repo/ui/components/shadcn/sheet'
import { McpRequestHierarchy } from '@/contexts/McpDataContext'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useFilters } from '@repo/shadcn-table/hooks/use-filters';

export function DashboardTableView({ nodes }: {nodes: McpRequestHierarchy[]}) {
    const toast = {
        error: (message: string) => {
            console.error(message);
        },
        success: (message: string) => {
            console.log(message);
        },
    }

    const deleteTasks = async ({ ids }: { ids: string[] }) => {
        // Mock API call to delete tasks
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ error: null });
            }, 1000);
        });
    }

    const updateTasks = async ({ ids, ...updates }: { ids: string[]; [key: string]: any }) => {
        // Mock API call to update tasks
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ error: null });
            }, 1000);
        });
    }

    const generateId = (node: McpRequestHierarchy) => {
        return `${node.type}-${node.content.id}`;
    }

    const toSentenceCase = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // States
    const [pageIndex, setPageIndex] = React.useState(0)
    const [pageSize, setPageSize] = React.useState(10)
    const [isPending, startTransition] = React.useTransition()
    const [currentAction, setCurrentAction] = React.useState<string | null>(
        null
    )
    const [loadingRows, setLoadingRows] = React.useState<string[]>([])
    const [tag, setTag] = React.useState<string>('')
    const [reorderableRows, setReorderableRows] = React.useState(false)
    const [filters, setFilters] = React.useState<
        Filter<typeof directusFilterAdapter>[]
    >([])
    const [operator, setOperator] = React.useState<'and' | 'or'>('and')
    const [sorting, setSorting] = React.useState<ExtendedSortingState<McpRequestHierarchy>>([])

    // Update the delete handler
    const handleDelete = React.useCallback(
        async (ids: string[]) => {
            setLoadingRows(ids)
            const result = await deleteTasks({ ids })
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Tasks deleted successfully')
                table.toggleAllRowsSelected(false)
            }
            setLoadingRows([])
        },
        []
    )

    // Update the update handler
    const handleUpdate = React.useCallback(
        async (ids: string[], updates: Partial<McpRequestHierarchy>) => {
            setLoadingRows(ids)
            const result = await updateTasks({ ids, ...updates })
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Tasks updated successfully')
            }
            setLoadingRows([])
        },
        []
    )

    const [rowAction, setRowAction] =
        React.useState<DataTableRowAction<McpRequestHierarchy> | null>(null)

    // You should define your columns for the table here, or import them if you have a columns definition file
    // Example: import { getColumns } from './columns';
    // const columns = React.useMemo(() => getColumns({ setRowAction }), []);
    // For now, you must define columns for your McpRequestHierarchy data structure
    const columns = React.useMemo(() => [
      // Example column definition:
      // {
      //   accessorKey: 'id',
      //   header: 'ID',
      //   cell: info => info.getValue(),
      // },
      // Add your actual columns here
    ], [setRowAction]);

    const pageCount = 1 // Only one page since all data is loaded at once

    // Transform filters to proper column filters for the table
    const columnFilters = React.useMemo(() => {
        return filters.map((filter) => ({
            id: filter.id,
            value: filter,
        }))
    }, [filters])

    const filtersInstance = useFilters(
        directusFilterAdapter,
        (createFilter) => [
            createFilter({
                type: 'text',
                id: 'title',
                label: 'Title',
                meta: {
                    placeholder: 'Search by title...',
                    test: '', // Adding required test property
                },
            }),
            createFilter({
                type: 'select',
                id: 'status',
                label: 'Status',
                meta: () => ({
                    options: tasks.status.enumValues.map((status) => ({
                        label: toSentenceCase(status),
                        value: status,
                    })),
                    placeholder: 'Select status...',
                }),
            }),
            createFilter({
                type: 'select',
                id: 'priority',
                label: 'Priority',
                meta: () => ({
                    options: tasks.priority.enumValues.map((priority) => ({
                        label: toSentenceCase(priority),
                        value: priority,
                    })),
                    placeholder: 'Select priority...',
                }),
            }),
            createFilter({
                type: 'date',
                id: 'createdAt',
                label: 'Created at',
            }),
        ],
        {
            onChange: (filters, joinOperator) => {
                setFilters(filters)
                setOperator(joinOperator)
            },
            state: {
                filters,
                joinOperator: operator,
            },
        }
    )

    // Add a drag handle column when reordering is enabled
    const columnsWithDragHandle = React.useMemo(() => {
        if (!reorderableRows) return columns

        return [
            {
                id: 'drag-handle',
                header: () => null,
                cell: ({ row }) => {
                    return <DataTableDragHandle id={row.id} />
                },
                size: 30,
                enableSorting: false,
                enableHiding: false,
            },
            ...columns,
        ]
    }, [columns, reorderableRows])

    // Handle row reordering
    const handleRowReorder = React.useCallback((rowIds: string[]) => {
        toast.success(
            `Rows reordered. New order: ${rowIds.slice(0, 3).join(', ')}...`
        )
    }, [])

    const table = useReactTable({
        data: nodes,
        columns: columnsWithDragHandle,
        getCoreRowModel: getCoreRowModel(),
        pageCount: pageCount,
        manualPagination: true,
        state: {
            sorting,
            pagination: {
                pageIndex,
                pageSize,
            },
            globalFilter: {
                joinOperator: operator,
                filters: filters,
            },
            columnFilters,
        },
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const state = updater({
                    pageIndex,
                    pageSize,
                })
                setPageIndex(state.pageIndex)
                setPageSize(state.pageSize)
            } else {
                setPageIndex(updater.pageIndex)
                setPageSize(updater.pageSize)
            }
        },
        getRowId: generateId,
        onSortingChange: (updater) => {
            if (typeof updater === 'function') {
                const newSortingState = updater(sorting)
                setSorting(newSortingState as ExtendedSortingState<McpRequestHierarchy>)
            } else {
                setSorting(updater as ExtendedSortingState<McpRequestHierarchy>)
            }
        },
    })

    // Define the action generator function that returns JSX
    const generateActions = React.useCallback(
        (options: ActionGeneratorOptions<McpRequestHierarchy>): React.ReactNode => {
            const {
                table,
                helpers = {},
                setIsPending,
                setLoadingRows,
            } = options

            // Extract tag state from helpers or use a default one
            const tagState = (helpers.tag as string) || ''
            const setTagState =
                (helpers.setTag as React.Dispatch<
                    React.SetStateAction<string>
                >) || (() => {})

            // Helper function for action button with loading state
            const ActionButton = ({
                id,
                icon: Icon,
                label,
                variant = 'secondary',
                onClick,
                affectsAllSelectedRows = true,
            }: {
                id: string
                icon: React.ElementType
                label: string
                variant?:
                    | 'default'
                    | 'destructive'
                    | 'outline'
                    | 'secondary'
                    | 'ghost'
                    | 'link'
                onClick: () => void
                affectsAllSelectedRows?: boolean
            }) => {
                const isLoading = isPending && currentAction === id

                return (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={variant}
                                size="icon"
                                className="size-7 border"
                                disabled={isPending}
                                onClick={() => {
                                    setIsPending(id)
                                    setCurrentAction(id)

                                    // Set loading state on selected rows if this action affects rows
                                    if (affectsAllSelectedRows) {
                                        const selectedRows =
                                            table.getFilteredSelectedRowModel()
                                                .rows
                                        const rowIds = selectedRows.map(
                                            (row) => row.id
                                        )
                                        setLoadingRows(rowIds)
                                    }

                                    startTransition(onClick)
                                }}
                            >
                                {isLoading ? (
                                    <Loader
                                        className="size-3.5 animate-spin"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <Icon
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-accent text-foreground border font-semibold dark:bg-zinc-900">
                            <p>{label}</p>
                        </TooltipContent>
                    </Tooltip>
                )
            }

            // Helper function for dropdown action buttons
            const DropdownActionButton = <TValue extends string>({
                id,
                icon: Icon,
                label,
                options,
                onValueChange,
                affectsAllSelectedRows = true,
            }: {
                id: string
                icon: React.ElementType
                label: string
                options: { label: string; value: TValue }[]
                onValueChange: (value: TValue) => void
                affectsAllSelectedRows?: boolean
            }) => {
                const isLoading = isPending && currentAction === id

                return (
                    <div className="relative inline-block">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="size-7 border"
                                    disabled={isPending}
                                    onClick={(e) => {
                                        // Prevent button default behavior, letting Select handle the click
                                        e.preventDefault()
                                    }}
                                >
                                    {isLoading ? (
                                        <Loader
                                            className="size-3.5 animate-spin"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Icon
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-accent text-foreground border font-semibold dark:bg-zinc-900">
                                <p>{label}</p>
                            </TooltipContent>
                        </Tooltip>

                        <Select
                            onValueChange={(value) => {
                                setIsPending(id)
                                setCurrentAction(id)

                                // Set loading state on selected rows if this action affects rows
                                if (affectsAllSelectedRows) {
                                    const selectedRows =
                                        table.getFilteredSelectedRowModel().rows
                                    const rowIds = selectedRows.map(
                                        (row) => row.id
                                    )
                                    setLoadingRows(rowIds)
                                }

                                startTransition(() => {
                                    onValueChange(value as TValue)
                                })
                            }}
                        >
                            <SelectTrigger className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                            <SelectContent align="center">
                                <SelectGroup>
                                    <SelectLabel>{label}</SelectLabel>
                                    <SelectSeparator />
                                    {options.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                            className="capitalize"
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                )
            }

            return (
                <React.Fragment>
                    {/* Status dropdown */}
                    {/* <DropdownActionButton
                        id="update-status"
                        icon={CheckCircle2}
                        label="Update status"
                        options={tasks.status.enumValues.map((status) => ({
                            label: toSentenceCase(status),
                            value: status,
                        }))}
                        onValueChange={(status) => {
                            const selectedRows =
                                table.getFilteredSelectedRowModel().rows
                            const ids = selectedRows.map(
                                (row) => row.original.id
                            )

                            updateTasks({
                                ids,
                                status,
                            }).then(({ error }) => {
                                if (error) {
                                    toast.error(error)
                                    return
                                }
                                toast.success(
                                    `Tasks status updated to ${status}`
                                )
                                setLoadingRows([]) // Clear loading state when done
                            })
                        }}
                    /> */}

                    {/* Priority dropdown */}
                    {/* <DropdownActionButton
                        id="update-priority"
                        icon={ArrowUp}
                        label="Update priority"
                        options={tasks.priority.enumValues.map((priority) => ({
                            label: toSentenceCase(priority),
                            value: priority,
                        }))}
                        onValueChange={(priority) => {
                            const selectedRows =
                                table.getFilteredSelectedRowModel().rows
                            const ids = selectedRows.map(
                                (row) => row.original.id
                            )

                            updateTasks({
                                ids,
                                priority,
                            }).then(({ error }) => {
                                if (error) {
                                    toast.error(error)
                                    return
                                }
                                toast.success(
                                    `Tasks priority updated to ${priority}`
                                )
                                setLoadingRows([]) // Clear loading state when done
                            })
                        }}
                    /> */}

                    <ActionButton
                        id="export"
                        icon={Download}
                        label="Export tasks"
                        affectsAllSelectedRows={false} // Export doesn't change row data
                        onClick={() => {
                            exportTableToCSV(table, {
                                excludeColumns: ['select', 'actions'],
                                onlySelected: true,
                            })

                            toast.success('Tasks exported to CSV')
                            setCurrentAction(null) // Clear action state when done
                        }}
                    />

                    <ActionButton
                        id="copy"
                        icon={ClipboardCopy}
                        label="Copy to clipboard"
                        affectsAllSelectedRows={false} // Copy doesn't change row data
                        onClick={() => {
                            const selectedRows =
                                table.getFilteredSelectedRowModel().rows
                            const selectedData = selectedRows
                                .map((row) => {
                                    const data = { ...row.original }
                                    return JSON.stringify(data, null, 2)
                                })
                                .join('\n')

                            navigator.clipboard
                                .writeText(selectedData)
                                .then(() => {
                                    toast.success('Copied data to clipboard')
                                    setCurrentAction(null) // Clear action state when done
                                })
                                .catch(() =>
                                    toast.error('Failed to copy to clipboard')
                                )
                        }}
                    />

                    <ActionButton
                        id="print"
                        icon={Printer}
                        label="Print selected"
                        affectsAllSelectedRows={false} // Print doesn't change row data
                        onClick={() => {
                            const selectedRows =
                                table.getFilteredSelectedRowModel().rows

                            // Create a printable version of the selected rows
                            const printContent = `
              <html>
                <head>
                  <title>Selected Tasks</title>
                  <style>
                    body { font-family: Arial, sans-serif; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                  </style>
                </head>
                <body>
                  <h2>Selected Tasks (${selectedRows.length})</h2>
                  <table>
                    <thead>
                      <tr>
                        ${table
                            .getAllColumns()
                            .filter(
                                (col) =>
                                    col.id !== 'select' && col.id !== 'actions'
                            )
                            .map(
                                (col) =>
                                    `<th>${col.columnDef.header?.toString() || col.id}</th>`
                            )
                            .join('')}
                      </tr>
                    </thead>
                    <tbody>
                      ${selectedRows
                          .map(
                              (row) => `
                        <tr>
                          ${table
                              .getAllColumns()
                              .filter(
                                  (col) =>
                                      col.id !== 'select' &&
                                      col.id !== 'actions'
                              )
                              .map((col) => {
                                  const value =
                                      row.original[col.id as keyof McpRequestHierarchy]
                                  return `<td>${value !== null && value !== undefined ? value : ''}</td>`
                              })
                              .join('')}
                        </tr>
                      `
                          )
                          .join('')}
                    </tbody>
                  </table>
                </body>
              </html>
            `

                            const printWindow = window.open(
                                '',
                                '',
                                'height=600,width=800'
                            )
                            if (printWindow) {
                                printWindow.document.write(printContent)
                                printWindow.document.close()
                                printWindow.focus()
                                printWindow.print()
                                printWindow.close()
                                toast.success('Print job sent')
                                setCurrentAction(null) // Clear action state when done
                            } else {
                                toast.error('Unable to open print window')
                                setCurrentAction(null) // Clear action state when done
                            }
                        }}
                    />

                    <ActionButton
                        id="archive"
                        icon={Archive}
                        label="Archive tasks"
                        onClick={() => {
                            const selectedRows =
                                table.getFilteredSelectedRowModel().rows

                            // Mock implementation - in a real app, you'd call your API
                            setTimeout(() => {
                                toast.success(
                                    `${selectedRows.length} tasks archived`
                                )
                                // Clear selection after archiving
                                table.toggleAllRowsSelected(false)
                                setLoadingRows([]) // Clear loading state when done
                                setCurrentAction(null) // Clear action state when done
                            }, 1000)
                        }}
                    />

                    <ActionButton
                        id="favorite"
                        icon={Star}
                        label="Mark as favorite"
                        onClick={() => {
                            const selectedRows =
                                table.getFilteredSelectedRowModel().rows

                            // Mock implementation - in a real app, you'd call your API
                            setTimeout(() => {
                                toast.success(
                                    `${selectedRows.length} tasks marked as favorite`
                                )
                                setLoadingRows([]) // Clear loading state when done
                                setCurrentAction(null) // Clear action state when done
                            }, 1000)
                        }}
                    />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="size-7 border"
                                    >
                                        <Tag
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>
                                            Add tags to tasks
                                        </SheetTitle>
                                        <SheetDescription>
                                            Apply tags to better organize and
                                            filter your tasks.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="mt-6 flex flex-col gap-4">
                                        <div className="flex flex-row gap-2">
                                            <Input
                                                placeholder="Enter tag name..."
                                                value={tagState}
                                                onChange={(e) =>
                                                    setTagState(e.target.value)
                                                }
                                            />
                                            <Button
                                                onClick={() => {
                                                    if (!tagState.trim()) {
                                                        toast.error(
                                                            'Please enter a valid tag'
                                                        )
                                                        return
                                                    }

                                                    const selectedRows =
                                                        table.getFilteredSelectedRowModel()
                                                            .rows

                                                    setCurrentAction('add-tag')
                                                    setLoadingRows(
                                                        selectedRows.map(
                                                            (row) => row.id
                                                        )
                                                    )

                                                    // Mock implementation - in a real app, you'd call your API
                                                    setTimeout(() => {
                                                        toast.success(
                                                            `Tag "${tagState}" applied to ${selectedRows.length} tasks`
                                                        )
                                                        setTagState('')
                                                        setCurrentAction(null)
                                                        setLoadingRows([])
                                                    }, 1000)
                                                }}
                                            >
                                                {isPending &&
                                                currentAction === 'add-tag' ? (
                                                    <div className="flex items-center gap-1">
                                                        <Loader
                                                            className="size-3.5 animate-spin"
                                                            aria-hidden="true"
                                                        />
                                                        <span>Applying...</span>
                                                    </div>
                                                ) : (
                                                    'Apply'
                                                )}
                                            </Button>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {[
                                                'Important',
                                                'Urgent',
                                                'Bug',
                                                'Feature',
                                                'Enhancement',
                                                'Documentation',
                                            ].map((tagName) => (
                                                <Badge
                                                    key={tagName}
                                                    variant="outline"
                                                    className="hover:bg-accent cursor-pointer"
                                                    onClick={() => {
                                                        setTagState(tagName)

                                                        const selectedRows =
                                                            table.getFilteredSelectedRowModel()
                                                                .rows
                                                        setCurrentAction(
                                                            `tag-${tagName}`
                                                        )
                                                        setLoadingRows(
                                                            selectedRows.map(
                                                                (row) => row.id
                                                            )
                                                        )

                                                        // Mock implementation - in a real app, you'd call your API
                                                        setTimeout(() => {
                                                            toast.success(
                                                                `Tag "${tagName}" applied to ${selectedRows.length} tasks`
                                                            )
                                                            setCurrentAction(
                                                                null
                                                            )
                                                            setLoadingRows([])
                                                        }, 1000)
                                                    }}
                                                >
                                                    {tagName}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </TooltipTrigger>
                        <TooltipContent className="bg-accent text-foreground border font-semibold dark:bg-zinc-900">
                            <p>Add tags</p>
                        </TooltipContent>
                    </Tooltip>

                    <ActionButton
                        id="delete"
                        icon={Trash2}
                        label="Delete tasks"
                        variant="destructive"
                        onClick={() => {
                            const selectedRows =
                                table.getFilteredSelectedRowModel().rows
                            const ids = selectedRows.map(
                                (row) => generateId(row.original)
                            )

                            deleteTasks({
                                ids,
                            }).then(({ error }) => {
                                if (error) {
                                    toast.error(error)
                                    setLoadingRows([]) // Clear loading state on error
                                    return
                                }

                                toast.success('Tasks deleted')
                                table.toggleAllRowsSelected(false)
                                setLoadingRows([]) // Clear loading state when done
                            })
                        }}
                    />
                </React.Fragment>
            )
        },
        [isPending, currentAction, tag]
    )

    // Function to handle changes in loading row state
    const handleLoadingRowsChange = React.useCallback((rowIds: string[]) => {
        setLoadingRows(rowIds)
    }, [])

    console.log(nodes)

    return (
        <div className="relative">
            {isPending && (
                <div className="bg-background/50 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
                    <Loader className="h-6 w-6 animate-spin" />
                </div>
            )}
            <div className="mb-4 flex items-center justify-between">
                {/* You may want to add a toolbar here if needed */}
                <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground text-sm">
                        Row reordering:
                    </span>
                    {/* You may want to use a Switch component from your UI library */}
                    <input
                        type="checkbox"
                        checked={reorderableRows}
                        onChange={e => setReorderableRows(e.target.checked)}
                        aria-label="Toggle row reordering"
                    />
                </div>
            </div>
            <DataTable
                table={table}
                loadingRows={loadingRows}
                enableRowReordering={reorderableRows}
                onRowReorder={handleRowReorder}
                floatingBar={
                    <TasksTableFloatingBar
                        table={table}
                        actionGenerator={generateActions}
                        helpers={{ tag, setTag }}
                        onLoadingRowsChange={handleLoadingRowsChange}
                    />
                }
            >
                <DataTableToolbar
                    table={table}
                    instance={filtersInstance}
                    filters={filters}
                    joinOperator={operator}
                    onFilterChange={setFilters}
                    onJoinOperatorChange={setOperator}
                />
                <div className="flex items-center justify-between py-2">
                    <DataTableViewOptions table={table} />
                    {/* <DataTablePagination table={table} /> */}
                </div>
            </DataTable>
            {/* Placeholders for update and delete dialogs if needed */}
        </div>
    )
}
