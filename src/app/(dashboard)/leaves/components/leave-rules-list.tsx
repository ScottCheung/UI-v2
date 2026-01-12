
"use client"

import * as React from "react"
import { Edit2, Trash2, Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/UI/Button"
import { Badge } from "@/components/UI/badge"
import {
    useLeaveTypeRules,
    useDeleteLeaveTypeRule,
    LeaveTypeRule,
    useEmploymentTypes
} from "@/api"
import { notify } from "@/lib/notifications"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/UI/table"
import { StatusSwitch } from "@/components/custom/status-switch"
import { useUpdateLeaveTypeRule } from "@/api"
import { H3, P, Small } from "@/components/UI/text/typography"

interface LeaveRulesListProps {
    leaveTypeId: string
    onEditRule: (rule: LeaveTypeRule) => void
    onCreateRule: () => void
}

export function LeaveRulesList({ leaveTypeId, onEditRule, onCreateRule }: LeaveRulesListProps) {
    const { data: rules, isLoading } = useLeaveTypeRules(leaveTypeId)
    const { data: employmentTypes } = useEmploymentTypes()
    const deleteRule = useDeleteLeaveTypeRule()

    // Filter to be sure, although API should handle it
    const filteredRules = React.useMemo(() => {
        return rules?.filter(r => r.LeaveTypeId === leaveTypeId) || []
    }, [rules, leaveTypeId])

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

    const getEmploymentTypeName = (id: string) => {
        return employmentTypes?.find(t => t.EmploymentTypeId === id)?.Name || "Unknown"
    }

    if (isLoading) {
        return <div className="p-4 text-center text-sm text-gray-500">Loading rules...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <H3 className="text-sm font-medium text-ink-primary">Accrual Rules</H3>
                <Button size="sm" onClick={onCreateRule} className="h-8 gap-1 rounded-full px-3">
                    <Plus className="size-3.5" />
                    Add Rule
                </Button>
            </div>

            {filteredRules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center dark:border-zinc-800">
                    <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-gray-50 dark:bg-zinc-900">
                        <AlertCircle className="size-5 text-gray-400" />
                    </div>
                    <P className="text-sm font-medium text-ink-primary">No rules defined</P>
                    <Small className="text-xs text-ink-secondary mt-1">
                        Create a rule to define how this leave accrues for specific employees.
                    </Small>
                </div>
            ) : (
                <div className="rounded-lg border border-gray-200 overflow-hidden dark:border-zinc-800">
                    <Table>
                        <TableHeader className="bg-gray-50/50 dark:bg-zinc-900/50">
                            <TableRow>
                                <TableHead className="w-[40%]">Name / Employment Type</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRules.map((rule) => (
                                <TableRow key={rule.LeaveTypeRuleId}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-primary text-sm">{rule.Name}</span>
                                            <span className="text-xs text-ink-secondary">{getEmploymentTypeName(rule.EmploymentTypeId)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="outline" className="w-fit text-[10px]">
                                                {rule.AccrualMethod}
                                            </Badge>
                                            <span className="text-xs text-ink-secondary">
                                                {rule.AccrualRate} / hr
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusSwitchWrapper rule={rule} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full text-ink-secondary hover:text-primary"
                                                onClick={() => onEditRule(rule)}
                                            >
                                                <Edit2 className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-full text-ink-secondary hover:text-red-600"
                                                onClick={() => handleDelete(rule.LeaveTypeRuleId)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}

function StatusSwitchWrapper({ rule }: { rule: LeaveTypeRule }) {
    const updateRule = useUpdateLeaveTypeRule()
    return (
        <StatusSwitch
            checked={rule.IsActive}
            onCheckedChange={async (checked) => {
                try {
                    await updateRule.mutateAsync({
                        id: rule.LeaveTypeRuleId,
                        data: { ...rule, IsActive: checked }
                    })
                    notify.success(`You successfully ${checked ? 'activated' : 'deactivated'} the rule ———— ${rule.Name}`, "Update Rule Status Success")
                } catch (error) {
                    notify.error("Failed to update rule status. Please try again.", "Update Rule Status Error")
                }
            }}
            className="scale-75 origin-left"
        />
    )
}
