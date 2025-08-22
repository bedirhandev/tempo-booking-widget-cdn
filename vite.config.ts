import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isWidget = mode === 'widget'
  
  if (isWidget) {
    // Widget build configuration
    return {
      plugins: [react()],
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        }
      },
      build: {
        lib: {
          entry: fileURLToPath(new URL('./src/widget/index.ts', import.meta.url)),
          name: 'BookingWidget',
          formats: ['umd', 'es'],
          fileName: (format) => `booking-widget.${format}.js`
        },
        rollupOptions: {
          // Bundle all dependencies for the widget
          external: [],
          output: {
            globals: {},
            exports: 'named'
          }
        },
        outDir: 'dist/widget',
        emptyOutDir: true,
        sourcemap: true,
        minify: true,
        cssCodeSplit: false
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env.WIDGET_MODE': JSON.stringify('true')
      }
    }
  }
  
  // Default app build configuration
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      }
    },
    build: {
      outDir: 'dist/app',
      sourcemap: true
    },
    define: {
      'process.env.WIDGET_MODE': JSON.stringify('false')
    }
  }
})
