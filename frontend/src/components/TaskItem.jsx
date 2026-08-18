import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { CheckCircle2, Circle, Clock, MoreVertical, Pencil, Trash2 } from 'lucide-react'

const priorityColors = {
  low: 'var(--color-low)',
  medium: 'var(--color-medium)',
  high: 'var(--color-high)',
}

export function TaskItem({ task, onUpdate, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isDone = task.status === 'done'

  // Close menu on click outside
  useEffect(() => {
    const handler = () => setMenuOpen(false)
    if (menuOpen) window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [menuOpen])

  const toggleStatus = (e) => {
    e.stopPropagation()
    onUpdate({ ...task, status: isDone ? 'todo' : 'done' })
  }

  return (
    <div 
      className={`group relative flex items-start gap-4 p-4 rounded-[--radius-card] bg-[var(--color-surface-card)] border transition-all duration-200 animate-slide-in ${
        isDone ? 'opacity-75' : ''
      }`}
      style={{ 
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      <button 
        onClick={toggleStatus}
        className="mt-0.5 flex-shrink-0 cursor-pointer transition-colors duration-150"
        style={{ color: isDone ? 'var(--color-done)' : 'var(--color-border)' }}
        onMouseOver={(e) => { if (!isDone) e.currentTarget.style.color = 'var(--color-brand-400)' }}
        onMouseOut={(e) => { if (!isDone) e.currentTarget.style.color = 'var(--color-border)' }}
      >
        {isDone ? <CheckCircle2 size={22} strokeWidth={2.5} /> : <Circle size={22} strokeWidth={2.5} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 
            className="text-base font-medium truncate"
            style={{ 
              color: 'var(--color-text-primary)',
              textDecoration: isDone ? 'line-through' : 'none'
            }}
          >
            {task.title}
          </h3>
          <span 
            className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full"
            style={{ 
              color: priorityColors[task.priority],
              backgroundColor: `color-mix(in srgb, ${priorityColors[task.priority]} 15%, transparent)`
            }}
          >
            {task.priority}
          </span>
        </div>
        
        {task.description && (
          <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--color-text-muted)' }}>
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {task.due_date && (
            <div className="flex items-center gap-1.5" style={{ color: new Date(task.due_date) < new Date() && !isDone ? 'var(--color-high)' : 'inherit' }}>
              <Clock size={14} />
              <span>Due {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 capitalize">
            <span 
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: `var(--color-${task.status})` }}
            />
            {task.status.replace('-', ' ')}
          </div>
        </div>
      </div>

      {/* Action Menu */}
      <div className="relative flex-shrink-0 ml-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
          className="p-1.5 rounded-full cursor-pointer transition-colors duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface)' }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <MoreVertical size={18} />
        </button>

        {menuOpen && (
          <div 
            className="absolute right-0 top-full mt-1 w-36 py-1 rounded-[--radius-btn] bg-[var(--color-surface-card)] z-10 animate-fade-in"
            style={{ 
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-elevated)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onUpdate({ ...task, isEditing: true })}
              className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 cursor-pointer transition-colors"
              style={{ color: 'var(--color-text-primary)' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 cursor-pointer transition-colors"
              style={{ color: 'var(--color-high)' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'hsl(0 72% 97%)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
