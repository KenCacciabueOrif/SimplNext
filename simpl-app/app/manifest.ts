import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Simpl.',
    short_name: 'S.',
    icons: [
      {
        src: '/public/logo.svg',
        sizes: '192x192',
        type: 'image/svg',
      },
      {
        src: '/public/logo.svg',
        sizes: '512x512',
        type: 'image/svg',
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
        src: 'public/SimplHome.png',
        sizes: '384x854',
        type: 'image/png',
        form_factor: 'narrow',
        label: "Home screen showing main navigation and featured content"
      },
      {
        src: 'public/SimplMode.png',
        sizes: '384x854',
        type: 'image/png',
        form_factor: 'narrow',
        label: "Moderation screen showing main navigation and content to moderate"
      },
      {
        src: 'public/SimplComm.png',
        sizes: '384x854',
        type: 'image/png',
        form_factor: 'narrow',
        label: "Commentary screen showing main post and its comments"
      }
    ],
    categories: ['social networking ', 'social']
  }
}