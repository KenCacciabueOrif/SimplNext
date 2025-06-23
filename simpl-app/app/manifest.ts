import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Simpl.',
    short_name: 'S.',
    description: 'A simple social network',
    start_url: '/',
    display: 'standalone',
    background_color: '#030712',
    theme_color: '#030712',
    icons: [
      {
        src: '/public/file.svg',
        sizes: '192x192',
        type: 'image/psvg',
      },
      {
        src: '/public/file.svg',
        sizes: '512x512',
        type: 'image/svg',
      },
    ],
  }
}