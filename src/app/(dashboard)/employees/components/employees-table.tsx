"use client"

import * as React from "react"
import {
    Search,
    ChevronDown,
    ChevronUp,
    Filter,
} from "lucide-react"
import { Input } from "@/components/UI/input"
import { Badge } from "@/components/UI/badge"
import { Employee, DEPARTMENTS } from "../data/mock-employees"
import { H3 } from "@/components/UI/text/typography"

interface EmployeesTableProps {
    employees: Employee[]
    onEmployeeClick: (employee: Employee) => void
}

export function EmployeesTable({ employees, onEmployeeClick }: EmployeesTableProps) {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [departmentFilter, setDepartmentFilter] = React.useState<string>("all")
    const [statusFilter, setStatusFilter] = React.useState<string>("all")
    const [sortConfig, setSortConfig] = React.useState<{
        key: keyof Employee
        direction: "asc" | "desc"
    } | null>(null)

    // Filter and Search Logic
    const filteredData = React.useMemo(() => {
        return employees.filter((employee) => {
            const matchesSearch =
                employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                employee.role.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesDepartment =
                departmentFilter === "all" || employee.department === departmentFilter

            const matchesStatus =
                statusFilter === "all" || employee.status === statusFilter

            return matchesSearch && matchesDepartment && matchesStatus
        })
    }, [employees, searchQuery, departmentFilter, statusFilter])

    // Sorting Logic
    const sortedData = React.useMemo(() => {
        if (!sortConfig) return filteredData

        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key] ?? ""
            const bValue = b[sortConfig.key] ?? ""

            if (aValue < bValue) {
                return sortConfig.direction === "asc" ? -1 : 1
            }
            if (aValue > bValue) {
                return sortConfig.direction === "asc" ? 1 : -1
            }
            return 0
        })
    }, [filteredData, sortConfig])

    const handleSort = (key: keyof Employee) => {
        let direction: "asc" | "desc" = "asc"
        if (
            sortConfig &&
            sortConfig.key === key &&
            sortConfig.direction === "asc"
        ) {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    return (
        <div className="flex h-full flex-col gap-4">
            {/* Filters Toolbar */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        placeholder="Search employees..."
                        className="pl-10 rounded-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        className="h-10 rounded-full border border-gray-200 bg-panel px-4 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 "
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                    >
                        <option value="all">All Departments</option>
                        {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                                {dept}
                            </option>
                        ))}
                    </select>

                    <select
                        className="h-10 rounded-full border border-gray-200 bg-panel px-4 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 "
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-panel -sm dark:border-zinc-800 ">
                <div className="h-full overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-zinc-800/50">
                            <tr>
                                {[
                                    { key: "firstName", label: "Employee" },
                                    { key: "role", label: "Role" },
                                    { key: "department", label: "Department" },
                                    { key: "status", label: "Status" },
                                    { key: "joinDate", label: "Join Date" },
                                    { key: "location", label: "Location" },
                                ].map((column) => (
                                    <th
                                        key={column.key}
                                        className="cursor-pointer  font-semibold text-gray-900 transition-colors hover:bg-gray-500/10 dark:text-white dark:hover:bg-zinc-800"
                                        onClick={() => handleSort(column.key as keyof Employee)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {column.label}
                                            {sortConfig?.key === column.key && (
                                                sortConfig.direction === "asc" ? (
                                                    <ChevronUp className="size-4 text-gray-400" />
                                                ) : (
                                                    <ChevronDown className="size-4 text-gray-400" />
                                                )
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {sortedData.map((employee) => (
                                <tr
                                    key={employee.id}
                                    onClick={() => onEmployeeClick(employee)}
                                    className="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                                >
                                    <td className="">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-full bg-primary/5 text-sm font-bold text-primary dark:bg-primary/20">
                                                {employee.firstName[0]}
                                                {employee.lastName[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-primary">
                                                    {employee.firstName} {employee.lastName}
                                                </div>
                                                <div className="text-xs text-ink-secondary dark:text-gray-400">
                                                    {employee.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className=" text-gray-600 dark:text-gray-300">
                                        {employee.role}
                                    </td>
                                    <td className="">
                                        <span className="inline-flex items-center rounded-md bg-gray-500/10 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-zinc-800 dark:text-gray-400">
                                            {employee.department}
                                        </span>
                                    </td>
                                    <td className="">
                                        <Badge
                                            variant={
                                                employee.status === "active"
                                                    ? "success"
                                                    : employee.status === "on_leave"
                                                        ? "warning"
                                                        : "neutral"
                                            }
                                            className="capitalize"
                                        >
                                            {employee.status.replace("_", " ")}
                                        </Badge>
                                    </td>
                                    <td className=" text-gray-600 dark:text-gray-300">
                                        {new Date(employee.joinDate).toLocaleDateString()}
                                    </td>
                                    <td className=" text-gray-600 dark:text-gray-300">
                                        {employee.location}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {sortedData.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-glass">
                            <Filter className="size-6 text-gray-400" />
                        </div>
                        <H3 className="text-lg font-semibold text-primary">
                            No employees found
                        </H3>
                        <p className="text-sm text-ink-secondary">
                            Try adjusting your search or filters.
                        </p>
                    </div>
                )}
            </div>
            <div className="text-sm text-ink-secondary dark:text-gray-400 text-right">
                Showing {sortedData.length} of {employees.length} employees
            </div>
        </div>
    )
}
