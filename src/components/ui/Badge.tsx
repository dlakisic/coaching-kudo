import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  icon?: React.ReactNode
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  icon
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'

  const variantClasses = {
    success: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700',
    neutral: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600',
    gradient: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }

  return (
    <span className={`
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${className}
    `}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  )
}

// Badges prédéfinis pour l'app
export const StatusBadge = ({ status }: { status: 'active' | 'pending' | 'inactive' }) => {
  const config = {
    active: { variant: 'success' as const, text: 'Actif', icon: '✅' },
    pending: { variant: 'warning' as const, text: 'En attente', icon: '⏳' },
    inactive: { variant: 'neutral' as const, text: 'Inactif', icon: '❌' }
  }

  const { variant, text, icon } = config[status]

  return (
    <Badge variant={variant} icon={<span>{icon}</span>}>
      {text}
    </Badge>
  )
}

export const PriorityBadge = ({ priority }: { priority: 'haute' | 'moyenne' | 'basse' }) => {
  const config = {
    haute: { variant: 'danger' as const, text: 'Haute', icon: '🔴' },
    moyenne: { variant: 'warning' as const, text: 'Moyenne', icon: '🟡' },
    basse: { variant: 'success' as const, text: 'Basse', icon: '🟢' }
  }

  const { variant, text, icon } = config[priority]

  return (
    <Badge variant={variant} icon={<span>{icon}</span>}>
      {text}
    </Badge>
  )
}

export const RoleBadge = ({ role }: { role: 'coach' | 'athlete' }) => {
  const config = {
    coach: { variant: 'gradient' as const, text: 'Coach', icon: '👨‍🏫' },
    athlete: { variant: 'info' as const, text: 'Athlète', icon: '🏃‍♂️' }
  }

  const { variant, text, icon } = config[role]

  return (
    <Badge variant={variant} icon={<span>{icon}</span>}>
      {text}
    </Badge>
  )
}