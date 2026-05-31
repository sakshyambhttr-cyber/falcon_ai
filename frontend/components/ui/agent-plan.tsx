'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  Circle,
  CircleAlert,
  CircleDotDashed,
  CircleX
} from 'lucide-react'

type Status = 'completed' | 'in-progress' | 'pending' | 'need-help' | 'failed'

type Subtask = {
  id: string
  title: string
  description: string
  status: Status
  tools?: string[]
}

type Task = {
  id: string
  title: string
  status: Status
  dependencies: string[]
  subtasks: Subtask[]
}

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Research Project Requirements',
    status: 'in-progress',
    dependencies: [],
    subtasks: [
      {
        id: '1.1',
        title: 'Interview stakeholders',
        description: 'Conduct interviews with key stakeholders to understand needs.',
        status: 'completed',
        tools: ['communication-agent', 'meeting-scheduler']
      },
      {
        id: '1.2',
        title: 'Review existing documentation',
        description: 'Read existing docs and extract constraints.',
        status: 'in-progress',
        tools: ['file-system', 'browser']
      },
      {
        id: '1.3',
        title: 'Compile findings report',
        description: 'Summarize findings and unresolved risks.',
        status: 'need-help',
        tools: ['markdown-processor']
      }
    ]
  },
  {
    id: '2',
    title: 'Design System Architecture',
    status: 'in-progress',
    dependencies: [],
    subtasks: [
      {
        id: '2.1',
        title: 'Define component structure',
        description: 'Map component ownership and interactions.',
        status: 'pending',
        tools: ['architecture-planner']
      },
      {
        id: '2.2',
        title: 'Create data flow diagrams',
        description: 'Visualize state flow and event boundaries.',
        status: 'pending',
        tools: ['diagramming-tool']
      },
      {
        id: '2.3',
        title: 'Document API specifications',
        description: 'Define endpoints and payload contracts.',
        status: 'pending',
        tools: ['openapi-generator']
      }
    ]
  },
  {
    id: '3',
    title: 'Implementation Planning',
    status: 'pending',
    dependencies: ['1', '2'],
    subtasks: [
      {
        id: '3.1',
        title: 'Resource allocation',
        description: 'Assign ownership by stream and risk profile.',
        status: 'pending',
        tools: ['project-manager']
      },
      {
        id: '3.2',
        title: 'Timeline development',
        description: 'Build milestones and handoff points.',
        status: 'pending',
        tools: ['timeline-generator']
      }
    ]
  }
]

function statusIcon(status: Status) {
  if (status === 'completed') return <CheckCircle2 size={16} className="ff-plan-icon completed" />
  if (status === 'in-progress') return <CircleDotDashed size={16} className="ff-plan-icon progress" />
  if (status === 'need-help') return <CircleAlert size={16} className="ff-plan-icon warning" />
  if (status === 'failed') return <CircleX size={16} className="ff-plan-icon failed" />
  return <Circle size={16} className="ff-plan-icon pending" />
}

const statusCycle: Status[] = ['completed', 'in-progress', 'pending', 'need-help', 'failed']

export default function Plan() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({ '1': true })
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({})

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task
        const idx = statusCycle.indexOf(task.status)
        const next = statusCycle[(idx + 1) % statusCycle.length]
        return {
          ...task,
          status: next,
          subtasks:
            next === 'completed'
              ? task.subtasks.map(st => ({ ...st, status: 'completed' as Status }))
              : task.subtasks
        }
      })
    )
  }

  const toggleSubtaskExpand = (taskId: string, subtaskId: string) => {
    const key = `${taskId}-${subtaskId}`
    setExpandedSubtasks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleSubtaskStatus = (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task

        const subtasks: Subtask[] = task.subtasks.map(st => {
          if (st.id !== subtaskId) return st
          return {
            ...st,
            status: (st.status === 'completed' ? 'pending' : 'completed') as Status
          }
        })

        const completed = subtasks.every(st => st.status === 'completed')
        return { ...task, subtasks, status: completed ? 'completed' : task.status }
      })
    )
  }

  return (
    <div className="ff-agent-plan">
      <ul className="ff-plan-list">
        {tasks.map(task => {
          const expanded = Boolean(expandedTasks[task.id])
          return (
            <li key={task.id} className="ff-plan-task">
              <div className="ff-plan-task-row">
                <button
                  type="button"
                  className="ff-plan-status-btn"
                  onClick={() => toggleTaskStatus(task.id)}
                  aria-label={`Toggle status for ${task.title}`}
                >
                  {statusIcon(task.status)}
                </button>

                <button
                  type="button"
                  className="ff-plan-task-main"
                  onClick={() => toggleTaskExpand(task.id)}
                >
                  <span className="ff-plan-task-title">{task.title}</span>
                  <span className={`ff-plan-status-badge ${task.status}`}>{task.status}</span>
                </button>
              </div>

              {task.dependencies.length > 0 && (
                <div className="ff-plan-deps">
                  {task.dependencies.map(dep => (
                    <span key={`${task.id}-${dep}`} className="ff-plan-chip">depends: {dep}</span>
                  ))}
                </div>
              )}

              {expanded && task.subtasks.length > 0 && (
                <ul className="ff-plan-subtasks">
                  {task.subtasks.map(subtask => {
                    const key = `${task.id}-${subtask.id}`
                    const subExpanded = Boolean(expandedSubtasks[key])
                    return (
                      <li key={subtask.id} className="ff-plan-subtask">
                        <div className="ff-plan-subtask-row">
                          <button
                            type="button"
                            className="ff-plan-status-btn sm"
                            onClick={() => toggleSubtaskStatus(task.id, subtask.id)}
                            aria-label={`Toggle status for ${subtask.title}`}
                          >
                            {statusIcon(subtask.status)}
                          </button>
                          <button
                            type="button"
                            className="ff-plan-subtask-main"
                            onClick={() => toggleSubtaskExpand(task.id, subtask.id)}
                          >
                            <span className="ff-plan-subtask-title">{subtask.title}</span>
                          </button>
                        </div>

                        {subExpanded && (
                          <div className="ff-plan-subtask-detail">
                            <p>{subtask.description}</p>
                            {subtask.tools && subtask.tools.length > 0 && (
                              <div className="ff-plan-tools">
                                {subtask.tools.map(tool => (
                                  <span key={`${subtask.id}-${tool}`} className="ff-plan-chip">{tool}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
