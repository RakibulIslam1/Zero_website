import { Github, Linkedin, Twitter } from 'lucide-react'

interface TeamCardProps {
  name: string
  role: string
  image?: string
}

export default function TeamCard({ name, role, image }: TeamCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl font-bold text-gray-400">{name.charAt(0)}</span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{role}</p>
      <div className="flex justify-center space-x-3">
        <a href="#" aria-label="GitHub" className="text-gray-400 hover:text-accent transition-colors">
          <Github size={18} />
        </a>
        <a href="#" aria-label="LinkedIn" className="text-gray-400 hover:text-accent transition-colors">
          <Linkedin size={18} />
        </a>
        <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-accent transition-colors">
          <Twitter size={18} />
        </a>
      </div>
    </div>
  )
}
