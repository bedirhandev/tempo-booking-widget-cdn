import { ConfigProvider } from 'antd'
import { Toaster } from 'sonner'
import AppointmentBookingForm from '@/components/booking/AppointmentBookingForm'
import '@/styles/App.css'

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <div className="app-container" style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1677ff 0%, #69c0ff 100%)',
            padding: '40px 20px',
            textAlign: 'center',
            color: '#fff'
          }}>
            <h1 style={{
              margin: '0 0 10px 0',
              fontSize: '32px',
              fontWeight: 'bold'
            }}>
              Book Your Appointment
            </h1>
            <p style={{
              margin: '0',
              fontSize: '16px',
              opacity: 0.9
            }}>
              Choose your service, select your preferred time, and provide your details
            </p>
          </div>

          <div style={{ padding: '40px 20px' }}>
            <AppointmentBookingForm tenantId="10e7c063-e054-4e30-ae97-c62d489dea76" />
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          color: '#666'
        }}>
          <p>Demo Booking Widget - Built with React, TypeScript & Ant Design</p>
        </div>
      </div>

      <Toaster
        position="top-right"
        expand={true}
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          className: 'toast-custom',
        }}
      />
    </ConfigProvider>
  )
}

export default App
