import React from 'react'
import { createRoot } from 'react-dom/client'
import WidgetContainer from '@/components/widget/WidgetContainer'
import { 
  parseConfigFromElement, 
  validateConfig, 
  generateWidgetId, 
  applyConfigToElement,
  getGlobalConfig
} from './config'
import type { WidgetInstance, WidgetConfig } from '@/types/widget'

class BookingWidgetLoader {
  public instances: Map<string, WidgetInstance> = new Map()
  private isInitialized: boolean = false

  /**
   * Initialize a widget instance on a specific element
   */
  public init(config: WidgetConfig, element?: HTMLElement): WidgetInstance {
    let targetElement = element

    if (!targetElement) {
      // Create a new element if none provided
      targetElement = document.createElement('div')
      targetElement.id = 'booking-widget'
      document.body.appendChild(targetElement)
    }

    // Validate configuration
    if (!validateConfig(config)) {
      throw new Error('Invalid widget configuration')
    }

    // Generate unique widget ID
    const widgetId = generateWidgetId()

    // Apply configuration to element
    applyConfigToElement(targetElement, config)

    // Get global callbacks
    const globalConfig = getGlobalConfig()

    // Create React root
    const root = createRoot(targetElement)

    // Create widget instance
    const instance: WidgetInstance = {
      id: widgetId,
      element: targetElement,
      config,
      destroy: () => {
        root.unmount()
        targetElement.remove()
        this.instances.delete(widgetId)
      },
      updateConfig: (newConfig: Partial<WidgetConfig>) => {
        const updatedConfig = { ...config, ...newConfig }
        if (validateConfig(updatedConfig)) {
          // Re-render with new config
          this.renderWidget(root, updatedConfig, globalConfig)
        }
      }
    }

    // Store instance
    this.instances.set(widgetId, instance)

    // Render the widget
    this.renderWidget(root, config, globalConfig)

    return instance
  }

  /**
   * Render the widget component
   */
  private renderWidget(
    root: any,
    config: WidgetConfig,
    globalConfig: any
  ) {
    root.render(
      React.createElement(WidgetContainer, {
        config,
        onBookingComplete: globalConfig.onBookingComplete,
        onError: globalConfig.onError,
        onLoad: globalConfig.onLoad
      })
    )
  }

  /**
   * Auto-discover and initialize widgets on the page
   */
  public autoInit(): void {
    if (this.isInitialized) {
      console.warn('BookingWidget: Already initialized')
      return
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.autoInit())
      return
    }

    try {
      // Find all widget containers
      const selectors = [
        '#booking-widget',
        '.booking-widget',
        '[data-widget="booking"]'
      ]

      const elements: HTMLElement[] = []
      selectors.forEach(selector => {
        const found = document.querySelectorAll(selector)
        found.forEach(el => elements.push(el as HTMLElement))
      })

      // Remove duplicates
      const uniqueElements = [...new Set(elements)]

      console.log(`BookingWidget: Found ${uniqueElements.length} widget containers`)

      // Initialize each widget
      uniqueElements.forEach((element, index) => {
        try {
          const config = parseConfigFromElement(element)
          if (config) {
            console.log(`BookingWidget: Initializing widget ${index + 1}`, config)
            this.init(config, element)
          } else {
            console.error(`BookingWidget: Failed to parse configuration for element ${index + 1}`)
          }
        } catch (error) {
          console.error(`BookingWidget: Failed to initialize widget ${index + 1}:`, error)
        }
      })

      this.isInitialized = true

      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('bookingWidgetReady', {
        detail: {
          instanceCount: this.instances.size,
          instances: Array.from(this.instances.keys())
        }
      }))

    } catch (error) {
      console.error('BookingWidget: Auto-initialization failed:', error)
    }
  }

  /**
   * Destroy a specific widget instance
   */
  public destroy(widgetId: string): boolean {
    const instance = this.instances.get(widgetId)
    if (instance) {
      instance.destroy()
      return true
    }
    return false
  }

  /**
   * Destroy all widget instances
   */
  public destroyAll(): void {
    this.instances.forEach(instance => instance.destroy())
    this.instances.clear()
    this.isInitialized = false
  }

  /**
   * Get a specific widget instance
   */
  public getInstance(widgetId: string): WidgetInstance | undefined {
    return this.instances.get(widgetId)
  }

  /**
   * Get all active widget instances
   */
  public getAllInstances(): WidgetInstance[] {
    return Array.from(this.instances.values())
  }

  /**
   * Re-scan the page for new widgets (useful for dynamically added content)
   */
  public refresh(): void {
    this.autoInit()
  }
}

// Create singleton instance
const widgetLoader = new BookingWidgetLoader()

// Export both the class and the singleton
export { BookingWidgetLoader, widgetLoader }

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  // Expose the widget API globally
  window.BookingWidget = {
    instances: widgetLoader.instances,
    init: widgetLoader.init.bind(widgetLoader),
    destroy: widgetLoader.destroy.bind(widgetLoader),
    destroyAll: widgetLoader.destroyAll.bind(widgetLoader),
    getInstance: widgetLoader.getInstance.bind(widgetLoader)
  }

  // Start auto-initialization
  widgetLoader.autoInit()
}

export default widgetLoader