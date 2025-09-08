// Embeddable Booking Widget Entry Point
// This file serves as the main entry for the embeddable widget bundle

// CRITICAL: Import antd-mobile global styles first
// This ensures all antd-mobile components render correctly
//import 'antd-mobile/es/global'

// Import and initialize antd-mobile configuration BEFORE anything else
import { initializeAntdMobile } from './antd-mobile-init'

// Initialize antd-mobile as early as possible to prevent Chinese locale
if (typeof window !== 'undefined') {
  console.log('[BookingWidget] Early initialization of antd-mobile...')
  initializeAntdMobile()
}

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
    
    // Ensure antd-mobile is initialized (double-check)
    initializeAntdMobile()
  }
}

// Global type extensions
declare global {
  interface Window {
    BOOKING_WIDGET_VERSION?: string
  }
}