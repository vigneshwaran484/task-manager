import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, LayoutList, Activity, CheckSquare } from 'lucide-react'
import { tasksApi } from '../api/endpoints'
import { TaskItem } from '../components/TaskItem'
import { TaskForm } from '../components/TaskForm'
import { ProgressDashboard } from '../components/ProgressDashboard'
import { Button } from '../components/ui'

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filter, setFilter] = useState('all') // all, todo, done
  const [view, setView] = useState('tasks') // tasks, progress

  const { data: tasks = [], isLoading, isError } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await tasksApi.list()
      return data
    }
  })

  const createMutation = useMutation({
    mutationFn: (newTask) => tasksApi.create(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      queryClient.invalidateQueries(['stats'])
      closeForm()
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      queryClient.invalidateQueries(['stats'])
      closeForm()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => tasksApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      queryClient.invalidateQueries(['stats'])
    }
  })

  const openNewForm = () => {
    setEditingTask(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingTask(null)
  }

  const handleFormSubmit = async (taskData) => {
    if (editingTask) {
      await updateMutation.mutateAsync({ id: editingTask.id, ...taskData })
    } else {
      await createMutation.mutateAsync(taskData)
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'todo') return task.status !== 'done'
    if (filter === 'done') return task.status === 'done'
    return true
  })

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {view === 'tasks' ? 'My Tasks' : 'My Progress'}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {view === 'tasks' ? 'Manage your daily tasks securely' : 'Track your streaks and achievements'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-lg flex text-sm">
            <button 
              onClick={() => setView('tasks')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${view === 'tasks' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <CheckSquare size={16} /> Tasks
            </button>
            <button 
              onClick={() => setView('progress')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${view === 'progress' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Activity size={16} /> Progress
            </button>
          </div>
          {view === 'tasks' && (
            <Button onClick={openNewForm} className="sm:w-auto">
              <Plus size={18} /> New Task
            </Button>
          )}
        </div>
      </div>

      {view === 'progress' ? (
        <ProgressDashboard />
      ) : (
        <>
          {/* Filters */}
          <div className="flex gap-2 mb-6 border-b border-[var(--color-border)] pb-4">
        {['all', 'todo', 'done'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium rounded-full capitalize transition-all cursor-pointer`}
            style={{
              backgroundColor: filter === f ? 'var(--color-brand-100)' : 'transparent',
              color: filter === f ? 'var(--color-brand-700)' : 'var(--color-text-muted)',
            }}
            onMouseOver={(e) => {
              if (filter !== f) e.currentTarget.style.color = 'var(--color-text-primary)'
            }}
            onMouseOut={(e) => {
              if (filter !== f) e.currentTarget.style.color = 'var(--color-text-muted)'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="animate-spin block w-8 h-8 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full" />
        </div>
      ) : isError ? (
        <div className="p-4 text-center rounded-[--radius-card] bg-red-50 text-red-600 border border-red-100">
          Failed to load tasks. Please try refreshing the page.
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-[--radius-card] border-[var(--color-border)]">
          <div className="w-12 h-12 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-3">
            <LayoutList size={24} className="text-[var(--color-text-muted)]" />
          </div>
          <h3 className="text-base font-medium text-[var(--color-text-primary)] mb-1">No tasks found</h3>
          <p className="text-sm text-[var(--color-text-muted)] max-w-[250px]">
            {filter === 'all' 
              ? "You don't have any tasks yet. Create one to get started."
              : `You don't have any ${filter} tasks right now.`}
          </p>
          {filter === 'all' && (
            <Button variant="secondary" onClick={openNewForm} className="mt-4">
              Create your first task
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onUpdate={(updatedData) => {
                if (updatedData.isEditing) {
                  setEditingTask(task)
                  setIsFormOpen(true)
                } else {
                  updateMutation.mutate({ id: task.id, ...updatedData })
                }
              }}
              onDelete={deleteMutation.mutate}
            />
          ))}
        </div>
      )}
      </>
      )}

      {/* Modal */}
      {isFormOpen && (
        <TaskForm
          task={editingTask}
          onSubmit={handleFormSubmit}
          onClose={closeForm}
        />
      )}
    </main>
  )
}
