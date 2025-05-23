// tamagui.config.ts
import { config } from '@tamagui/config/v3' // Note: Use v3, not v4
import { createTamagui } from 'tamagui'

const tamaguiConfig = createTamagui({
 ...config,
 fonts: {
   ...config.fonts,
   // Override to use system fonts that support more weights
   body: {
     family: 'System', // iOS will use SF Pro, Android uses Roboto
     size: config.fonts.body.size,
     lineHeight: config.fonts.body.lineHeight,
     weight: config.fonts.body.weight,
     letterSpacing: config.fonts.body.letterSpacing,
   },
   heading: {
     family: 'System',
     size: config.fonts.heading.size,
     lineHeight: config.fonts.heading.lineHeight,
     weight: config.fonts.heading.weight,
     letterSpacing: config.fonts.heading.letterSpacing,
   },
 },
 themes: {
   ...config.themes,
   dark: {
     ...config.themes.dark,
     backgroundSoft: '#1f281f',
     primary: '#4a854a',
     primaryLight: '#559e55',
     textSoft: '#999',
     border: '#446044',
     borderSoft: 'rgba(255,255,255,0.1)',
   },
   light: {
     ...config.themes.light,
     backgroundSoft: '#f5f5f5',
     primary: '#4a854a',
     primaryLight: '#6fa06f',
     textSoft: '#666',
     border: '#cccccc',
     borderSoft: '#e0e0e0',
   }
 },
})

// This is the crucial part - the type and declaration
export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
 interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig