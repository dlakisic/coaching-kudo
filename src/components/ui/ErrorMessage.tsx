interface ErrorMessageProps {
  message: string
  type?: 'error' | 'warning' | 'info'
  className?: string
}

export default function ErrorMessage({ message, type = 'error', className = '' }: ErrorMessageProps) {
  if (!message) return null

  const baseClasses = 'rounded-md p-4 text-sm'
  
  const typeClasses = {
    error: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
  }

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      {message}
    </div>
  )
}