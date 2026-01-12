"use client"

import * as React from "react"
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Connection,
    Edge,
    Node,
    ReactFlowProvider,
    Panel,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Employee } from "../data/mock-employees"
import { EmployeeNode } from "./org-chart/employee-node"
import dagre from "@dagrejs/dagre"

const nodeTypes = {
    employee: EmployeeNode,
}

interface OrgChartFlowProps {
    employees: Employee[]
    onEmployeeClick: (employee: Employee) => void
    onEmployeeUpdate: (employeeId: string, newManagerId: string | null) => void
}

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))

    const nodeWidth = 280
    const nodeHeight = 140

    dagreGraph.setGraph({ rankdir: "TB" })

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
    })

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target)
    })

    dagre.layout(dagreGraph)

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id)
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        }
    })

    return { nodes: layoutedNodes, edges }
}

function OrgChartFlow({ employees, onEmployeeClick, onEmployeeUpdate }: OrgChartFlowProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

    // Transform employees to nodes and edges
    React.useEffect(() => {
        const initialNodes: Node[] = employees.map((emp) => ({
            id: emp.id,
            type: "employee",
            data: { employee: emp, onEdit: onEmployeeClick },
            position: { x: 0, y: 0 }, // Initial position, will be calculated by dagre
        }))

        const initialEdges: Edge[] = employees
            .filter((emp) => emp.managerId)
            .map((emp) => ({
                id: `e-${emp.managerId}-${emp.id}`,
                source: emp.managerId!,
                target: emp.id,
                type: "smoothstep",
                animated: true,
                style: { stroke: "#94a3b8" },
            }))

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialNodes,
            initialEdges
        )

        setNodes(layoutedNodes)
        setEdges(layoutedEdges)
    }, [employees, onEmployeeClick, setNodes, setEdges])

    const onConnect = React.useCallback(
        (params: Connection) => {
            // Prevent self-connection
            if (params.source === params.target) return

            // Prevent cycles (simple check)
            // In a real app, you'd do a full cycle detection here

            // Update the data model
            onEmployeeUpdate(params.target, params.source)
        },
        [onEmployeeUpdate]
    )

    // Handle drag and drop reparenting via edge connection
    // Note: React Flow handles drag-to-connect. To support "drag node to reparent", 
    // we'd need more complex logic. For now, we'll rely on connecting handles.
    // However, to make it feel like "drag and drop", users can drag a connection line.

    return (
        <div className="h-full w-full bg-gray-50 dark:bg-zinc-950">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
                minZoom={0.1}
            >
                <Controls />
                <Background color="#94a3b8" gap={16} size={1} />
                <Panel position="top-right" className="bg-panel/80 p-2 rounded-lg -sm backdrop-blur-sm text-xs text-ink-secondary">
                    Drag handles to connect/reparent
                </Panel>
            </ReactFlow>
        </div>
    )
}

export function EmployeesOrgChart(props: OrgChartFlowProps) {
    return (
        <ReactFlowProvider>
            <OrgChartFlow {...props} />
        </ReactFlowProvider>
    )
}
