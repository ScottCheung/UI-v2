"use client"

import * as React from "react"
import { Plus, Edit2, Trash2, LayoutGrid, List, Scroll, GripVertical } from "lucide-react"
import { ColumnDef, VisibilityState } from "@tanstack/react-table"
import { Button } from "@/components/UI/Button"
import { Badge } from "@/components/UI/badge"
import { IconBox } from "@/components/UI/icon/box"
import { Checkbox } from "@/components/UI/checkbox"
import { DataTable } from "@/components/UI/table/data-table"

import { TableToolbar } from "@/components/custom/table-toolbar"
import { SegmentedControl } from "@/components/UI/segmented-control"
import { Card } from "@/components/UI/card"
import { cn } from "@/lib/utils"
import { LeaveRuleConfigurationDialog } from "../components/leave-rule-configuration-dialog"
import { H3 } from "@/components/UI/text/typography"
import { useSearch } from "@/hooks/use-search"
import { WaterfallLayout } from "@/components/layout/waterfallLayout"
import {
    useLeaveTypeRules,
    useDeleteLeaveTypeRule,
    useDeleteLeaveTypeRules,
    LeaveTypeRule,
    useLeaveTypes,
    useEmploymentTypes,
    useUpdateLeaveTypeRule
} from "@/api"
import { notify } from "@/lib/notifications"
import { CardBackgroundInitials } from "@/components/UI/card/card-background-initials"
import { StatusSwitch } from "@/components/custom/status-switch"
import { AddEntityCard } from "@/components/custom/add-entity-card"
import { AutoTooltip } from "@/components/UI/tooltip/auto-tooltip"
import { useLayoutStore } from "@/lib/store/layout-store"
import { ColumnSettingsDialog } from "@/components/UI/table/column-settings"
import { EditingOverlay } from "@/components/custom/overlay/editing-overlay"
import { SelectionOverlay } from "@/components/custom/overlay/selection-overlay"
import { Tooltip } from "@/components/UI/tooltip"
import { useHeader } from "@/hooks/use-header"
import { usePreferencesActions, usePreferencesStore } from "@/lib/store/preferences-store"

