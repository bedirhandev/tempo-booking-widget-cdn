// Embeddable Booking Widget Entry Point
// This file serves as the main entry for the embeddable widget bundle

import './loader'
import '@/styles/widget.css'

// Re-export types for external usage
export type { WidgetConfig, WidgetInstance } from '@/types/widget'

// Re-export the loader for programmatic usage
export { widgetLoader as default, BookingWidgetLoader } from './loader'
export { 
  parseConfigFromElement, 
  validateConfig, 
  generateWidgetId, 
  applyConfigToElement 
} from './config'

// Version info
export const WIDGET_VERSION = '1.0.0'

// Browser compatibility check
function checkBrowserSupport(): boolean {
  const requiredFeatures = [
    'Promise',
    'fetch',
    'Map',
    'Set',
    'Symbol',
    'WeakMap'
  ]

  return requiredFeatures.every(feature => feature in window)
}

// Log widget information
if (typeof window !== 'undefined') {
  if (!checkBrowserSupport()) {
    console.error('BookingWidget: Browser not supported. Required features missing.')
  } else {
    console.log(`BookingWidget v${WIDGET_VERSION} loaded successfully`)
    
    // Add widget version to global scope for debugging
    window.BOOKING_WIDGET_VERSION = WIDGET_VERSION
  }
}

// Global type extensions
declare global {
  interface Window {
    BOOKING_WIDGET_VERSION?: string
  }
}