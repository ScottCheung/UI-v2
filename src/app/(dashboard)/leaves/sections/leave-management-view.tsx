"use client"

import * as React from "react"
import { Plus, Edit2, Trash2, Thermometer, Ban, Sun, GripVertical, Settings2, Check } from "lucide-react"
import { ColumnDef, SortingState, VisibilityState } from "@tanstack/react-table"
import { Button } from "@/components/UI/Button"
import { Badge } from "@/components/UI/badge"
import { IconBox } from "@/components/UI/icon/box"
import { Checkbox } from "@/components/UI/checkbox"
import { DataTable } from "@/components/UI/table/data-table"
import { ColumnSettingsDialog } from "@/components/UI/table/column-settings"

import { TableToolbar } from "@/components/custom/table-toolbar"

import { cn } from "@/lib/utils"
import { LeaveConfigurationDialog } from "../components/leave-configuration-dialog"
import {
    useLeaveTypes,
    useDeleteLeaveType,
    useDeleteLeaveTypes,
    LeaveType,
    useUpdateLeaveType
} from "@/api"
import { StatusSwitch } from "@/components/custom/status-switch"
import { useAccounts } from "@/api"

import { useSearch } from "@/hooks/use-search"

import { WaterfallLayout } from "@/components/layout/waterfallLayout"
import { notify } from "@/lib/notifications"
import { CardBackgroundInitials } from "@/components/UI/card/card-background-initials"
import { AddEntityCard } from "@/components/custom/add-entity-card"
import { AutoTooltip } from "@/components/UI/tooltip/auto-tooltip"
import { useLayoutStore } from "@/lib/store/layout-store"
import { Tooltip } from "@/components/UI/tooltip"
import { EditingOverlay } from "@/components/custom/overlay/editing-overlay"
import { SelectionOverlay } from "@/components/custom/overlay/selection-overlay"
import { useHeader } from "@/hooks/use-header"
import { H3 } from "@/components/UI/text/typography"
import { usePreferencesActions, usePreferencesStore } from "@/lib/store/preferences-store"

