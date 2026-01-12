import { useState, useEffect } from "react"
import { Employee, MOCK_EMPLOYEES } from "../data/mock-employees"

const STORAGE_KEY = "leave-platform-employees-data"

export function useEmployees() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from local storage on mount
    useEffect(() => {
        const storedData = localStorage.getItem(STORAGE_KEY)
        if (storedData) {
            try {
                const parsed = JSON.parse(storedData)
                setEmployees(parsed)
            } catch (e) {
                console.error("Failed to parse stored employees data", e)
                setEmployees(MOCK_EMPLOYEES)
            }
        } else {
            setEmployees(MOCK_EMPLOYEES)
        }
        setIsLoaded(true)
    }, [])

    // Save to local storage whenever employees change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(employees))
        }
    }, [employees, isLoaded])

    const addEmployee = (employee: Employee) => {
        setEmployees((prev) => [...prev, employee])
    }

    const updateEmployee = (updatedEmployee: Employee) => {
        setEmployees((prev) =>
            prev.map((e) => (e.id === updatedEmployee.id ? updatedEmployee : e))
        )
    }

    const updateEmployeeManager = (employeeId: string, newManagerId: string | null) => {
        setEmployees((prev) =>
            prev.map((e) =>
                e.id === employeeId ? { ...e, managerId: newManagerId } : e
            )
        )
    }

    return {
        employees,
        isLoaded,
        addEmployee,
        updateEmployee,
        updateEmployeeManager,
    }
}
