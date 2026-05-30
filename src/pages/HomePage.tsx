import { Footer } from '../components/layout/Footer'
import { Navbar } from '../components/layout/Navbar'
import { About } from '../components/sections/About'
import { Contact } from '../components/sections/Contact'
import { Gallery } from '../components/sections/Gallery'
import { Hero } from '../components/sections/Hero'
import { SeoHead } from '../components/seo/SeoHead'

interface HomePageProps {
  onToggleTheme: () => void
  isDark: boolean
  onToggleMusic: () => void
  musicPlaying: boolean
}

export function HomePage({
  onToggleTheme,
  isDark,
  onToggleMusic,
  musicPlaying,
}: HomePageProps) {
  return (
    <>
      <SeoHead />
      <Navbar
        onToggleTheme={onToggleTheme}
        isDark={isDark}
        onToggleMusic={onToggleMusic}
        musicPlaying={musicPlaying}
      />
      <Hero />
      <Gallery />
      <About />
      <Contact />
      <Footer />
    </>
  )
}
