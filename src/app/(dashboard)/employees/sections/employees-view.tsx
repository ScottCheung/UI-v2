
"use client"

import * as React from "react"
import {
    Search,
    Plus,
    User,
    Mail,
    MoreHorizontal,
    Edit2,
    Trash2,
    GripVertical,
} from "lucide-react"
import { Button } from "@/components/UI/Button"
import { Card } from "@/components/UI/card"
import { Input } from "@/components/UI/input"
import { Badge } from "@/components/UI/badge"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/UI/table/data-table"
import { TableToolbar } from "@/components/custom/table-toolbar"
import { ColumnDef, VisibilityState } from "@tanstack/react-table"
import { Checkbox } from "@/components/UI/checkbox"
import { StatusSwitch } from "@/components/custom/status-switch"
import { EmployeesOrgChart } from "../components/employees-org-chart"
import { Employee } from "../data/mock-employees"
import { EmployeeDialog } from "../components/employee-dialog"
import { H1, H3 } from "@/components/UI/text/typography"
import { useEmployees } from "../hooks/use-employees"
import { useSearch } from "@/hooks/use-search"
import { useLayoutStore } from "@/lib/store/layout-store"
import { ColumnSettingsDialog } from "@/components/UI/table/column-settings"
import { notify } from "@/lib/notifications"

import { usePreferencesActions, usePreferencesStore } from "@/lib/store/preferences-store"

type ViewMode = "card" | "chart" | "table"
type FilterType = "all" | "active" | "inactive"

