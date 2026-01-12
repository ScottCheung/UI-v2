"use client"

import * as React from "react"
import { Handle, Position, NodeProps, Node } from "@xyflow/react"
import { MoreHorizontal } from "lucide-react"
import { Employee } from "../../data/mock-employees"

type EmployeeNodeData = Node<{
    employee: Employee
    onEdit: (e: Employee) => void
}, 'employee'>

// Custom Node Component
export function EmployeeNode({ data }: NodeProps<EmployeeNodeData>) {
    const { employee, onEdit } = data

    return (
        <div className="relative flex w-64 flex-col gap-2 rounded-2xl border border-gray-200 bg-panel p-4 -sm transition-all hover:-md dark:border-zinc-800 ">
            <Handle type="target" position={Position.Top} />

            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/5 text-sm font-bold text-primary dark:bg-primary/20">
                        {employee.firstName[0]}
                        {employee.lastName[0]}
                    </div>
                    <div>
                        <p className="font-bold text-primary">
                            {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-xs text-ink-secondary dark:text-gray-400">
                            {employee.role}
                        </p>
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onEdit(employee)
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <MoreHorizontal className="size-4" />
                </button>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 dark:border-zinc-800">
                <span className="rounded-md bg-gray-500/10 px-2 py-0.5 text-[10px] font-medium text-ink-secondary dark:bg-zinc-800 dark:text-gray-400">
                    {employee.department}
                </span>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-gray-300 dark:!bg-zinc-700" />
        </div>
    )
}
