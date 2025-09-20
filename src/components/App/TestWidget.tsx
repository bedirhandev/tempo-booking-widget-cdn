// src/pages/TestWidget.tsx
import React from 'react'
import WidgetContainer from '@/components/widget/WidgetContainer'
import PaymentWidget from '@/components/payment/PaymentWidget'
import type { WidgetConfig } from '@/types/widget'

const TestWidget: React.FC = () => {
    // Configuration for the widget
    const widgetConfig: WidgetConfig = {
        tenantId: '8096a1e1-764f-4fc1-9e5f-3efa3a564617', // Your tenant ID
        apiUrl: 'http://localhost:8000/api/v1', // Your API URL (optional)
        primaryColor: '#1677ff', // Optional: custom primary color
        theme: 'light', // Optional: 'light' or 'dark'
    }

    // Handle booking completion
    const handleBookingComplete = (bookingData: any) => {
        console.log('Booking completed:', bookingData)
        // You can add custom logic here, like:
        // - Show a success message
        // - Redirect to another page
        // - Send analytics events
    }

    // Handle errors
    const handleError = (error: any) => {
        console.error('Booking error:', error)
        // You can add custom error handling here
    }

    // Handle widget load
    const handleLoad = (widgetId: string) => {
        console.log('Widget loaded with ID:', widgetId)
    }

    // Read demo params for PaymentWidget
    const params = new URLSearchParams(window.location.search)
    const demoTenantId = params.get('tenantId') || widgetConfig.tenantId
    const demoBookingId = params.get('bookingId')
    const demoApiBaseUrl = params.get('apiBaseUrl') || 'http://127.0.0.1:8000/api/v1'
    const demoEmail = params.get('email') || undefined
    const demoName = params.get('name') || undefined

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                <h1 style={{ marginBottom: '30px', textAlign: 'center' }}>
                    Widget Test Page
                </h1>

                {/* The Widget Container */}
                <WidgetContainer
                    config={widgetConfig}
                    onBookingComplete={handleBookingComplete}
                    onError={handleError}
                    onLoad={handleLoad}
                />

                {/* Stripe Payment Demo */}
                <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ marginTop: 0 }}>Stripe Payment Demo</h2>
                    <p style={{ marginTop: 0, color: '#666' }}>
                        Provide tenantId and bookingId via query params to try the payment flow:
                        <code> ?tenantId=...&bookingId=...&apiBaseUrl=http://127.0.0.1:8000/api/v1</code>
                    </p>

                    {demoTenantId && demoBookingId ? (
                        <PaymentWidget
                            tenantId={demoTenantId}
                            bookingId={demoBookingId}
                            apiBaseUrl={demoApiBaseUrl}
                            email={demoEmail}
                            name={demoName}
                            onPaymentSuccess={(bookingId) => {
                                console.log('Payment successful for booking:', bookingId)
                            }}
                            onPaymentFailure={(err) => {
                                console.error('Payment failed:', err)
                            }}
                            onReady={() => console.log('PaymentWidget ready')}
                        />
                    ) : (
                        <div style={{ color: '#c00' }}>
                            Missing tenantId or bookingId in query string. Append them to the URL to enable the demo.
                        </div>
                    )}
                </div>

                {/* Debug info */}
                <div style={{
                    marginTop: '40px',
                    padding: '20px',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h3>Debug Information</h3>
                    <pre style={{ fontSize: '12px' }}>
                        {JSON.stringify(widgetConfig, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    )
}

export default TestWidget