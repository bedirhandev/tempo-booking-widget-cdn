# Antd-Mobile Widget Bundling Issue - Technical Analysis & Solution

## Executive Summary

The booking widget experiences critical failures when bundled for production use (`npm run build:widget`), specifically affecting the mobile version that uses antd-mobile components. While the application works correctly in development mode (`npm run dev`), the bundled widget exhibits:
- Chinese locale instead of English
- Non-functional picker components
- Broken mobile interactions
- Styling and layout issues

## Problem Description

### Symptoms
1. **Locale Issue**: Mobile components display Chinese text ("取消" for Cancel, "确定" for Confirm)
2. **Component Functionality**: Picker, DatePicker, and Toast components don't open or function correctly
3. **Styling Issues**: Components render incorrectly with broken layouts
4. **Interaction Issues**: Touch events and mobile gestures don't work properly

### Affected Components
- `Picker` (Service, Employee, Time selectors)
- `DatePicker` (Date selector)
- `Toast` (Notifications)
- `Steps`, `Button`, `Card`, `Grid` (Mobile layout components)

## Root Cause Analysis

### 1. Default Locale Configuration

**Finding**: antd-mobile defaults to Chinese locale (`zh-CN`) in its core configuration.

```javascript
// node_modules/antd-mobile/es/components/config-provider/config-provider.js
import zhCN from '../../locales/zh-CN';
export const defaultConfigRef = {
  current: {
    locale: zhCN  // Default is Chinese!
  }
}
```

**Issue**: When bundled, this global default is baked into the widget and the `ConfigProvider` wrapper doesn't properly override it.

### 2. Portal Rendering Mechanism

**Finding**: antd-mobile components use React Portals for overlays.

```javascript
// node_modules/antd-mobile/es/utils/get-container.js
export function resolveContainer(getContainer) {
  const container = typeof getContainer === 'function' ? getContainer() : getContainer;
  return container || document.body;  // Defaults to document.body
}
```

**Issues**:
- Components render outside the widget container
- CSS scoping is lost for portal-rendered elements
- Z-index stacking context conflicts with host page
- Event handlers may be attached to wrong DOM elements

### 3. Module Bundling Context Loss

**Finding**: The UMD/ES bundle loses module boundaries and React context chains.

**Development vs Production**:
- **Development**: ES modules maintain proper boundaries, contexts work correctly
- **Widget Bundle**: Everything is flattened into one module, breaking:
  - React Context propagation
  - Module-level state management
  - Dynamic imports and code splitting

### 4. CSS and Style Encapsulation

**Finding**: While CSS is bundled, interactive styles for mobile components are broken.

**Issues**:
- Animation and transition styles not applied correctly
- Touch feedback styles missing
- Portal components render without proper styles
- CSS custom properties (CSS variables) may not cascade correctly

## Why It Works in Development

1. **Module System**: Vite's dev server maintains proper ES module boundaries
2. **Hot Module Replacement**: Components are loaded individually with proper initialization
3. **Source Maps**: Direct module references preserve context chains
4. **No Minification**: Code structure remains intact

## Solution Approaches

### Solution 1: Global Configuration Override (Recommended)

**Approach**: Explicitly set antd-mobile's global configuration before rendering.

```typescript
// src/widget/antd-mobile-init.ts
import { setDefaultConfig } from 'antd-mobile';
import enUS from 'antd-mobile/es/locales/en-US';

export function initializeAntdMobile() {
  // Override global default locale
  setDefaultConfig({
    locale: enUS,
    popup: {
      destroyOnClose: true,
    },
    toast: {
      duration: 2000,
    }
  });
}

// src/widget/loader.ts
import { initializeAntdMobile } from './antd-mobile-init';

class BookingWidgetLoader {
  public init(config: WidgetConfig, element?: HTMLElement): WidgetInstance {
    // Initialize antd-mobile before any rendering
    initializeAntdMobile();
    // ... rest of initialization
  }
}
```

### Solution 2: Scoped Portal Container

**Approach**: Create a dedicated portal container within the widget.

```typescript
// src/components/widget/WidgetContainer.tsx
import { useRef, useEffect } from 'react';
import { ConfigProvider as AntdMobileConfigProvider } from 'antd-mobile';

const WidgetContainer: React.FC<WidgetContainerProps> = ({ config }) => {
  const portalContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Set global portal container
    if (portalContainerRef.current) {
      AntdMobileConfigProvider.config({
        getContainer: () => portalContainerRef.current!
      });
    }
  }, []);

  return (
    <div className="booking-widget-container">
      <AntdMobileConfigProvider 
        locale={enUSMobile}
        getContainer={() => portalContainerRef.current || document.body}
      >
        {/* Widget content */}
      </AntdMobileConfigProvider>
      {/* Portal container for popups */}
      <div ref={portalContainerRef} className="booking-widget-portals" />
    </div>
  );
};
```

