// App.tsx
import { ConfigProvider as AntdConfigProvider } from 'antd';
import { ConfigProvider as AntdMobileConfigProvider } from 'antd-mobile';
import { Toaster } from 'sonner'
import AppointmentBookingForm from '@/components/booking/AppointmentBookingForm'
import AppointmentBookingFormMobile from '@/components/booking/AppointmentBookingFormMobile';
import { useIsMobile } from '@/components/booking/hooks/useIsMobile';
import '@/styles/App.css'
import enUS from 'antd/locale/en_US';
import enUSMobile from 'antd-mobile/es/locales/en-US';

function App() {
  const isMobile = useIsMobile();
  const tenantId = "ab532175-912d-4e1c-afdd-291f92525ace";

  // Common UI wrapper
  const AppContent = () => (
    <>
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
              fontSize: isMobile ? '28px' : '32px',
              fontWeight: 'bold'
            }}>
              Book Your Appointment
            </h1>
            <p style={{
              margin: '0',
              fontSize: isMobile ? '14px' : '16px',
              opacity: 0.9
            }}>
              Choose your service, select your preferred time, and provide your details
            </p>
          </div>

          <div style={{ padding: isMobile ? '20px' : '40px 20px' }}>
            {isMobile ? (
              <AppointmentBookingFormMobile tenantId={tenantId} />
            ) : (
              <AppointmentBookingForm tenantId={tenantId} />
            )}
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
        position={isMobile ? "bottom-center" : "top-right"}
        expand={!isMobile}
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          className: 'toast-custom',
        }}
      />
    </>
  );

  // Conditionally wrap with appropriate ConfigProvider
  if (isMobile) {
    return (
      <AntdMobileConfigProvider locale={enUSMobile}>
        <AppContent />
      </AntdMobileConfigProvider>
    );
  }

  return (
    <AntdConfigProvider locale={enUS}>
      <AppContent />
    </AntdConfigProvider>
  );
}

export default App;