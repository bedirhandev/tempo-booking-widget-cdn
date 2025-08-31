# Why the App Works in Development but Not in Widget Build

## The Root Cause

The fundamental issue is that **antd-mobile's global CSS styles** were not being explicitly imported, and the two build modes handle this differently.

## Development Mode (`npm run dev`)

When running `npm run dev`:

1. **Vite's Auto-Import Magic**: Vite automatically detects when you use antd-mobile components and imports their CSS files behind the scenes
2. **Module Preservation**: Each module is loaded separately with proper boundaries
3. **Dynamic CSS Injection**: CSS is injected on-demand as components are used
4. **No Bundling**: Everything runs as separate ES modules
5. **Implicit Dependencies Work**: The build system handles missing imports automatically

## Widget Build Mode (`npm run build:widget`)

When building the widget:

1. **Everything Bundled**: All code is concatenated into a single file
2. **No Auto-Imports**: Vite's auto-import feature doesn't work in production builds
3. **Explicit Imports Required**: Every CSS file must be explicitly imported
4. **Context Loss**: Module boundaries are lost, affecting React contexts
5. **Global Defaults**: antd-mobile defaults to Chinese locale without proper initialization

## The Missing Piece

The critical missing import was:
```javascript
import 'antd-mobile/es/global';
```

This import provides:
- Base CSS reset for antd-mobile
- Global styles for popups, masks, and overlays
- Proper positioning for portal-based components
- Touch event handling styles
- Animation and transition definitions

## The Fix Applied

We've now added:

1. **Global styles import** in `src/widget/index.ts`:
   - Ensures widget bundle includes antd-mobile CSS
   
2. **Locale initialization** in `src/widget/antd-mobile-init.ts`:
   - Overrides Chinese default locale
   - Sets English locale globally
   
3. **ConfigProvider wrapper** in `WidgetContainer.tsx`:
   - Provides locale context to components
   - Prepares for future portal container scoping

## Why This Wasn't Obvious

1. **Silent Success in Dev**: Everything "just worked" in development, hiding the missing import
2. **Vite's Helpfulness**: Vite's auto-import feature is great for DX but can mask production issues
3. **antd-mobile Defaults**: The library defaults to Chinese, which only becomes apparent in production
4. **CSS-in-JS Expectations**: Modern developers expect CSS to be bundled with components automatically

## Lessons Learned

1. **Always explicitly import global styles** for UI libraries
2. **Test production builds early and often**
3. **Don't rely on dev server magic** for critical functionality
4. **Understand your bundler's behavior** in different modes
5. **Libraries with non-English defaults** need special attention

## Build Comparison

| Aspect | Development | Widget Build |
|--------|------------|--------------|
| CSS Loading | Automatic | Manual |
| Module System | ES Modules | UMD/IIFE Bundle |
| Context Preservation | Yes | No |
| Locale Default | Auto-detected | Chinese |
| Portal Rendering | Works | Needs explicit styles |
| File Size | N/A (not bundled) | ~500KB bundled |

## Testing Checklist

- [ ] Build widget: `npm run build:widget`
- [ ] Serve demo: `npx serve .`
- [ ] Test in demo.html
- [ ] Verify English locale
- [ ] Check popup positioning
- [ ] Test mobile interactions
- [ ] Verify no console errors

## Future Considerations

1. Consider using a more widget-friendly UI library
2. Create automated tests for widget builds
3. Add build-time validation for required imports
4. Document all implicit dependencies
5. Consider iframe isolation for complete independence