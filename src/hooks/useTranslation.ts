import { useState } from 'react'

export type LanguageType = 'en' | 'hi' | 'ja' | 'fr' | 'es'

const dictionaries: Record<LanguageType, Record<string, string>> = {
  en: {
    gallery: 'Gallery',
    about: 'About',
    contact: 'Contact',
    explore: 'Explore Gallery',
    fineart: 'Fine-Art Photography Portfolio',
    slogan: 'Some moments are too quiet for words.',
    rights: 'All rights reserved.',
    enter3d: 'Enter Immersive 3D Space',
    exit3d: 'Return to Flat Grid View',
    recommended: 'Recommended for You',
    latenight: 'Late Night Moods',
    trending: 'Trending Cinematic Frames',
    inspired: 'Inspired by Your Favorites',
    hireme: 'Commission / Session Inquiry',
    send: 'Submit Inquiry',
    name: 'Name',
    email: 'Email',
    message: 'Message',
  },
  hi: {
    gallery: 'दीर्घा',
    about: 'विवरण',
    contact: 'संपर्क',
    explore: 'गैलरी देखें',
    fineart: 'ललित-कला फोटोग्राफी पोर्टफोलियो',
    slogan: 'कुछ पल शब्दों के लिए बहुत शांत होते हैं।',
    rights: 'सर्वाधिकार सुरक्षित।',
    enter3d: '3D आभासी दीर्घा में प्रवेश करें',
    exit3d: 'ग्रिड व्यू पर वापस जाएं',
    recommended: 'आपके लिए अनुशंसित',
    latenight: 'देर रात के मूड',
    trending: 'रुझान वाले फ्रेम',
    inspired: 'आपके पसंदीदा से प्रेरित',
    hireme: 'फोटोग्राफी सत्र पूछताछ',
    send: 'पूछताछ भेजें',
    name: 'नाम',
    email: 'ईमेल',
    message: 'संदेश',
  },
  ja: {
    gallery: 'ギャラリー',
    about: '情報',
    contact: '連絡先',
    explore: '作品集を見る',
    fineart: 'ファインアート写真ポートフォリオ',
    slogan: '言葉にするには静かすぎる瞬間がある。',
    rights: '全著作権所有。',
    enter3d: '3D仮想ギャラリーに入る',
    exit3d: 'グリッド表示に戻る',
    recommended: 'あなたへのおすすめ',
    latenight: 'ミッドナイトムード',
    trending: 'トレンド作品',
    inspired: 'お気に入りからのインスピレーション',
    hireme: '撮影セッションのご相談',
    send: '問い合わせを送信',
    name: 'お名前',
    email: 'メールアドレス',
    message: 'メッセージ',
  },
  fr: {
    gallery: 'Galerie',
    about: 'À propos',
    contact: 'Contact',
    explore: 'Explorer la Galerie',
    fineart: 'Portfolio de Photographie d’Art',
    slogan: 'Certains moments sont trop calmes pour les mots.',
    rights: 'Tous droits réservés.',
    enter3d: 'Entrer dans l’espace 3D',
    exit3d: 'Retour au mode grille',
    recommended: 'Recommandé pour vous',
    latenight: 'Ambiance de Nuit',
    trending: 'Cadres Tendances',
    inspired: 'Inspiré par vos Favoris',
    hireme: 'Demande de Session de Tir',
    send: 'Soumettre la Demande',
    name: 'Nom',
    email: 'E-mail',
    message: 'Message',
  },
  es: {
    gallery: 'Galería',
    about: 'Sobre mí',
    contact: 'Contacto',
    explore: 'Explorar Galería',
    fineart: 'Portafolio de Fotografía Artística',
    slogan: 'Algunos momentos son demasiado silenciosos para las palabras.',
    rights: 'Todos los derechos reservados.',
    enter3d: 'Entrar en el espacio 3D',
    exit3d: 'Volver a la vista de cuadrícula',
    recommended: 'Recomendado para Ti',
    latenight: 'Ambientes Nocturnos',
    trending: 'Fotogramas en Tendencia',
    inspired: 'Inspirado por tus Favoritos',
    hireme: 'Consulta de Sesión Fotográfica',
    send: 'Enviar Consulta',
    name: 'Nombre',
    email: 'Correo electrónico',
    message: 'Mensaje',
  },
}

export function useTranslation() {
  const [lang, setLangState] = useState<LanguageType>(() => {
    if (typeof localStorage !== 'undefined') {
      return (localStorage.getItem('cis_lang') as LanguageType) || 'en'
    }
    return 'en'
  })

  const setLang = (newLang: LanguageType) => {
    setLangState(newLang)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cis_lang', newLang)
    }
  }

  const t = (key: string) => {
    return dictionaries[lang][key] || dictionaries['en'][key] || key
  }

  return { lang, setLang, t }
}
