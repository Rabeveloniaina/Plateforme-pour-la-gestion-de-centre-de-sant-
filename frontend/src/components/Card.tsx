import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export default function Card({ children, className = '', hover = true, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100/50 
        backdrop-blur-sm transition-all duration-300 ease-out
        ${hover ? 'hover:shadow-xl hover:shadow-blue-500/10' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: string
    type: 'increase' | 'decrease' | 'neutral'
  }
  icon: ReactNode
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo'
  className?: string
}

export function StatCard({ title, value, change, icon, color, className = '' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  }

  const changeColors = {
    increase: 'text-green-600 bg-green-50',
    decrease: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50'
  }

  return (
    <Card className={`p-4 sm:p-6 lg:p-8 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-600 mb-1 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-2">{value}</p>
          {change && (
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${changeColors[change.type]}`}>
              <span className="mr-1">
                {change.type === 'increase' ? '↗' : change.type === 'decrease' ? '↘' : '→'}
              </span>
              <span className="hidden sm:inline">{change.value}</span>
              <span className="sm:hidden">{change.value.split(' ')[0]}</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

interface ActionCardProps {
  title: string
  description: string
  icon: ReactNode
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo'
  href?: string
  onClick?: () => void
  className?: string
}

export function ActionCard({ title, description, icon, color, href, onClick, className = '' }: ActionCardProps) {
  const colorClasses = {
    blue: 'hover:border-blue-300 hover:shadow-blue-500/20',
    green: 'hover:border-green-300 hover:shadow-green-500/20',
    orange: 'hover:border-orange-300 hover:shadow-orange-500/20',
    purple: 'hover:border-purple-300 hover:shadow-purple-500/20',
    red: 'hover:border-red-300 hover:shadow-red-500/20',
    indigo: 'hover:border-indigo-300 hover:shadow-indigo-500/20'
  }

  const iconColors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  }

  const content = (
    <Card className={`p-4 sm:p-6 lg:p-8 group transition-all duration-300 ${colorClasses[color]} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center mb-3 sm:mb-4 lg:mb-6 ${iconColors[color]}`}>
            {icon}
          </div>
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1 sm:mb-2 lg:mb-3 truncate">{title}</h3>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-3 sm:mb-4 lg:mb-6 line-clamp-2">{description}</p>
          <div className="flex items-center text-xs sm:text-sm lg:text-base font-medium text-gray-500 group-hover:text-gray-700">
            <span>Accéder</span>
            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </div>
    </Card>
  )

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    )
  }

  if (onClick) {
    return (
      <div onClick={onClick} className="cursor-pointer">
        {content}
      </div>
    )
  }

  return content
}
