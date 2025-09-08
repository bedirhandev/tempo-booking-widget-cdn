/**
 * Antd-Mobile initialization module for widget bundling
 * This module ensures proper locale and configuration for antd-mobile
 * when the widget is bundled for production use.
 */

// Import the configuration setter if available
// Note: antd-mobile may not export setDefaultConfig directly
// We'll use a workaround to patch the global configuration

// @ts-ignore - accessing internal module
import { defaultConfigRef } from 'antd-mobile/es/components/config-provider/config-provider';
import enUS from 'antd-mobile/es/locales/en-US';

// Import antd-mobile global styles - this is why it works in dev mode
//import 'antd-mobile/es/global';

/**
 * Initialize antd-mobile with proper configuration for widget usage
 */
export function initializeAntdMobile() {
  console.log('[BookingWidget] Initializing antd-mobile configuration...');
  
  try {
    // Method 1: Direct patch of the global default configuration
    // This overrides the Chinese locale that antd-mobile defaults to
    if (defaultConfigRef && defaultConfigRef.current) {
      console.log('[BookingWidget] Patching global locale from:', defaultConfigRef.current.locale?.locale);
      defaultConfigRef.current.locale = enUS;
      console.log('[BookingWidget] Global locale patched to:', enUS.locale);
    }
    
    // Method 2: Set global window variable that antd-mobile might check
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.__ANTD_MOBILE_LOCALE__ = enUS;
      // @ts-ignore
      window.__ANTD_MOBILE_GLOBAL_CONFIG__ = {
        locale: enUS,
        popup: {
          destroyOnClose: true,
        },
        toast: {
          duration: 2000,
          maskClickable: false,
        },
        picker: {
          confirmText: 'Confirm',
          cancelText: 'Cancel',
        },
      };
    }
    
    console.log('[BookingWidget] Antd-mobile initialization complete');
    return true;
  } catch (error) {
    console.error('[BookingWidget] Failed to initialize antd-mobile:', error);
    return false;
  }
}

/**
 * Clean up antd-mobile configuration (for widget destroy)
 */
export function cleanupAntdMobile() {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    delete window.__ANTD_MOBILE_LOCALE__;
    // @ts-ignore
    delete window.__ANTD_MOBILE_GLOBAL_CONFIG__;
  }
}

/**
 * Get current locale configuration for debugging
 */
export function getAntdMobileLocale() {
  return {
    globalLocale: defaultConfigRef?.current?.locale,
    // @ts-ignore
    windowLocale: window.__ANTD_MOBILE_LOCALE__,
  };
}