export function LeaveRulesView() {
    const search = useSearch()
    const { value: searchQuery, debouncedValue: debouncedSearchQuery, isDebouncing } = search

    const [selectedRule, setSelectedRule] = React.useState<LeaveTypeRule | null>(null)
    const [selectedLeaveTypeIds, setSelectedLeaveTypeIds] = React.useState<string[]>([])
    const [selectedRows, setSelectedRows] = React.useState<LeaveTypeRule[]>([])
    const [editingId, setEditingId] = React.useState<string | null>(null)

    const viewMode = usePreferencesStore((state) => state.viewMode)
    const isSelectionMode = usePreferencesStore((state) => state.isSelectionMode)
    const columnSettings = usePreferencesStore((state) => state.columnSettings['leave-rules'])
    const { setViewMode, setSelectionMode, setColumnSettings } = usePreferencesActions()
    const columnVisibility = columnSettings?.visibility || {}
    const columnOrder = columnSettings?.order || []

    const { actions: { openDrawer, closeDrawer }, isDrawerOpen } = useLayoutStore()

    // Clear editingId when drawer closes
    React.useEffect(() => {
        if (!isDrawerOpen) {
            setEditingId(null)
        }
    }, [isDrawerOpen])

    // Clear selection when selection mode is disabled
    React.useEffect(() => {
        if (!isSelectionMode) {
            setSelectedRows([])
        }
    }, [isSelectionMode])

    // Column Settings State managed by store

    const { data: leaveTypes } = useLeaveTypes()
    const { data: employmentTypes } = useEmploymentTypes()

    // Fetch all rules
    const { data: rules, isLoading } = useLeaveTypeRules()
    const deleteRule = useDeleteLeaveTypeRule()

    // Helper to get names
    const getLeaveTypeName = React.useCallback((id: string) => leaveTypes?.find(t => t.LeaveTypeId === id)?.Name || "Unknown", [leaveTypes])
    const getEmploymentTypeName = React.useCallback((id: string) => employmentTypes?.find(t => t.EmploymentTypeId === id)?.Name || "Unknown", [employmentTypes])

    const filteredRules = React.useMemo(() => {
        if (!rules) return []

        let result = rules

        // Filter by leave type
        if (selectedLeaveTypeIds.length > 0) {
            result = result.filter(r => selectedLeaveTypeIds.includes(r.LeaveTypeId))
        }

        // Filter by search query
        if (debouncedSearchQuery) {
            const query = debouncedSearchQuery.toLowerCase()
            result = result.filter(r => {
                const matches = (val: any) => String(val).toLowerCase().includes(query)
                const leaveTypeName = getLeaveTypeName(r.LeaveTypeId)
                const employmentTypeName = getEmploymentTypeName(r.EmploymentTypeId)

                return (
                    matches(r.Code) ||
                    matches(r.AccrualMethod) ||
                    matches(r.AccrualRate) ||
                    matches(leaveTypeName) ||
                    matches(employmentTypeName) ||
                    (r.IsActive ? matches("active") : matches("inactive"))
                )
            })
        }

        return result.sort((a, b) => {
            const nameA = a.Name.toLowerCase()
            const nameB = b.Name.toLowerCase()
            return nameA.localeCompare(nameB)
        })
    }, [rules, selectedLeaveTypeIds, debouncedSearchQuery, leaveTypes, employmentTypes])

    const handleCreate = () => {
        setEditingId(null)
        openDrawer({
            title: "New Leave Rule",
            description: "Create a new leave accrual rule.",
            width: 672,
            content: (
                <LeaveRuleConfigurationDialog
                    onClose={closeDrawer}
                    rule={null}
                    preselectedLeaveTypeId={selectedLeaveTypeIds.length === 1 ? selectedLeaveTypeIds[0] : ""}
                />
            )
        })
    }

    const handleEdit = (rule: LeaveTypeRule) => {
        setEditingId(rule.LeaveTypeRuleId)
        openDrawer({
            title: "Edit Leave Rule",
            description: "Update existing leave accrual rule.",
            width: 672,
            content: (
                <LeaveRuleConfigurationDialog
                    onClose={() => {
                        setEditingId(null)
                        closeDrawer()
                    }}
                    rule={rule}
                />
            )
        })
    }

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
                    setColumnOrder={(order) => setColumnSettings('leave-rules', { order })}
                    columnVisibility={columnVisibility}
                    setColumnVisibility={(updaterOrValue) => {
                        const newValue = typeof updaterOrValue === 'function' ? (updaterOrValue as (prev: any) => any)(columnVisibility) : updaterOrValue
                        setColumnSettings('leave-rules', { visibility: newValue })
                    }}
                    onClose={() => {
                        notify.info("View settings closed")
                        closeDrawer()
                    }}
                />
            )
        })
    }

    const toggleSelection = (rule: LeaveTypeRule) => {
        setSelectedRows(prev => {
            const isSelected = prev.some(r => r.LeaveTypeRuleId === rule.LeaveTypeRuleId)
            if (isSelected) {
                return prev.filter(r => r.LeaveTypeRuleId !== rule.LeaveTypeRuleId)
            } else {
                return [...prev, rule]
            }
        })
    }

    const handleDelete = async (id: string) => {
        const rule = filteredRules.find(r => r.LeaveTypeRuleId === id)
        if (confirm(`Are you sure you want to delete the rule "${rule?.Name}"?`)) {
            try {
                await deleteRule.mutateAsync(id)
                notify.success(`You successfully deleted the rule ———— ${rule?.Name || 'Unknown'}`, "Delete Rule Success")
            } catch (error) {
                notify.error("Failed to delete rule. Please try again later.", "Delete Rule Error")
            }
        }
    }

    const deleteLeaveTypeRules = useDeleteLeaveTypeRules()

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) return

        const count = selectedRows.length
        if (confirm(`Are you sure you want to delete ${count} rule${count > 1 ? 's' : ''}?`)) {
            try {
                const ids = selectedRows.map(r => r.LeaveTypeRuleId)
                await deleteLeaveTypeRules.mutateAsync(ids)
                setSelectedRows([])
                notify.success(`You successfully deleted ${count} rule${count > 1 ? 's' : ''}`, "Bulk Delete Success")
            } catch (error) {
                notify.error("Failed to delete rules. Please try again later.", "Bulk Delete Error")
            }
        }
    }

    const columns: ColumnDef<LeaveTypeRule>[] = React.useMemo(() => [
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
            header: "Rule Name",
            cell: ({ row }) => (
                <span className="font-medium text-primary">
                    {row.getValue("Name")}
                </span>
            ),
        },
        {
            accessorKey: "Code",
            header: "Code",
            cell: ({ row }) => (
                <span className="text-ink-primary font-mono text-xs">
                    {row.getValue("Code")}
                </span>
            ),
        },
        {
            accessorKey: "LeaveTypeId",
            header: "Leave Type",
            cell: ({ row }) => (
                <span className="text-ink-primary text-sm">
                    {getLeaveTypeName(row.getValue("LeaveTypeId"))}
                </span>
            ),
        },
        {
            accessorKey: "EmploymentTypeId",
            header: "Employment Type",
            cell: ({ row }) => (
                <span className="text-ink-primary text-sm">
                    {getEmploymentTypeName(row.getValue("EmploymentTypeId"))}
                </span>
            ),
        },
        {
            accessorKey: "AccrualMethod",
            header: "Method",
            cell: ({ row }) => (
                <Badge variant="outline" className="text-xs">
                    {row.getValue("AccrualMethod")}
                </Badge>
            ),
        },
        {
            accessorKey: "AccrualRate",
            header: "Rate",
            cell: ({ row }) => (
                <span className="text-ink-primary">
                    {row.getValue("AccrualRate")}
                </span>
            ),
        },
        {
            accessorKey: "Description",
            header: "Description",
            cell: ({ row }) => (
                <span className="text-ink-secondary dark:text-gray-400 text-xs truncate max-w-[200px] block" title={row.getValue("Description")}>
                    {row.getValue("Description") || "-"}
                </span>
            ),
        },
        {
            accessorKey: "IncludePublicHolidays",
            header: "Inc. PH",
            cell: ({ row }) => (
                row.getValue("IncludePublicHolidays") ? (
                    <Badge variant="outline" className="text-[10px] border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400">Yes</Badge>
                ) : <span className="text-gray-400 text-xs">-</span>
            ),
        },
        {
            accessorKey: "DeductsOnPublicHoliday",
            header: "Ded. PH",
            cell: ({ row }) => (
                row.getValue("DeductsOnPublicHoliday") ? (
                    <Badge variant="outline" className="text-[10px] border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-900/20 dark:text-orange-400">Yes</Badge>
                ) : <span className="text-gray-400 text-xs">-</span>
            ),
        },
        {
            accessorKey: "EffectiveDate",
            header: "Effective Date",
            cell: ({ row }) => {
                const date = row.getValue("EffectiveDate") as string
                return (
                    <span className="text-ink-primary">
                        {date ? new Date(date).toLocaleDateString() : "-"}
                    </span>
                )
            },
        },
        {
            accessorKey: "IsActive",
            header: "Status",
            cell: ({ row }) => {
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const updateLeaveTypeRule = useUpdateLeaveTypeRule()
                return (
                    <StatusSwitch
                        checked={row.getValue("IsActive")}
                        onCheckedChange={async (checked) => {
                            try {
                                await updateLeaveTypeRule.mutateAsync({
                                    id: row.original.LeaveTypeRuleId,
                                    data: { ...row.original, IsActive: checked }
                                })
                                notify.success(`You successfully ${checked ? 'activated' : 'deactivated'} the rule ———— ${row.original.Name}`, "Update Rule Status Success")
                            } catch (error) {
                                notify.error("Failed to update rule status. Please try again.", "Update Rule Status Error")
                            }
                        }}
                        className="scale-75"
                    />
                )
            },
        },
    ], [getLeaveTypeName, getEmploymentTypeName])

    // Initialize column order on load
    React.useEffect(() => {
        if (columnOrder.length === 0) {
            setColumnSettings('leave-rules', {
                order: columns.map(c => (c.id || (c as any).accessorKey) as string)
            })
        }
    }, [columns, columnOrder.length, setColumnSettings])

    useHeader({
        title: "Leave Type Rules",
        description: "Manage accrual rules and limits for different leave types and employment types.",
        children: (
            <TableToolbar
                search={{
                    value: searchQuery,
                    onChange: search.onChange,
                    placeholder: "Search rules...",
                    isDebouncing
                }}
                filter={{
                    accounts: (leaveTypes || []).map(t => ({ AccountId: t.LeaveTypeId, Name: t.Name })),
                    selectedIds: selectedLeaveTypeIds,
                    onSelectionChange: setSelectedLeaveTypeIds,
                    totalCount: rules?.length,
                    title: "Filter by Leave Type"
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
                <Tooltip content="Create New Rule">
                    <div className="inline-block">
                        <Button
                            onClick={handleCreate}
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
        <div className="space-y-6">
            {viewMode === "table" ? (
                <div className="rounded-2xl border border-gray-200 bg-panel -sm dark:border-zinc-800 /50">

                    <DataTable
                        columns={columns}
                        data={filteredRules}
                        enableSorting={true}
                        enableRowSelection={true}
                        onRowSelectionChange={setSelectedRows}
                        hideToolbar={true}
                        isSelectionMode={isSelectionMode}
                        onSelectionModeChange={(mode) => setSelectionMode(mode)}
                        columnVisibility={columnVisibility}
                        onColumnVisibilityChange={(updaterOrValue) => {
                            const newValue = typeof updaterOrValue === 'function' ? updaterOrValue(columnVisibility) : updaterOrValue
                            setColumnSettings('leave-rules', { visibility: newValue })
                        }}
                        columnOrder={columnOrder}
                        onColumnOrderChange={(updaterOrValue) => {
                            const newValue = typeof updaterOrValue === 'function' ? updaterOrValue(columnOrder) : updaterOrValue
                            setColumnSettings('leave-rules', { order: newValue })
                        }}
                        defaultSorting={[{ id: "Name", desc: false }]}
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
                                    onClick={() => handleDelete(row.original.LeaveTypeRuleId)}
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
                    {filteredRules.map((rule) => {
                        const isSelected = selectedRows.some(r => r.LeaveTypeRuleId === rule.LeaveTypeRuleId)
                        const isEditing = editingId === rule.LeaveTypeRuleId
                        return (
                            <div
                                key={rule.LeaveTypeRuleId}
                                onClick={() => isSelectionMode ? toggleSelection(rule) : handleEdit(rule)}
                                className={cn(
                                    "group relative overflow-hidden rounded-card border-2 bg-panel p-card transition-all hover:border-primary/50 hover:dark:border-primary cursor-pointer",
                                    isSelected ? "border-green-500 bg-green-50/5 dark:bg-green-900/10 ring-1 ring-green-500" : "border-transparent"
                                )}
                            >
                                {isSelected && <SelectionOverlay />}
                                {isEditing && <EditingOverlay />}
                                <CardBackgroundInitials name={rule.Name} />


                                <div className="relative z-10">
                                    <div className="mb-4 flex items-start justify-between">
                                        <IconBox>
                                            <Scroll className="size-6" />
                                        </IconBox>
                                    </div>

                                    {columnOrder.map(colId => {
                                        if (columnVisibility[colId] === false) return null

                                        switch (colId) {
                                            case 'Name':
                                                return (
                                                    <H3 key={colId} className="mb-2 text-primary">
                                                        <AutoTooltip className="font-bold">
                                                            {rule.Name}
                                                        </AutoTooltip>
                                                    </H3>
                                                )
                                            case 'Code':
                                                return (
                                                    <Badge key={colId} variant="code" className="mb-4">
                                                        <AutoTooltip>
                                                            {rule.Code}
                                                        </AutoTooltip>
                                                    </Badge>
                                                )
                                            case 'Description':
                                                return rule.Description ? (
                                                    <div key={colId} className="mb-4">
                                                        <AutoTooltip className="text-sm text-ink-secondary dark:text-gray-400">
                                                            {rule.Description}
                                                        </AutoTooltip>
                                                    </div>
                                                ) : null
                                            case 'LeaveTypeId':
                                                return (
                                                    <div key={colId} className="flex items-center justify-between text-xs h-5 mb-1">
                                                        <span className="text-ink-secondary shrink-0">Leave Type</span>
                                                        <AutoTooltip className="font-medium text-ink-primary text-right ml-4 max-w-[150px]">
                                                            {getLeaveTypeName(rule.LeaveTypeId)}
                                                        </AutoTooltip>
                                                    </div>
                                                )
                                            case 'EmploymentTypeId':
                                                return (
                                                    <div key={colId} className="flex items-center justify-between text-xs h-5 mb-1">
                                                        <span className="text-ink-secondary shrink-0">Employment Type</span>
                                                        <AutoTooltip className="font-medium text-ink-primary text-right ml-4 max-w-[150px]">
                                                            {getEmploymentTypeName(rule.EmploymentTypeId)}
                                                        </AutoTooltip>
                                                    </div>
                                                )
                                            case 'EffectiveDate':
                                                return (
                                                    <div key={colId} className="flex items-center justify-between text-xs h-5 mb-1">
                                                        <span className="text-ink-secondary shrink-0">Effective Date</span>
                                                        <AutoTooltip className="font-medium text-ink-primary text-right ml-4 max-w-[150px]">
                                                            {rule.EffectiveDate ? new Date(rule.EffectiveDate).toLocaleDateString() : "-"}
                                                        </AutoTooltip>
                                                    </div>
                                                )
                                            case 'AccrualMethod':
                                                return (
                                                    <div key={colId} className="flex items-center justify-between text-xs h-5 mb-1">
                                                        <span className="text-ink-secondary shrink-0">Method</span>
                                                        <AutoTooltip className="font-medium text-ink-primary text-right ml-4 max-w-[150px]">
                                                            {rule.AccrualMethod}
                                                        </AutoTooltip>
                                                    </div>
                                                )
                                            case 'AccrualRate':
                                                return (
                                                    <div key={colId} className="flex items-center justify-between text-xs h-5 mb-1">
                                                        <span className="text-ink-secondary shrink-0">Rate</span>
                                                        <AutoTooltip className="font-medium text-ink-primary text-right ml-4 max-w-[150px]">
                                                            {rule.AccrualRate}
                                                        </AutoTooltip>
                                                    </div>
                                                )
                                            case 'IncludePublicHolidays':
                                                return (
                                                    <div key={colId} className="flex items-center justify-between text-xs h-5 mb-1">
                                                        <span className="text-ink-secondary shrink-0">Inc. Public Holidays</span>
                                                        <span className="font-medium text-ink-primary text-right ml-4">
                                                            {rule.IncludePublicHolidays ? "Yes" : "No"}
                                                        </span>
                                                    </div>
                                                )
                                            case 'DeductsOnPublicHoliday':
                                                return (
                                                    <div key={colId} className="flex items-center justify-between text-xs h-5 mb-1">
                                                        <span className="text-ink-secondary shrink-0">Deducts on PH</span>
                                                        <span className="font-medium text-ink-primary text-right ml-4">
                                                            {rule.DeductsOnPublicHoliday ? "Yes" : "No"}
                                                        </span>
                                                    </div>
                                                )
                                            case 'IsActive':
                                                return (
                                                    <div key={colId} className="mb-4">
                                                        <span className={cn(
                                                            "rounded-full px-2.5 py-1 text-xs font-bold",
                                                            rule.IsActive
                                                                ? "bg-green-500/10 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                                                : "bg-gray-500/10 text-ink-secondary dark:bg-zinc-800 dark:text-gray-400"
                                                        )}>
                                                            {rule.IsActive ? "Active" : "Inactive"}
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

                    {/* Add Rule Placeholder */}
                    <div key={'Add Leave Rule'}>
                        <AddEntityCard
                            onClick={handleCreate}
                            label="Add Leave Rule"
                        />      </div>
                </WaterfallLayout>
            )}
        </div>
    )
}
