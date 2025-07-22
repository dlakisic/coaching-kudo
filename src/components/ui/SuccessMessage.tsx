interface SuccessMessageProps {
  message: string
  className?: string
}

export default function SuccessMessage({ message, className = '' }: SuccessMessageProps) {
  if (!message) return null

  return (
    <div className={`rounded-md bg-green-50 dark:bg-green-900/20 p-4 text-sm text-green-600 dark:text-green-400 ${className}`}>
      {message}
    </div>
  )
}