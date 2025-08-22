import type { WidgetConfig } from '@/types/widget'

/**
 * Parse widget configuration from DOM element data attributes
 */
export function parseConfigFromElement(element: HTMLElement): WidgetConfig | null {
  const tenantId = element.getAttribute('data-tenant-id')
  const apiUrl = element.getAttribute('data-api-url')

  // Required attributes validation
  if (!tenantId || !apiUrl) {
    console.error('BookingWidget: Missing required attributes data-tenant-id or data-api-url')
    return null
  }

  // Parse optional attributes
  const config: WidgetConfig = {
    tenantId,
    apiUrl,
    theme: (element.getAttribute('data-theme') as 'light' | 'dark') || 'light',
    primaryColor: element.getAttribute('data-primary-color') || '#1677ff',
    width: element.getAttribute('data-width') || '100%',
    height: element.getAttribute('data-height') || 'auto',
    language: element.getAttribute('data-language') || 'en',
    containerClass: element.getAttribute('data-container-class') || undefined,
  }

  return config
}

/**
 * Validate widget configuration
 */
export function validateConfig(config: WidgetConfig): boolean {
  if (!config.tenantId || typeof config.tenantId !== 'string') {
    console.error('BookingWidget: Invalid tenantId')
    return false
  }

  if (!config.apiUrl || typeof config.apiUrl !== 'string') {
    console.error('BookingWidget: Invalid apiUrl')
    return false
  }

  // Validate URL format
  try {
    new URL(config.apiUrl)
  } catch {
    console.error('BookingWidget: Invalid API URL format')
    return false
  }

  // Validate theme
  if (config.theme && !['light', 'dark'].includes(config.theme)) {
    console.error('BookingWidget: Invalid theme, must be "light" or "dark"')
    return false
  }

  // Validate color format (basic hex color check)
  if (config.primaryColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(config.primaryColor)) {
    console.error('BookingWidget: Invalid primary color format, must be hex color')
    return false
  }

  return true
}

/**
 * Generate unique widget ID
 */
export function generateWidgetId(): string {
  return `booking-widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Merge configuration with defaults
 */
export function mergeConfigWithDefaults(config: Partial<WidgetConfig>): WidgetConfig {
  const defaults: Partial<WidgetConfig> = {
    theme: 'light',
    primaryColor: '#1677ff',
    width: '100%',
    height: 'auto',
    language: 'en',
  }

  return {
    ...defaults,
    ...config,
  } as WidgetConfig
}

/**
 * Create CSS custom properties from config
 */
export function createCSSVariables(config: WidgetConfig): Record<string, string> {
  return {
    '--bw-primary-color': config.primaryColor || '#1677ff',
    '--bw-theme': config.theme || 'light',
    '--bw-width': config.width || '100%',
    '--bw-height': config.height || 'auto',
  }
}

/**
 * Apply configuration to container element
 */
export function applyConfigToElement(element: HTMLElement, config: WidgetConfig): void {
  // Add widget container class
  element.classList.add('booking-widget-container')
  
  // Add theme class
  element.classList.add(`booking-widget-theme-${config.theme}`)
  
  // Add custom container class if provided
  if (config.containerClass) {
    config.containerClass.split(' ').forEach(cls => {
      element.classList.add(cls)
    })
  }

  // Apply CSS custom properties
  const cssVariables = createCSSVariables(config)
  Object.entries(cssVariables).forEach(([property, value]) => {
    element.style.setProperty(property, value)
  })

  // Set container dimensions
  if (config.width && config.width !== '100%') {
    element.style.width = config.width
  }
  if (config.height && config.height !== 'auto') {
    element.style.height = config.height
  }
}

/**
 * Get global widget configuration from window
 */
export function getGlobalConfig() {
  return window.BookingWidgetConfig || {}
}