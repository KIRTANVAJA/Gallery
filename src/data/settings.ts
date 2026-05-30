export interface SiteSettings {
  title: string
  subtitle: string
  bioTitle: string
  bioDescription: string
  contactEmail: string
  instagramUrl: string
  veroUrl: string
  ambientTrack: 'rainy_nights' | 'golden_hour' | 'deep_silence'
  passcode: string
}

export const defaultSettings: SiteSettings = {
  title: 'Capture in Silences',
  subtitle: 'Cinematic photography portfolio',
  bioTitle: 'Frames of Silence',
  bioDescription: 'Capture in Silences is an artistic photography project exploring the boundaries of visual storytelling, mood, and atmosphere. Focused on the spaces between words, each frame captures a fragment of emotion carved from light and shadow.',
  contactEmail: 'hello@captureinsilences.com',
  instagramUrl: 'https://instagram.com/captureinsilences',
  veroUrl: 'https://vero.co/captureinsilences',
  ambientTrack: 'rainy_nights',
  passcode: '1984',
}
