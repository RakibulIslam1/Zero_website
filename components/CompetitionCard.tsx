import Link from 'next/link'
import { Calendar } from 'lucide-react'

interface CompetitionCardProps {
  name: string
  date: string
  description: string
  status: 'upcoming' | 'ongoing' | 'completed'
  prize?: string
}

const statusConfig = {
  upcoming: { label: 'Upcoming', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  ongoing: { label: 'Ongoing', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
}

export default function CompetitionCard({ name, date, description, status, prize }: CompetitionCardProps) {
  const statusInfo = statusConfig[status]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
        {prize && (
          <span className="text-sm font-semibold text-accent">{prize}</span>
        )}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{name}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{description}</p>
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Calendar size={14} className="mr-2" />
        {date}
      </div>
      <Link
        href="#"
        className={`block text-center py-2.5 px-4 rounded-lg font-medium text-sm transition-colors duration-200 ${
          status === 'completed'
            ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-default'
            : 'bg-accent text-white hover:bg-blue-600'
        }`}
      >
        {status === 'upcoming' ? 'Register Now' : status === 'ongoing' ? 'Participate' : 'View Results'}
      </Link>
    </div>
  )
}
