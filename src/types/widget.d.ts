// Widget configuration and types
export interface WidgetConfig {
  // Required configuration
  tenantId: string;
  apiUrl: string;
  
  // Optional styling configuration  
  theme?: 'light' | 'dark';
  primaryColor?: string;
  width?: string;
  height?: string;
  language?: string;
  containerClass?: string;
  
  // Callback functions
  onBookingComplete?: (bookingData: any) => void;
  onError?: (error: any) => void;
  onLoad?: (widgetId: string) => void;
}

export interface WidgetInstance {
  id: string;
  element: HTMLElement;
  config: WidgetConfig;
  destroy: () => void;
  updateConfig: (newConfig: Partial<WidgetConfig>) => void;
}

export interface GlobalWidgetConfig {
  onBookingComplete?: (bookingData: any) => void;
  onError?: (error: any) => void;
  onLoad?: (widgetId: string) => void;
}

// Extend global window object for widget configuration
declare global {
  interface Window {
    BookingWidget?: {
      instances: Map<string, WidgetInstance>;
      init: (config: WidgetConfig, element?: HTMLElement) => WidgetInstance;
      destroy: (widgetId: string) => void;
      destroyAll: () => void;
      getInstance: (widgetId: string) => WidgetInstance | undefined;
    };
    BookingWidgetConfig?: GlobalWidgetConfig;
  }
}

export interface WidgetDataAttributes {
  'data-tenant-id': string;
  'data-api-url': string;
  'data-theme'?: string;
  'data-primary-color'?: string;
  'data-width'?: string;
  'data-height'?: string;
  'data-language'?: string;
  'data-container-class'?: string;
}