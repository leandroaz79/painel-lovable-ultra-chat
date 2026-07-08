import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { PromoBar } from '../components/landing/PromoBar'
import { Navbar } from '../components/landing/Navbar'
import { Hero } from '../components/landing/Hero'
import { Steps } from '../components/landing/Steps'
import { PainPoints } from '../components/landing/PainPoints'
import { Features } from '../components/landing/Features'
import { Pricing } from '../components/landing/Pricing'
import { ResellerCTA } from '../components/landing/ResellerCTA'
import { Testimonials } from '../components/landing/Testimonials'
import { ComparisonTable } from '../components/landing/ComparisonTable'
import { FAQ } from '../components/landing/FAQ'
import { FinalCTA } from '../components/landing/FinalCTA'
import { Footer } from '../components/landing/Footer'
import { WhatsAppFAB } from '../components/landing/WhatsAppFAB'
import { Reveal } from '../components/landing/Reveal'

export default function Landing() {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  if (user && role === 'user') {
    navigate('/user', { replace: true })
    return null
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #050b12 0%, #03070d 100%)', color: 'var(--text)' }}>
      <PromoBar />
      <Navbar />
      <main>
        <Hero />
        <Reveal variant="fade-up"><Steps /></Reveal>
        <Reveal variant="fade-up"><PainPoints /></Reveal>
        <Reveal variant="zoom"><Features /></Reveal>
        <Reveal variant="fade-up"><Pricing /></Reveal>
        <Reveal variant="fade-up"><ResellerCTA /></Reveal>
        <Reveal variant="slide-left"><Testimonials /></Reveal>
        <Reveal variant="fade-up"><ComparisonTable /></Reveal>
        <Reveal variant="fade-up"><FAQ /></Reveal>
        <Reveal variant="zoom"><FinalCTA /></Reveal>
      </main>
      <Footer />
      <WhatsAppFAB />
    </div>
  )
}