export function LeaveManagementView() {
    const search = useSearch()
    const { value: searchQuery, debouncedValue: debouncedSearchQuery, isDebouncing } = search

    const { actions: { openDrawer, closeDrawer }, isDrawerOpen } = useLayoutStore()

    const [selectedLeaveType, setSelectedLeaveType] = React.useState<LeaveType | null>(null)
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [selectedAccountIds, setSelectedAccountIds] = React.useState<string[]>([])
    const [selectedRows, setSelectedRows] = React.useState<LeaveType[]>([])
    const [isTextExpanded, setIsTextExpanded] = React.useState(false)
    const [sorting, setSorting] = React.useState<SortingState>([{ id: "Name", desc: false }])

    const viewMode = usePreferencesStore((state) => state.viewMode)
    const isSelectionMode = usePreferencesStore((state) => state.isSelectionMode)
    const columnSettings = usePreferencesStore((state) => state.columnSettings['leaves'])
    const { setViewMode, setSelectionMode, setColumnSettings } = usePreferencesActions()
    const columnVisibility = columnSettings?.visibility || {}
    const columnOrder = columnSettings?.order || []

    const { data: accounts } = useAccounts()
    const { data: leaveTypes, isLoading } = useLeaveTypes()
    const deleteLeaveType = useDeleteLeaveType()
    const updateLeaveType = useUpdateLeaveType() // Move hook usage top level

    // Clear editingId when drawer closes
    React.useEffect(() => {
        if (!isDrawerOpen) {
            setEditingId(null)
        }
    }, [isDrawerOpen])

    // Helper function to get account name by ID
    const getAccountName = (accountId: string) => {
        return accounts?.find(acc => acc.AccountId === accountId)?.Name || "Unknown"
    }

    const filteredLeaveTypes = React.useMemo(() => {
        if (!leaveTypes) return []

        let result = leaveTypes

        // Filter by account
        if (selectedAccountIds.length > 0) {
            result = result.filter(t => selectedAccountIds.includes(t.AccountId))
        }

        // Filter by search query
        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase()
            result = result.filter(t => {
                // Helper to check if a value matches the query
                const matches = (val: any) => String(val).toLowerCase().includes(query)

                return (
                    matches(t.Name) ||
                    matches(t.Code) ||
                    matches(getAccountName(t.AccountId)) ||
                    (t.Description && matches(t.Description)) ||
                    (t.IsActive ? matches("active") : matches("inactive"))
                )
            })
        }

        return result
    }, [leaveTypes, selectedAccountIds, debouncedSearchQuery])

    const sortedLeaveTypes = React.useMemo(() => {
        let result = [...filteredLeaveTypes]
        const sort = sorting[0]
        if (!sort) return result

        return result.sort((a, b) => {
            // @ts-ignore - dynamic sorting
            let valA: any = a[sort.id as keyof LeaveType] || ""
            // @ts-ignore
            let valB: any = b[sort.id as keyof LeaveType] || ""

            // Special case for AccountId (sort by Name)
            if (sort.id === 'AccountId') {
                valA = getAccountName(a.AccountId).toLowerCase()
                valB = getAccountName(b.AccountId).toLowerCase()
            }

            // Handle strings
            if (typeof valA === 'string' && typeof valB === 'string') {
                valA = valA.toLowerCase()
                valB = valB.toLowerCase()
            }

            if (valA < valB) return sort.desc ? 1 : -1
            if (valA > valB) return sort.desc ? -1 : 1
            return 0
        })
    }, [filteredLeaveTypes, sorting, accounts])

    // Clear selection when selection mode is disabled
    React.useEffect(() => {
        if (!isSelectionMode) {
            setSelectedRows([])
        }
    }, [isSelectionMode])

    const handleCreate = () => {
        setEditingId(null)
        openDrawer({
            title: "Create Leave Type",
            width: 772,
            content: (
                <LeaveConfigurationDialog
                    leaveType={null}
                    accountId={selectedAccountIds.length === 1 ? selectedAccountIds[0] : ""}
                    onClose={closeDrawer}
                />
            )
        })
    }

    const handleEdit = (type: LeaveType) => {
        setEditingId(type.LeaveTypeId)
        openDrawer({
            title: "Edit Leave Type",
            width: 772,
            content: (
                <LeaveConfigurationDialog
                    leaveType={type}
                    accountId={selectedAccountIds.length === 1 ? selectedAccountIds[0] : ""}
                    onClose={() => {
                        setEditingId(null)
                        closeDrawer()
                    }}
                />
            )
        })
    }

    const handleDelete = async (id: string) => {
        const type = leaveTypes?.find(t => t.LeaveTypeId === id)
        if (confirm(`Are you sure you want to delete the leave type "${type?.Name}"?`)) {
            try {
                await deleteLeaveType.mutateAsync(id)
                notify.success(`You successfully deleted the leave type ———— ${type?.Name || 'Unknown'}`, "Delete Leave Type Success")
            } catch (error) {
                notify.error("Failed to delete leave type. Please try again later.", "Delete Leave Type Error")
            }
        }
    }

    const deleteLeaveTypes = useDeleteLeaveTypes()

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return

        const count = selectedRows.length
        if (confirm(`Are you sure you want to delete ${count} leave type${count > 1 ? 's' : ''}?`)) {
            try {
                const ids = selectedRows.map(r => r.LeaveTypeId)
                await deleteLeaveTypes.mutateAsync(ids)
                setSelectedRows([])
                notify.success(`You successfully deleted ${count} leave type${count > 1 ? 's' : ''}`, "Bulk Delete Success")
            } catch (error) {
                notify.error("Failed to delete leave types. Please try again later.", "Bulk Delete Error")
            }
        }
    }

    const toggleSelection = (type: LeaveType) => {
        setSelectedRows(prev => {
            const isSelected = prev.some(r => r.LeaveTypeId === type.LeaveTypeId)
            if (isSelected) {
                return prev.filter(r => r.LeaveTypeId !== type.LeaveTypeId)
            } else {
                return [...prev, type]
            }
        })
    }

    const columns = React.useMemo<ColumnDef<LeaveType>[]>(() => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                />
            ),
            enableSorting: false,
            size: 50,
        },
        {
            accessorKey: "Name",
            header: "Name",
            cell: ({ row }) => (
                <AutoTooltip className="font-medium text-primary">
                    {row.getValue("Name")}
                </AutoTooltip>
            ),
        },
        {
            accessorKey: "Code",
            header: "Code",
            cell: ({ row }) => (
                <Badge variant="code">
                    <AutoTooltip>
                        {row.getValue("Code")}
                    </AutoTooltip>
                </Badge>
            ),
        },
        {
            accessorKey: "AccountId",
            header: "Account",
            sortingFn: (rowA, rowB, columnId) => {
                const nameA = getAccountName(rowA.getValue(columnId) as string).toLowerCase()
                const nameB = getAccountName(rowB.getValue(columnId) as string).toLowerCase()
                return nameA.localeCompare(nameB)
            },
            cell: ({ row }) => (
                <AutoTooltip className="text-ink-primary">
                    {getAccountName(row.getValue("AccountId") || "")}
                </AutoTooltip>
            ),
        },
        {
            accessorKey: "Description",
            header: "Description",
            cell: ({ row }) => (
                <AutoTooltip className="text-ink-secondary dark:text-gray-400 truncate max-w-[200px] block">
                    {row.getValue("Description") || "-"}
                </AutoTooltip>
            ),
        },
        {
            accessorKey: "MinIncrementMinutes",
            header: "Min Increment",
            cell: ({ row }) => (
                <span className="text-ink-primary text-sm">
                    {row.getValue("MinIncrementMinutes")} min
                </span>
            ),
        },
        {
            accessorKey: "MinNoticeDays",
            header: "Min Notice",
            cell: ({ row }) => {
                const days = row.getValue("MinNoticeDays") as number;
                return (
                    <span className="text-ink-primary text-sm">
                        {days} {days === 1 ? 'day' : 'days'}
                    </span>
                );
            },
        },
        {
            accessorKey: "CountsForAnnualLeaveAccrual",
            header: "Annual Accrual",
            cell: ({ row }) => (
                row.getValue("CountsForAnnualLeaveAccrual") ? (
                    <Badge variant="outline" className="text-[10px] border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400">Yes</Badge>
                ) : <span className="text-gray-400 text-xs">No</span>
            ),
        },
        {
            accessorKey: "IsActive",
            header: "Status",
            cell: ({ row }) => {
                return (
                    <StatusSwitch
                        checked={row.getValue("IsActive")}
                        onCheckedChange={async (checked) => {
                            notify.info("Status update is not supported by API yet")
                            return
                        }}
                        disabled={true}
                        className="scale-75"
                    />
                )
            },
        },
    ], [accounts]) // Dependencies for getAccountName (which uses accounts)

    // Initialize columnOrder
    React.useEffect(() => {
        if (columnOrder.length === 0) {
            setColumnSettings('leaves', {
                order: columns.map(c => c.id || (c as any).accessorKey as string)
            })
        }
    }, [columns, columnOrder.length, setColumnSettings])

    const isSettingsOpen = isDrawerOpen && useLayoutStore.getState().drawerConfig.title === "View Settings"

    const handleSettingsClick = () => {
        if (isSettingsOpen) {
            notify.info("View settings closed")
            closeDrawer()
            return
        }

        notify.info("View settings opened")
        setEditingId(null)
        openDrawer({
            title: "View Settings",
            width: 400,
            content: (
                <ColumnSettingsDialog
                    columns={columns}
                    columnOrder={columnOrder}
                    setColumnOrder={(order) => setColumnSettings('leaves', { order })}
                    columnVisibility={columnVisibility}
                    setColumnVisibility={(updaterOrValue) => {
                        const newValue = typeof updaterOrValue === 'function'
                            ? (updaterOrValue as (prev: any) => any)(columnVisibility)
                            : updaterOrValue
                        setColumnSettings('leaves', { visibility: newValue })
                    }}
                    enableTextTruncationToggle={true}
                    isTextExpanded={isTextExpanded}
                    onTextExpandedChange={setIsTextExpanded}
                    onClose={() => {
                        notify.info("View settings closed")
                        closeDrawer()
                    }}
                />
            )
        })
    }

    useHeader({
        title: "Leave Types",
        description: "Manage leave entitlements and rules.",
        actions: null,
        children: (
            <TableToolbar
                search={{
                    value: searchQuery,
                    onChange: search.onChange,
                    placeholder: "Search leave types...",
                    isDebouncing
                }}
                filter={{
                    accounts: accounts || [],
                    selectedIds: selectedAccountIds,
                    onSelectionChange: setSelectedAccountIds,
                    totalCount: leaveTypes?.length
                }}
                onSettingsClick={handleSettingsClick}
                isSettingsOpen={isSettingsOpen}
            >
                {selectedRows.length > 0 && (
                    <Tooltip content={`Delete ${selectedRows.length} selected items`}>
                        <Button
                            onClick={handleBulkDelete}
                            variant="destructive"
                            size="icon"
                            className="rounded-full"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </Tooltip>
                )}
                <Tooltip content={isSelectionMode ? "Exit Selection Mode" : "Multi-Select"}>
                    <Button
                        onClick={() => {
                            const newMode = !isSelectionMode
                            setSelectionMode(newMode)
                            if (newMode) {
                                notify.info("Entered multi-select mode")
                                openDrawer({ content: null, width: 0 })
                                closeDrawer()
                                useLayoutStore.getState().actions.setSidebarCollapsed(true)
                            } else {
                                notify.info("Exited multi-select mode")
                            }
                        }}
                        variant={isSelectionMode ? "default" : "ghost"}
                        size="icon"
                    >
                        <GripVertical className="size-4" />
                    </Button>
                </Tooltip>
                <Tooltip content={selectedAccountIds.length !== 1 ? "Select exactly one account to create" : "Create New Leave Type"}>
                    <div className="inline-block">
                        <Button
                            onClick={handleCreate}
                            disabled={selectedAccountIds.length !== 1}
                            size="icon"
                            className="rounded-full"
                        >
                            <Plus className="size-4" />
                        </Button>
                    </div>
                </Tooltip>
            </TableToolbar>
        )
    })

    return (
        <div className="flex flex-1 items-start gap-4">
            <div className="flex-1 space-y-6 min-w-0">
                {
                    viewMode === "table" ? (
                        <div className="rounded-2xl border border-gray-200 bg-panel -sm dark:border-zinc-800 /50">

                            <DataTable
                                columns={columns}
                                data={filteredLeaveTypes}
                                enableSorting={true}
                                enableColumnVisibility={true}
                                enableRowSelection={true}
                                onRowSelectionChange={setSelectedRows}
                                enableTextTruncationToggle={true}
                                isTextExpanded={isTextExpanded}
                                onTextExpandedChange={setIsTextExpanded}
                                defaultSorting={[{ id: "Name", desc: false }]}
                                sorting={sorting}
                                onSortingChange={setSorting}
                                columnVisibility={columnVisibility}
                                onColumnVisibilityChange={(updaterOrValue) => {
                                    const newValue = typeof updaterOrValue === 'function' ? updaterOrValue(columnVisibility) : updaterOrValue
                                    setColumnSettings('leaves', { visibility: newValue })
                                }}
                                columnOrder={columnOrder}
                                onColumnOrderChange={(updaterOrValue) => {
                                    const newValue = typeof updaterOrValue === 'function' ? updaterOrValue(columnOrder) : updaterOrValue
                                    setColumnSettings('leaves', { order: newValue })
                                }}
                                hideToolbar={true}
                                isSelectionMode={isSelectionMode}
                                onSelectionModeChange={(mode) => setSelectionMode(mode)}
                                renderRowActions={(row) => (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full text-ink-secondary hover:text-gray-900 hover:bg-gray-500/10 dark:text-gray-400 dark:hover:text-white dark:hover:bg-zinc-800"
                                            onClick={() => handleEdit(row.original)}
                                        >
                                            <Edit2 className="size-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="rounded-full text-ink-secondary hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                                            onClick={() => handleDelete(row.original.LeaveTypeId)}
                                        >
                                            <Trash2 className="size-5" />
                                        </Button>
                                    </>
                                )}
                            />
                        </div>
                    ) : (
                        <WaterfallLayout
                            minColumnWidth={isSelectionMode ? { sm: 150, md: 150, lg: 180, xl: 200 } : undefined}
                            itemScale={isSelectionMode ? 0.9 : 1}
                        >
                            {filteredLeaveTypes.map((type) => {
                                const isSelected = selectedRows.some(r => r.LeaveTypeId === type.LeaveTypeId)
                                const isEditing = editingId === type.LeaveTypeId
                                return (
                                    <div
                                        key={type.LeaveTypeId}
                                        onClick={() => isSelectionMode ? toggleSelection(type) : handleEdit(type)}
                                        className={cn(
                                            "group relative overflow-hidden rounded-card border-2 bg-panel p-card transition-all hover:border-primary/50 hover:dark:border-primary cursor-pointer",
                                            isSelected ? "border-green-500 bg-green-50/5 dark:bg-green-900/10 ring-1 ring-green-500" : "border-transparent"
                                        )}
                                    >
                                        {isSelected && <SelectionOverlay />}
                                        {isEditing && <EditingOverlay />}
                                        <CardBackgroundInitials name={type.Name} />

                                        <div className="relative z-10">
                                            {/* Decorative Icon (Fixed) */}
                                            <div className="mb-4 flex items-start justify-between">
                                                <IconBox>
                                                    {type.Name.toLowerCase().includes('sick') ? (
                                                        <Thermometer className="size-6" />
                                                    ) : type.Name.toLowerCase().includes('unpaid') ? (
                                                        <Ban className="size-6" />
                                                    ) : (
                                                        <Sun className="size-6" />
                                                    )}
                                                </IconBox>
                                            </div>

                                            {/* Dynamic Body Content based on columnOrder */}
                                            {columnOrder.map(colId => {
                                                if (columnVisibility[colId] === false) return null

                                                switch (colId) {
                                                    case 'Name':
                                                        return (
                                                            <H3 key={colId} className="mb-2 text-primary">
                                                                <AutoTooltip className="font-bold">
                                                                    {type.Name}
                                                                </AutoTooltip>
                                                            </H3>
                                                        )

                                                    case 'Code':
                                                        return (
                                                            <Badge key={colId} variant="code" className="mb-4">
                                                                <AutoTooltip>
                                                                    {type.Code}
                                                                </AutoTooltip>
                                                            </Badge>
                                                        )
                                                    case 'Description':
                                                        return type.Description ? (
                                                            <div key={colId} className="mb-4">
                                                                <AutoTooltip className="text-sm text-ink-secondary dark:text-gray-400">
                                                                    {type.Description}
                                                                </AutoTooltip>
                                                            </div>
                                                        ) : null
                                                    case 'AccountId':
                                                        return (
                                                            <div key={colId} className="space-y-2 mb-2">
                                                                <div className="flex items-center justify-between text-xs h-5">
                                                                    <span className="text-ink-secondary shrink-0">Account</span>
                                                                    <AutoTooltip className="font-medium text-ink-primary text-right ml-4 max-w-[150px]">
                                                                        {getAccountName(type.AccountId)}
                                                                    </AutoTooltip>
                                                                </div>
                                                            </div>
                                                        )
                                                    case 'MinIncrementMinutes':
                                                        return (
                                                            <div key={colId} className="flex items-center justify-between text-xs h-5 mb-1">
                                                                <span className="text-ink-secondary shrink-0">Min Increment</span>
                                                                <span className="font-medium text-ink-primary text-right ml-4">
                                                                    {type.MinIncrementMinutes} min
                                                                </span>
                                                            </div>
                                                        )
                                                    case 'MinNoticeDays':
                                                        return (
                                                            <div key={colId} className="flex items-center justify-between text-xs h-5 mb-1">
                                                                <span className="text-ink-secondary shrink-0">Min Notice Days</span>
                                                                <span className="font-medium text-ink-primary text-right ml-4">
                                                                    {type.MinNoticeDays} {type.MinNoticeDays === 1 ? 'day' : 'days'}
                                                                </span>
                                                            </div>
                                                        )
                                                    case 'CountsForAnnualLeaveAccrual':
                                                        return (
                                                            <div key={colId} className="flex items-center justify-between text-xs h-5 mb-1">
                                                                <span className="text-ink-secondary shrink-0">Counts for Annual Accrual</span>
                                                                <span className="font-medium text-ink-primary text-right ml-4">
                                                                    {type.CountsForAnnualLeaveAccrual ? "Yes" : "No"}
                                                                </span>
                                                            </div>
                                                        )
                                                    case 'IsActive':
                                                        return (
                                                            <div key={colId} className="mb-4">
                                                                <span className={cn(
                                                                    "rounded-full px-2.5 py-1 text-xs font-bold",
                                                                    type.IsActive
                                                                        ? "bg-green-500/10 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                                                        : "bg-gray-500/10 text-ink-secondary dark:bg-zinc-800 dark:text-gray-400"
                                                                )}>
                                                                    {type.IsActive ? "Active" : "Inactive"}
                                                                </span>
                                                            </div>
                                                        )
                                                    default:
                                                        return null
                                                }
                                            })}
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Add Leave Type Placeholder */}
                            <div className="flex flex-col gap-2">
                                <AddEntityCard
                                    onClick={() => {
                                        if (selectedAccountIds.length === 1) {
                                            handleCreate()
                                        }
                                    }}
                                    label="Add Leave Type"
                                    className={selectedAccountIds.length !== 1 ? "opacity-50 cursor-not-allowed hover:border-gray-200 hover:bg-transparent dark:hover:border-zinc-700" : ""}
                                />
                                {selectedAccountIds.length !== 1 && (
                                    <p className="text-center text-xs text-red-500">
                                        Select one account first
                                    </p>
                                )}
                            </div>
                        </WaterfallLayout>
                    )
                }
            </div>
        </div>
    )
}