export function EmployeesView() {
    const [filter, setFilter] = React.useState<FilterType>("all")
    const search = useSearch()
    const { value: searchQuery, debouncedValue: debouncedSearchQuery, isDebouncing } = search

    const { actions: { openDrawer, closeDrawer }, isDrawerOpen, drawerConfig } = useLayoutStore()
    const isSettingsOpen = isDrawerOpen && drawerConfig?.title === "View Settings"

    // Use the custom hook for data management
    const {
        employees,
        isLoaded,
        addEmployee,
        updateEmployee,
        updateEmployeeManager
    } = useEmployees()

    const viewMode = usePreferencesStore((state) => state.viewMode)
    const isSelectionMode = usePreferencesStore((state) => state.isSelectionMode)
    const columnSettings = usePreferencesStore((state) => state.columnSettings['employees'])
    const { setViewMode, setSelectionMode, setColumnSettings } = usePreferencesActions()
    const columnVisibility = columnSettings?.visibility || {}
    const columnOrder = columnSettings?.order || []

    const [selectedRows, setSelectedRows] = React.useState<Employee[]>([])

    // Clear selection when selection mode is disabled
    React.useEffect(() => {
        if (!isSelectionMode) {
            setSelectedRows([])
        }
    }, [isSelectionMode])

    const filteredEmployees = React.useMemo(() => {
        return employees.filter((employee) => {
            const matchesFilter =
                filter === "all" ||
                (filter === "active" && employee.status !== "inactive") ||
                (filter === "inactive" && employee.status === "inactive")

            const matchesSearch =
                employee.firstName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                employee.lastName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                employee.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
            return matchesFilter && matchesSearch
        })
    }, [filter, debouncedSearchQuery, employees])

    const handleSaveEmployee = (updatedEmployee: Employee) => {
        // Determine if update or add based on if we had a selected employee?
        // Actually EmployeeDialog handles the construct.
        // We need to know if it's new or existing.
        // The hook has updateEmployee and addEmployee.
        // Let's inspect handleSaveEmployee logic I'm replacing.
        // It checked 'selectedEmployee'.
        // But EmployeeDialog returns the object. We can check if it exists in 'employees' list?
        // Or just check 'id'.
        const exists = employees.find(e => e.id === updatedEmployee.id)
        if (exists) {
            updateEmployee(updatedEmployee)
            notify.success(`You successfully updated the employee ———— ${updatedEmployee.firstName} ${updatedEmployee.lastName}`, "Update Employee Success")
        } else {
            addEmployee(updatedEmployee)
            notify.success(`You successfully added a new employee ———— ${updatedEmployee.firstName} ${updatedEmployee.lastName}`, "Create Employee Success")
        }
        closeDrawer()
    }

    const handleAddEmployee = () => {
        openDrawer({
            title: "Add Employee",
            width: 672, // standard width for forms
            content: (
                <EmployeeDialog
                    onClose={closeDrawer}
                    employee={null}
                    onSave={handleSaveEmployee}
                    allEmployees={employees}
                />
            )
        })
    }

    const handleEditEmployee = (employee: Employee) => {
        openDrawer({
            title: "Edit Employee",
            width: 672,
            content: (
                <EmployeeDialog
                    onClose={closeDrawer}
                    employee={employee}
                    onSave={handleSaveEmployee}
                    allEmployees={employees}
                />
            )
        })
    }

    const handleDeleteEmployee = (id: string) => {
        // TODO: Implement delete functionality
        console.log("Delete employee", id)
    }

    const handleBulkDelete = () => {
        // TODO: Implement bulk delete functionality
        console.log("Bulk delete employees", selectedRows)
    }


    const handleSettingsClick = () => {
        if (isSettingsOpen) {
            notify.info("View settings closed")
            closeDrawer()
            return
        }

        notify.info("View settings opened")
        openDrawer({
            title: "View Settings",
            width: 400,
            content: (
                <ColumnSettingsDialog
                    columns={columns}
                    columnOrder={columnOrder}
                    setColumnOrder={(order) => setColumnSettings('employees', { order })}
                    columnVisibility={columnVisibility}
                    setColumnVisibility={(updaterOrValue) => {
                        const newValue = typeof updaterOrValue === 'function' ? (updaterOrValue as (prev: any) => any)(columnVisibility) : updaterOrValue
                        setColumnSettings('employees', { visibility: newValue })
                    }}
                    onClose={() => {
                        notify.info("View settings closed")
                        closeDrawer()
                    }}
                />
            )
        })
    }

    const columns: ColumnDef<Employee>[] = React.useMemo(() => [
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
            accessorKey: "firstName",
            header: "Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-gray-500/10 text-ink-secondary dark:bg-zinc-800 dark:text-gray-400">
                        <User className="size-4" />
                    </div>
                    <span className="font-medium text-primary">
                        {row.original.firstName} {row.original.lastName}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => (
                <span className="text-ink-secondary dark:text-gray-400">
                    {row.getValue("email")}
                </span>
            ),
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => (
                <span className="text-primary">
                    {row.getValue("role")}
                </span>
            ),
        },
        {
            accessorKey: "department",
            header: "Department",
            cell: ({ row }) => (
                <span className="text-ink-secondary dark:text-gray-400">
                    {row.getValue("department")}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <StatusSwitch
                    checked={row.getValue("status") === "active"}
                    onCheckedChange={async (checked) => {
                        updateEmployee({
                            ...row.original,
                            status: checked ? "active" : "inactive"
                        })
                        notify.success(`You successfully ${checked ? 'activated' : 'deactivated'} the employee ———— ${row.original.firstName} ${row.original.lastName}`, "Update Status Success")
                    }}
                    className="scale-75"
                />
            ),
        },
    ], [updateEmployee])

    // Initialize column order on load
    React.useEffect(() => {
        if (columnOrder.length === 0) {
            setColumnSettings('employees', {
                order: columns.map(c => (c.id || (c as any).accessorKey) as string)
            })
        }
    }, [columns, columnOrder.length, setColumnSettings])


    if (!isLoaded) {
        return <div className="flex h-full items-center justify-center">Loading...</div>
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-6 overflow-hidden">
            {/* Page Heading & Controls */}
            <div className="flex flex-shrink-0 flex-col gap-6 pt-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                    <H1 className="text-primary">
                        Employees
                    </H1>
                    <p className="text-sm text-ink-secondary dark:text-gray-400 md:text-base">
                        Manage your team structure and details.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Button onClick={handleAddEmployee}>
                        <Plus className="mr-2 size-5" />
                        Add Employee
                    </Button>
                </div>
            </div>

            {/* View Content - Scrollable Area */}
            <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-panel -sm dark:border-zinc-800 /50">
                {viewMode === "table" && (
                    <div className="flex h-full flex-col gap-4 p-6">
                        <TableToolbar
                            search={{
                                value: searchQuery,
                                onChange: search.onChange,
                                placeholder: "Search employees...",
                                isDebouncing
                            }}
                            onSettingsClick={handleSettingsClick}
                            isSettingsOpen={isSettingsOpen}
                        >
                            {selectedRows.length > 0 && (
                                <Button
                                    onClick={handleBulkDelete}
                                    variant="destructive"
                                    size="sm"
                                    className="rounded-full"
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete {selectedRows.length}
                                </Button>
                            )}
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => {
                                        const newMode = !isSelectionMode
                                        setSelectionMode(newMode)
                                    }}
                                    variant={isSelectionMode ? "default" : "ghost"}
                                    size="icon"
                                    className="rounded-full"
                                    title={isSelectionMode ? "Exit Selection Mode" : "Multi-Select"}
                                >
                                    <GripVertical className="size-4" />
                                </Button>
                            </div>
                        </TableToolbar>

                        <DataTable
                            columns={columns}
                            data={filteredEmployees}
                            enableSorting={true}
                            enableRowSelection={true}
                            onRowSelectionChange={setSelectedRows}
                            hideToolbar={true}
                            isSelectionMode={isSelectionMode}
                            onSelectionModeChange={(mode) => setSelectionMode(mode)}
                            columnVisibility={columnVisibility}
                            onColumnVisibilityChange={(updaterOrValue) => {
                                const newValue = typeof updaterOrValue === 'function' ? updaterOrValue(columnVisibility) : updaterOrValue
                                setColumnSettings('employees', { visibility: newValue })
                            }}
                            columnOrder={columnOrder}
                            onColumnOrderChange={(updaterOrValue) => {
                                const newValue = typeof updaterOrValue === 'function' ? updaterOrValue(columnOrder) : updaterOrValue
                                setColumnSettings('employees', { order: newValue })
                            }}
                            renderRowActions={(row) => (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full text-ink-secondary hover:text-gray-900 hover:bg-gray-500/10 dark:text-gray-400 dark:hover:text-white dark:hover:bg-zinc-800"
                                        onClick={() => handleEditEmployee(row.original)}
                                    >
                                        <Edit2 className="size-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full text-ink-secondary hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                                        onClick={() => handleDeleteEmployee(row.original.id)}
                                    >
                                        <Trash2 className="size-5" />
                                    </Button>
                                </>
                            )}
                        />
                    </div>
                )}

                {viewMode === "card" && (
                    <div className="h-full overflow-y-auto p-6">
                        <div className="space-y-6">
                            {/* Toolbar (Only for Grid) */}
                            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                                <div className="relative w-full group lg:w-96">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 transition-colors group-focus-within:text-primary">
                                        <Search className="size-5" />
                                    </div>
                                    <Input
                                        placeholder="Search by Name or Email..."
                                        className="pl-11 rounded-full"
                                        value={searchQuery}
                                        onChange={(e) => search.onChange(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    {(["all", "active", "inactive"] as const).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={cn(
                                                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                                                filter === f
                                                    ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-200 font-bold"
                                                    : "bg-panel text-ink-secondary hover:bg-gray-50 hover:text-gray-900  dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white border border dark:border-zinc-800"
                                            )}
                                        >
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredEmployees.map((employee) => (
                                    <Card
                                        key={employee.id}
                                        onClick={() => handleEditEmployee(employee)}
                                        className="group relative flex cursor-pointer flex-col gap-4 overflow-hidden p-6 transition-all hover:-soft"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-gray-500/10 text-ink-secondary dark:bg-zinc-800 dark:text-gray-400">
                                                <User className="size-6" />
                                            </div>
                                            <button className="-mr-2 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-zinc-800 dark:hover:text-gray-300">
                                                <MoreHorizontal className="size-5" />
                                            </button>
                                        </div>

                                        <div>
                                            {columnOrder.map(colId => {
                                                if (columnVisibility[colId] === false) return null

                                                switch (colId) {
                                                    case 'firstName':
                                                        return (
                                                            <H3 key={colId} className="mb-1 text-lg font-bold text-gray-900 transition-colors group-hover:text-primary dark:text-white">
                                                                {employee.firstName} {employee.lastName}
                                                            </H3>
                                                        )
                                                    case 'role':
                                                        return (
                                                            <p key={colId} className="text-sm text-ink-secondary dark:text-gray-400 mb-2">
                                                                {employee.role}
                                                            </p>
                                                        )
                                                    case 'email':
                                                        return (
                                                            <div key={colId} className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                                                <Mail className="size-3" />
                                                                {employee.email}
                                                            </div>
                                                        )
                                                    case 'status':
                                                        return (
                                                            <div key={colId} className="flex items-center gap-2 mt-2">
                                                                <Badge
                                                                    variant={employee.status === "active" ? "success" : "neutral"}
                                                                    className="px-2.5 py-1"
                                                                >
                                                                    {employee.status === "active" ? "Active" : "Inactive"}
                                                                </Badge>
                                                            </div>
                                                        )
                                                    case 'department':
                                                        return (
                                                            <div key={colId} className="flex items-center gap-2 mt-2">
                                                                <span className="text-xs font-medium text-gray-400 border border rounded-md px-2 py-1 dark:border-zinc-800">
                                                                    {employee.department}
                                                                </span>
                                                            </div>
                                                        )
                                                    default:
                                                        return null
                                                }
                                            })}
                                        </div>
                                    </Card>
                                ))}

                                {/* Add Employee Placeholder */}
                                <div
                                    onClick={handleAddEmployee}
                                    className="group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-2 rounded-card border border-dashed border-gray-300 bg-gray-50 p-6 transition-all hover:bg-gray-500/10 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
                                >
                                    <div className="flex size-12 items-center justify-center rounded-full bg-panel -sm transition-colors group-hover:text-primary  text-gray-400">
                                        <Plus className="size-6" />
                                    </div>
                                    <p className="text-sm font-bold text-ink-secondary transition-colors group-hover:text-primary dark:text-gray-400">
                                        Add Employee
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === "chart" && (
                    <div className="h-full overflow-hidden">
                        <EmployeesOrgChart
                            employees={employees}
                            onEmployeeClick={handleEditEmployee}
                            onEmployeeUpdate={updateEmployeeManager}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
