'use client'

import { motion } from 'framer-motion'
import { BookOpen, FileCheck, Users, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const highlights = [
  'NAT-TEST Preparation',
  'JLPT Preparation',
  'Student Visa Processing',
  'Career Counseling',
]

const sections = [
  {
    icon: BookOpen,
    title: 'Language Teaching',
    description:
      'Our experienced Japanese language instructors deliver structured courses from N5 to N1 levels. We follow a curriculum designed to build reading, writing, listening, and speaking skills that prepare students for both JLPT and NAT-TEST examinations and real-life communication in Japan.',
  },
  {
    icon: FileCheck,
    title: 'Student Visa Processing',
    description:
      'Our dedicated visa processing team provides A to Z support for Japan student visa applications. We assist with document preparation, application submission, embassy liaison, and follow-up — ensuring the highest visa approval rates for our students.',
  },
  {
    icon: Users,
    title: 'Career Counseling',
    description:
      'We provide personalized career counseling to help students choose the right school, program, and career path in Japan. Our counselors have first-hand experience with the Japanese education and job market and offer guidance on part-time work, post-graduation employment, and long-term residency options.',
  },
]

export default function AboutPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="py-24 bg-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl font-bold mb-6"
          >
            About Our School
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-xl text-red-100 max-w-3xl mx-auto"
          >
            Samurai Japanese Language Training Center — shaping the future of Bangladeshi students in Japan since 2020.
          </motion.p>
        </div>
      </section>

      {/* Description */}
      <section className="py-16 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Who We Are</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Samurai Japanese Language Training Center is one of the leading Japanese language learning
                centers and student visa consultancy firms in Bangladesh. Established in 2020, we are
                dedicated to helping Bangladeshi students achieve their dream of studying and working in Japan.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our team consists of experienced Japanese language teachers, professional visa counselors,
                and career advisors who work together to provide a seamless educational journey — from the
                very first Japanese lesson to landing in Japan.
              </p>
              <p className="text-gray-600 leading-relaxed">
                With offices in both Dhaka, Bangladesh, and Tokyo, Japan, we maintain direct relationships
                with Japanese language schools and universities, ensuring the best placements for our students.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-3xl p-10"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">Our Highlights</h3>
              <ul className="space-y-4">
                {highlights.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle size={20} className="text-accent flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 grid grid-cols-2 gap-6 border-t border-gray-200 pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">2020</div>
                  <div className="text-sm text-gray-500 mt-1">Founded</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">500+</div>
                  <div className="text-sm text-gray-500 mt-1">Students Placed</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Services */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              What We <span className="text-accent">Offer</span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-5">
                  <section.icon size={24} className="text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{section.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{section.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            Ready to Start Your Japan Journey?
          </motion.h2>
          <p className="text-gray-600 mb-8">
            Contact us today and let our team help you achieve your dream of studying in Japan.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent-dark transition-colors"
          >
            Contact Us Today
          </Link>
        </div>
      </section>
    </div>
  )
}
