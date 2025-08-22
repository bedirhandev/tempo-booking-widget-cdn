import React, { useEffect, useState } from 'react'
import { ConfigProvider } from 'antd'
import { Toaster } from 'sonner'
import AppointmentBookingForm from '@/components/booking/AppointmentBookingForm'
import type { WidgetConfig } from '@/types/widget'
import '@/styles/widget.css'

interface WidgetContainerProps {
  config: WidgetConfig
  onBookingComplete?: (bookingData: any) => void
  onError?: (error: any) => void
  onLoad?: (widgetId: string) => void
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({
  config,
  onBookingComplete,
  onError,
  onLoad
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate unique widget ID for this instance
  const [widgetId] = useState(`widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    // Simulate loading and call onLoad callback
    const timer = setTimeout(() => {
      setIsLoaded(true)
      onLoad?.(widgetId)
    }, 100)

    return () => clearTimeout(timer)
  }, [onLoad, widgetId])

  // Create theme configuration for Ant Design
  const antdTheme = {
    token: {
      colorPrimary: config.primaryColor || '#1677ff',
      borderRadius: 6,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    algorithm: config.theme === 'dark' ? undefined : undefined, // We'll handle dark theme via CSS
  }

  // Error boundary-like error handling
  const handleError = (error: any) => {
    console.error('BookingWidget Error:', error)
    setError(error.message || 'An unexpected error occurred')
    onError?.(error)
  }

  // Handle booking completion
  const handleBookingComplete = (bookingData: any) => {
    try {
      onBookingComplete?.(bookingData)
      
      // Dispatch custom event for external listeners
      const event = new CustomEvent('bookingWidgetComplete', {
        detail: { bookingData, widgetId }
      })
      window.dispatchEvent(event)
    } catch (err) {
      handleError(err)
    }
  }

  if (error) {
    return (
      <div className="booking-widget-error">
        <h3>Widget Error</h3>
        <p>{error}</p>
        <button 
          className="ant-btn ant-btn-primary"
          onClick={() => {
            setError(null)
            setIsLoaded(false)
            // Retry loading
            setTimeout(() => setIsLoaded(true), 100)
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="booking-widget-loading">
        <div className="ant-spin ant-spin-spinning">
          <span className="ant-spin-dot ant-spin-dot-spin">
            <i className="ant-spin-dot-item"></i>
            <i className="ant-spin-dot-item"></i>
            <i className="ant-spin-dot-item"></i>
            <i className="ant-spin-dot-item"></i>
          </span>
        </div>
        <p style={{ marginTop: '16px', color: 'var(--bw-text-color-secondary)' }}>
          Loading booking widget...
        </p>
      </div>
    )
  }

  return (
    <ConfigProvider theme={antdTheme}>
      <div className="booking-widget-wrapper" data-widget-id={widgetId}>
        {/* Widget Header */}
        <div className="booking-widget-header">
          <h1>Book Your Appointment</h1>
          <p>Choose your service, select your preferred time, and provide your details</p>
        </div>

        {/* Widget Content */}
        <div className="booking-widget-content">
          <AppointmentBookingForm 
            tenantId={config.tenantId}
            apiUrl={config.apiUrl}
            onBookingComplete={handleBookingComplete}
            onError={handleError}
          />
        </div>

        {/* Toast notifications positioned relative to widget */}
        <Toaster
          position="top-right"
          expand={true}
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            className: 'booking-widget-toast',
            style: {
              fontFamily: 'var(--bw-font-family)',
            }
          }}
          // Use a container selector to keep toasts within the widget
          visibleToasts={5}
        />
      </div>
    </ConfigProvider>
  )
}

export default WidgetContainer