### Solution 3: Build Configuration Optimization

**Approach**: Modify Vite configuration to handle antd-mobile better.

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => {
  if (mode === 'widget') {
    return {
      // ... existing config
      build: {
        rollupOptions: {
          output: {
            // Ensure proper module format for antd-mobile
            format: 'iife',
            name: 'BookingWidget',
            // Manual chunks to separate antd-mobile
            manualChunks: {
              'antd-mobile': ['antd-mobile', 'antd-mobile-icons']
            }
          }
        }
      },
      // Ensure globals are properly defined
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        'globalThis': 'window'
      }
    };
  }
});
```

### Solution 4: Runtime Patching (Quick Fix)

**Approach**: Patch the global configuration at runtime.

```javascript
// src/widget/index.ts
import { defaultConfigRef } from 'antd-mobile/es/components/config-provider/config-provider';
import enUS from 'antd-mobile/es/locales/en-US';

// Override the default locale globally
if (typeof window !== 'undefined') {
  // Patch the global default
  defaultConfigRef.current.locale = enUS;
  
  // Ensure it's applied before any component renders
  window.__ANTD_MOBILE_LOCALE__ = enUS;
}
```

## Implementation Steps

### Step 1: Create Initialization Module
1. Create `src/widget/antd-mobile-init.ts`
2. Import and configure locale settings
3. Set up portal container configuration
4. Initialize touch event handlers

### Step 2: Update Widget Loader
1. Modify `src/widget/loader.ts`
2. Call initialization before rendering
3. Ensure proper cleanup on widget destroy

### Step 3: Update Widget Container
1. Add scoped portal container
2. Configure `ConfigProvider` with proper props
3. Add error boundaries for better debugging

### Step 4: Update Build Configuration
1. Modify `vite.config.ts` for better bundling
2. Consider using IIFE format instead of UMD
3. Add proper externals if needed

### Step 5: Add CSS Fixes
1. Ensure portal styles are included
2. Add z-index management for widget context
3. Include touch feedback styles

## Alternative Solutions

### 1. Replace antd-mobile with Custom Components
- Build custom mobile pickers using native HTML5 inputs
- Use simpler UI libraries that don't rely on portals
- Implement progressive enhancement

### 2. Iframe Embedding
- Embed the widget in an iframe to isolate context
- Provides complete isolation but adds complexity
- Requires postMessage for communication

### 3. Separate Mobile Build
- Create a separate build specifically for mobile
- Load different bundles based on device detection
- More complex but provides optimal performance

## Testing Strategy

### 1. Unit Tests
- Test locale configuration
- Verify portal rendering
- Check component initialization

### 2. Integration Tests
- Test in various host environments
- Verify no conflicts with host page
- Check cross-browser compatibility

### 3. E2E Tests
- Test complete user flows
- Verify mobile interactions
- Test on actual devices

## Monitoring and Debugging

### 1. Add Debug Logging
```javascript
if (process.env.NODE_ENV !== 'production') {
  console.log('[BookingWidget] Locale:', defaultConfigRef.current.locale);
  console.log('[BookingWidget] Portal Container:', document.querySelector('.booking-widget-portals'));
}
```

### 2. Error Boundaries
```typescript
class WidgetErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[BookingWidget] Error:', error, errorInfo);
    // Send to monitoring service
  }
}
```

## Conclusion

The antd-mobile bundling issue stems from a combination of:
1. Global configuration defaults not being overridden
2. Portal rendering mechanism conflicts
3. Module context loss during bundling
4. CSS scoping issues

The recommended solution is to implement Solution 1 (Global Configuration Override) combined with Solution 2 (Scoped Portal Container) for a comprehensive fix that addresses all issues while maintaining compatibility with the host environment.

## Next Steps

1. Implement the initialization module
2. Update the widget loader and container
3. Test thoroughly in different environments
4. Consider long-term migration to more widget-friendly component libraries

## References

- [antd-mobile Documentation](https://mobile.ant.design/)
- [React Portals Documentation](https://react.dev/reference/react-dom/createPortal)
- [Vite Library Mode](https://vitejs.dev/guide/build.html#library-mode)
- [Widget Embedding Best Practices](https://developer.mozilla.org/en-US/docs/Web/Security/IFrame_Sandbox)