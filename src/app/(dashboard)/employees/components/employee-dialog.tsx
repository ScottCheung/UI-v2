"use client"

import * as React from "react"
import { Button } from "@/components/UI/Button"
import { InputField } from "@/components/UI/input"
import { IconButton } from "@/components/UI/button/icon-button"
import { Select } from "@/components/UI/select/select"
import { Employee, DEPARTMENTS } from "../data/mock-employees"
import { H2, Muted } from "@/components/UI/text/typography"
import { User, Mail, Briefcase, Building2, Users, X } from "lucide-react"

interface EmployeeDialogProps {
    isOpen: boolean
    onClose: () => void
    employee: Employee | null
    onSave: (employee: Employee) => void
    allEmployees: Employee[]
}

export function EmployeeDialog({
    onClose,
    employee,
    onSave,
    allEmployees,
}: Omit<EmployeeDialogProps, "isOpen">) {
    const [formData, setFormData] = React.useState<Partial<Employee>>({})

    React.useEffect(() => {
        if (employee) {
            setFormData(employee)
        } else {
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                role: "",
                department: DEPARTMENTS[0],
                status: "active",
                managerId: null,
            })
        }
    }, [employee])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.firstName || !formData.lastName || !formData.email) return

        onSave({
            ...formData,
            id: formData.id || `EMP-${Date.now()}`,
            joinDate: formData.joinDate || new Date().toISOString(),
            location: formData.location || "Remote",
        } as Employee)
        onClose()
    }

    return (
        <div className="flex flex-col h-full bg-panel">
            <div className="flex items-center justify-between p-6 pb-0">
                <div>
                    <H2 className="text-primary">
                        {employee ? "Edit Employee" : "Add Employee"}
                    </H2>
                    <Muted className="text-ink-secondary">
                        {employee
                            ? "Update employee details and information."
                            : "Add a new employee to your organization."}
                    </Muted>
                </div>

                <IconButton icon={X} onClick={onClose} />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 form-body overflow-y-auto custom-scrollbar">
                    <div className="grid gap-6 md:grid-cols-2">
                        <InputField
                            label="First Name"
                            icon={User}
                            value={formData.firstName || ""}
                            onChange={(e) =>
                                setFormData({ ...formData, firstName: e.target.value })
                            }
                            placeholder="John"
                            required
                        />

                        <InputField
                            label="Last Name"
                            icon={User}
                            value={formData.lastName || ""}
                            onChange={(e) =>
                                setFormData({ ...formData, lastName: e.target.value })
                            }
                            placeholder="Doe"
                            required
                        />
                    </div>

                    <InputField
                        label="Email Address"
                        type="email"
                        icon={Mail}
                        value={formData.email || ""}
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="john.doe@company.com"
                        required
                    />

                    <div className="grid gap-6 md:grid-cols-2">
                        <InputField
                            label="Role / Title"
                            icon={Briefcase}
                            value={formData.role || ""}
                            onChange={(e) =>
                                setFormData({ ...formData, role: e.target.value })
                            }
                            placeholder="Software Engineer"
                            required
                        />

                        <Select
                            label="Department"
                            icon={Building2}
                            value={formData.department || ""}
                            onChange={(e) =>
                                setFormData({ ...formData, department: e.target.value })
                            }
                        >
                            {DEPARTMENTS.map((dept) => (
                                <option key={dept} value={dept}>
                                    {dept}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <Select
                        label="Reports To (Manager)"
                        icon={Users}
                        value={formData.managerId || ""}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                managerId: e.target.value === "none" ? null : e.target.value,
                            })
                        }
                    >
                        <option value="none">No Manager (Root)</option>
                        {allEmployees
                            .filter((e) => e.id !== formData.id) // Can't report to self
                            .map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.firstName} {e.lastName} ({e.role})
                                </option>
                            ))}
                    </Select>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-ink-primary">
                            Status
                        </label>
                        <div className="flex gap-4">
                            {["active", "inactive", "on_leave"].map((status) => (
                                <label
                                    key={status}
                                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        value={status}
                                        checked={formData.status === status}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                status: e.target.value as Employee["status"],
                                            })
                                        }
                                        className="text-primary focus:ring-primary"
                                    />
                                    <span className="capitalize">
                                        {status.replace("_", " ")}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className=" ">
                    <Button type="button" variant="outline" onClick={onClose} className="rounded-full">
                        Cancel
                    </Button>
                    <Button type="submit" className="rounded-full">
                        {employee ? "Save Changes" : "Add Employee"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
