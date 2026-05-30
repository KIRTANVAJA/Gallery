export type GalleryCategory =
  | 'All'
  | 'Portraits'
  | 'Street'
  | 'Nature'
  | 'Monochrome'
  | 'Cinematic'
  | 'Travel'

export interface GalleryImage {
  id: string
  src: string
  alt: string
  category: Exclude<GalleryCategory, 'All'>
  title: string
  location: string
  camera: string
  date: string
  aspect: 'tall' | 'wide' | 'square'
}

export const CATEGORIES: GalleryCategory[] = [
  'All',
  'Portraits',
  'Street',
  'Nature',
  'Monochrome',
  'Cinematic',
  'Travel',
]

export const galleryImages: GalleryImage[] = [
  {
    id: '1',
    src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80',
    alt: 'Portrait in soft light',
    category: 'Portraits',
    title: 'Quiet Gaze',
    location: 'Paris, France',
    camera: 'Sony A7IV · 85mm f/1.4',
    date: 'March 2025',
    aspect: 'tall',
  },
  {
    id: '2',
    src: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=900&q=80',
    alt: 'Urban street at dusk',
    category: 'Street',
    title: 'Neon Reverie',
    location: 'Tokyo, Japan',
    camera: 'Leica Q3 · 28mm',
    date: 'January 2025',
    aspect: 'wide',
  },
  {
    id: '3',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    alt: 'Mountain peaks in fog',
    category: 'Nature',
    title: 'Above the Clouds',
    location: 'Swiss Alps',
    camera: 'Canon R5 · 24-70mm',
    date: 'August 2024',
    aspect: 'wide',
  },
  {
    id: '4',
    src: 'https://images.unsplash.com/photo-1493863641941-386966791a2a?w=800&q=80',
    alt: 'Monochrome architectural lines',
    category: 'Monochrome',
    title: 'Silent Geometry',
    location: 'Berlin, Germany',
    camera: 'Fujifilm X-T5 · 35mm',
    date: 'November 2024',
    aspect: 'square',
  },
  {
    id: '5',
    src: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80',
    alt: 'Cinematic film still mood',
    category: 'Cinematic',
    title: 'Last Frame',
    location: 'Los Angeles, USA',
    camera: 'ARRI Alexa Mini · Anamorphic',
    date: 'February 2025',
    aspect: 'wide',
  },
  {
    id: '6',
    src: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
    alt: 'Desert road at golden hour',
    category: 'Travel',
    title: 'Horizon Line',
    location: 'Morocco',
    camera: 'Sony A7IV · 24mm',
    date: 'October 2024',
    aspect: 'tall',
  },
  {
    id: '7',
    src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80',
    alt: 'Emotional portrait close-up',
    category: 'Portraits',
    title: 'Unspoken',
    location: 'London, UK',
    camera: 'Nikon Z8 · 50mm f/1.2',
    date: 'April 2025',
    aspect: 'tall',
  },
  {
    id: '8',
    src: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80',
    alt: 'Rainy city street reflection',
    category: 'Street',
    title: 'After Rain',
    location: 'Seoul, South Korea',
    camera: 'Leica M11 · 50mm',
    date: 'December 2024',
    aspect: 'square',
  },
  {
    id: '9',
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    alt: 'Forest light rays',
    category: 'Nature',
    title: 'Cathedral of Light',
    location: 'Pacific Northwest, USA',
    camera: 'Canon R5 · 70-200mm',
    date: 'June 2024',
    aspect: 'tall',
  },
  {
    id: '10',
    src: 'https://images.unsplash.com/photo-1504198458649-3128b932f49b?w=800&q=80',
    alt: 'Black and white hands',
    category: 'Monochrome',
    title: 'Touch',
    location: 'Studio',
    camera: 'Hasselblad 500CM',
    date: 'May 2025',
    aspect: 'square',
  },
  {
    id: '11',
    src: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=900&q=80',
    alt: 'Cinematic theater seats',
    category: 'Cinematic',
    title: 'Empty Seats',
    location: 'New York, USA',
    camera: 'RED Komodo · 35mm',
    date: 'September 2024',
    aspect: 'wide',
  },
  {
    id: '12',
    src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
    alt: 'Lake reflection at dawn',
    category: 'Travel',
    title: 'Still Waters',
    location: 'Norway',
    camera: 'Sony A7IV · 16-35mm',
    date: 'July 2024',
    aspect: 'wide',
  },
  {
    id: '13',
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
    alt: 'Male portrait dramatic lighting',
    category: 'Portraits',
    title: 'Shadow & Soul',
    location: 'Milan, Italy',
    camera: 'Sony A7IV · 85mm',
    date: 'March 2025',
    aspect: 'square',
  },
  {
    id: '14',
    src: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&q=80',
    alt: 'Ocean waves long exposure',
    category: 'Nature',
    title: 'Eternal Tide',
    location: 'Iceland',
    camera: 'Canon R5 · 16mm',
    date: 'May 2024',
    aspect: 'wide',
  },
  {
    id: '15',
    src: 'https://images.unsplash.com/photo-1516483638260-f4d2b503fd1a?w=800&q=80',
    alt: 'Italian coastal village',
    category: 'Travel',
    title: 'Coastal Silence',
    location: 'Amalfi Coast, Italy',
    camera: 'Fujifilm GFX100 · 45mm',
    date: 'June 2025',
    aspect: 'tall',
  },
  {
    id: '16',
    src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
    alt: 'Starry mountain night',
    category: 'Cinematic',
    title: 'Night Watch',
    location: 'Patagonia',
    camera: 'Sony A7SIII · 14mm',
    date: 'January 2025',
    aspect: 'tall',
  },
]
