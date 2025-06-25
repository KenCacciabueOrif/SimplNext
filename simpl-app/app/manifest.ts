import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Simpl.',
    short_name: 'S.',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    start_url: '/',
    display: 'standalone',
    theme_color: '#030712',
    background_color: '#030712',
    scope: '/',
    lang: 'en',
    dir: 'auto',
    orientation: 'any',
    description: 'A simple social network',
    screenshots: [
      {
        src: '/SimplHome.png',
        sizes: '384x854',
        type: 'image/png',
        form_factor: 'narrow',
        label: "Home screen showing main navigation and featured content"
      },
      {
        src: '/SimplHomeWide.png',
        sizes: '915x412',
        type: 'image/png',
        form_factor: 'wide',
        label: "Home screen showing main navigation and featured content"
      },
      {
        src: '/SimplMode.png',
        sizes: '384x854',
        type: 'image/png',
        form_factor: 'narrow',
        label: "Moderation screen showing main navigation and content to moderate"
      },
      {
        src: '/SimplComm.png',
        sizes: '384x854',
        type: 'image/png',
        form_factor: 'narrow',
        label: "Commentary screen showing main post and its comments"
      }
    ],
    categories: ['social networking ', 'social']
  }
}