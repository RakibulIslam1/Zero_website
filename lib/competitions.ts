export type CompetitionStatus = 'upcoming' | 'ongoing' | 'completed'

export interface Competition {
  id: number
  name: string
  date: string
  description: string
  status: CompetitionStatus
  prize: string
}

export const competitions: Competition[] = [
  {
    id: 1,
    name: 'ZERO Hackathon 2025',
    date: 'March 15–17, 2025',
    description:
      'A 48-hour coding marathon where teams build innovative solutions to real-world problems using the latest technologies.',
    status: 'upcoming',
    prize: 'Prize: $10,000',
  },
  {
    id: 2,
    name: 'AI Innovation Challenge',
    date: 'April 5, 2025',
    description:
      'Design and build AI-powered applications that make everyday life easier and more efficient.',
    status: 'upcoming',
    prize: 'Prize: $5,000',
  },
  {
    id: 3,
    name: 'Web Design Championship',
    date: 'February 20–22, 2025',
    description:
      'Showcase your design skills in this intensive web design competition judged by industry experts.',
    status: 'ongoing',
    prize: 'Prize: $3,000',
  },
  {
    id: 4,
    name: 'Open Source Sprint',
    date: 'May 1–7, 2025',
    description:
      'Contribute to open source projects and earn recognition from the global developer community.',
    status: 'upcoming',
    prize: 'Prize: $2,000',
  },
  {
    id: 5,
    name: 'ZERO Code Cup 2024',
    date: 'November 10–12, 2024',
    description:
      'Our annual flagship coding competition featuring challenges across algorithms, data structures, and system design.',
    status: 'completed',
    prize: 'Prize: $8,000',
  },
  {
    id: 6,
    name: 'Mobile App Showdown 2024',
    date: 'October 5, 2024',
    description:
      'Participants built cross-platform mobile apps in 24 hours, judged on creativity, UX, and technical complexity.',
    status: 'completed',
    prize: 'Prize: $4,000',
  },
]
