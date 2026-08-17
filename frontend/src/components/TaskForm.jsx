import { useState, useEffect } from 'react'
import { Field, Button } from './ui'
import { X } from 'lucide-react'

export function TaskForm({ task, onSubmit, onClose }) {
  const isEditing = !!task
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState(task?.priority || 'medium')
  const [status, setStatus] = useState(task?.status || 'todo')
  const [dueDate, setDueDate] = useState(task?.due_date || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'unset' }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      await onSubmit({
        title,
        description: description || null,
        priority,
        status,
        due_date: dueDate || null
      })
    } catch (err) {
      setError('Failed to save task. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div 
        className="w-full max-w-lg bg-[--color-surface-card] rounded-[--radius-card] flex flex-col max-h-[90vh] overflow-hidden"
        style={{ boxShadow: 'var(--shadow-elevated)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[--color-border]">
          <h2 className="text-lg font-semibold text-[--color-text-primary]">
            {isEditing ? 'Edit Task' : 'New Task'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-[--color-text-muted] hover:bg-[--color-surface] hover:text-[--color-text-primary] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 text-sm rounded-[--radius-btn] bg-red-50 text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field
              label="Title"
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-sm font-medium text-[--color-text-primary]">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
                className="w-full px-3 py-2 text-sm rounded-[--radius-btn] outline-none transition-all duration-150 resize-none bg-[--color-surface-card] text-[--color-text-primary]"
                style={{ border: '1px solid var(--color-border)' }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-brand-500)'
                  e.target.style.boxShadow = '0 0 0 3px hsl(221 83% 53% / 0.12)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-border)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="priority" className="text-sm font-medium text-[--color-text-primary]">
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-[--radius-btn] outline-none transition-all duration-150 bg-[--color-surface-card] text-[--color-text-primary]"
                  style={{ border: '1px solid var(--color-border)' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-brand-500)'
                    e.target.style.boxShadow = '0 0 0 3px hsl(221 83% 53% / 0.12)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border)'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="status" className="text-sm font-medium text-[--color-text-primary]">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-[--radius-btn] outline-none transition-all duration-150 bg-[--color-surface-card] text-[--color-text-primary]"
                  style={{ border: '1px solid var(--color-border)' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-brand-500)'
                    e.target.style.boxShadow = '0 0 0 3px hsl(221 83% 53% / 0.12)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border)'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <Field
              label="Due Date (optional)"
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </form>
        </div>

        <div className="px-6 py-4 border-t border-[--color-border] bg-[--color-surface] flex justify-end gap-3 mt-auto">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={loading}>
            {isEditing ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </div>
    </div>
  )
}
