import { Page } from './App'

export function AboutPage() {
  return (
    <Page
      title="About"
      text="A trusted marketplace for affordable tutoring."
      action="Search tutors"
      secondary={{ to: '/contact', label: 'Contact' }}
    />
  )
}

export function TutorsPage() {
  return (
    <Page
      title="Tutors"
      text="Browse tutors by name, lesson, topic, and level."
      action="Join now"
      secondary={{ to: '/how-it-works', label: 'How it works' }}
    />
  )
}

export function HowItWorksPage() {
  return (
    <Page
      title="How it works"
      text="Search, compare, request, and learn in just a few taps."
      action="Start searching"
      secondary={{ to: '/join', label: 'Become a tutor' }}
    />
  )
}

export function ContactPage() {
  return (
    <Page
      title="Contact"
      text="Reach the team for support or onboarding help."
      action="Contact support"
      secondary={{ to: '/about', label: 'About' }}
    />
  )
}

export function SignInPage() {
  return (
    <Page
      title="Sign in"
      text="Return to your account and continue where you left off."
      action="Continue"
      secondary={{ to: '/join', label: 'Join now' }}
    />
  )
}

export function JoinPage() {
  return (
    <Page
      title="Join now"
      text="Create an account as a student or tutor."
      action="Create account"
      secondary={{ to: '/tutors', label: 'Browse tutors' }}
    />
  )
}
