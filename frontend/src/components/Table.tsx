import { type ReactNode } from 'react'
import { motion } from 'framer-motion'

interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {children}
        </table>
      </div>
    </div>
  )
}

interface TableHeaderProps {
  children: ReactNode
  className?: string
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
  return (
    <thead className="bg-gray-50/50 border-b border-gray-200">
      <tr className={className}>
        {children}
      </tr>
    </thead>
  )
}

interface TableBodyProps {
  children: ReactNode
  className?: string
}

export function TableBody({ children }: TableBodyProps) {
  return (
    <tbody className="divide-y divide-gray-100">
      {children}
    </tbody>
  )
}

interface TableRowProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function TableRow({ children, className = '', hover = true, onClick }: TableRowProps) {
  return (
    <motion.tr
      whileHover={hover ? { backgroundColor: '#f8fafc' } : {}}
      className={`
        transition-colors duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </motion.tr>
  )
}

interface TableCellProps {
  children: ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
}

export function TableCell({ children, className = '', align = 'left' }: TableCellProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  return (
    <td className={`px-6 py-4 text-sm ${alignClasses[align]} ${className}`}>
      {children}
    </td>
  )
}

interface TableHeadProps {
  children: ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  onSort?: () => void
}

export function TableHead({ children, className = '', align = 'left', sortable = false, onSort }: TableHeadProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  return (
    <th className={`
      px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
      ${alignClasses[align]}
      ${sortable ? 'cursor-pointer hover:text-gray-700' : ''}
      ${className}
    `} onClick={sortable ? onSort : undefined}>
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortable && (
          <div className="flex flex-col">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        )}
      </div>
    </th>
  )
}

interface StatusBadgeProps {
  status: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  className?: string
}

export function StatusBadge({ status, variant = 'neutral', className = '' }: StatusBadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
      ${variants[variant]}
      ${className}
    `}>
      {status}
    </span>
  )
}

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  }

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={`
      ${sizes[size]}
      bg-gradient-to-br from-blue-500 to-purple-600
      rounded-full flex items-center justify-center text-white font-semibold
      ${className}
    `}>
      {initials}
    </div>
  )
}
