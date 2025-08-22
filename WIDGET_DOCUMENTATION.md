# 🗓️ Booking Widget - Integration Documentation

## 📋 Quick Start Guide

The Booking Widget is a simple, embeddable solution that allows your users to book appointments directly on your website with minimal setup.

### ⚡ 2-Minute Integration

1. **Add the container** where you want the widget to appear:
```html
<div id="booking-widget" 
     data-tenant-id="your-tenant-id"
     data-api-url="https://your-api.com/api/v1"></div>
```

2. **Add the widget script** before the closing `</body>` tag:
```html
<script src="https://cdn.your-domain.com/booking-widget.js"></script>
```

That's it! Your booking widget is now live on your website. 🎉

## 📦 Installation Options

### Option 1: CDN (Recommended)
```html
<script src="https://cdn.jsdelivr.net/npm/booking-widget@latest/dist/booking-widget.min.js"></script>
```

### Option 2: Self-Hosted
1. Download the widget files from the releases page
2. Upload `booking-widget.js` to your server
3. Reference it in your HTML:
```html
<script src="/path/to/booking-widget.js"></script>
```

### Option 3: Local Development
1. Clone the repository
2. Run `npm run build:widget`
3. Use the generated file from `dist/widget/booking-widget.umd.js`

## ⚙️ Configuration Options

### Required Parameters
| Parameter | Description | Example |
|-----------|-------------|---------|
| `data-tenant-id` | Your unique tenant identifier | `"your-company-123"` |
| `data-api-url` | Your booking API base URL | `"https://api.example.com/api/v1"` |

### Optional Parameters
| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `data-theme` | Widget color theme | `"light"` | `"dark"` |
| `data-primary-color` | Primary color (hex) | `"#1677ff"` | `"#9c27b0"` |
| `data-width` | Widget width | `"100%"` | `"800px"` |
| `data-height` | Widget height | `"auto"` | `"600px"` |
| `data-language` | Interface language | `"en"` | `"es"` |
| `data-container-class` | Additional CSS classes | - | `"my-custom-class"` |

### Configuration Examples

#### Basic Widget
```html
<div id="booking-widget" 
     data-tenant-id="demo-tenant"
     data-api-url="https://api.example.com/api/v1">
</div>
```

#### Customized Widget
```html
<div id="booking-widget" 
     data-tenant-id="demo-tenant"
     data-api-url="https://api.example.com/api/v1"
     data-theme="dark"
     data-primary-color="#9c27b0"
     data-width="600px">
</div>
```

#### Multiple Widgets
```html
<!-- Widget for Location A -->
<div class="booking-widget" 
     data-tenant-id="location-a"
     data-api-url="https://api.example.com/api/v1"
     data-primary-color="#52c41a">
</div>

<!-- Widget for Location B -->
<div class="booking-widget" 
     data-tenant-id="location-b"
     data-api-url="https://api.example.com/api/v1"
     data-primary-color="#fa8c16">
</div>
```

## 🌐 Platform Integration Guides

### WordPress
1. **Method 1: HTML Block**
   - Add an HTML block in the WordPress editor
   - Paste the widget code
   - Publish your page

2. **Method 2: Functions.php**
   ```php
   function add_booking_widget_script() {
       wp_enqueue_script('booking-widget', 'https://cdn.your-domain.com/booking-widget.js', array(), '1.0.0', true);
   }
   add_action('wp_enqueue_scripts', 'add_booking_widget_script');
   ```

### Shopify
1. Go to **Online Store** > **Themes** > **Actions** > **Edit Code**
2. Open `theme.liquid` and add before `</body>`:
   ```html
   <script src="https://cdn.your-domain.com/booking-widget.js"></script>
   ```
3. Add the widget div to any template where needed

### Squarespace
1. Go to **Settings** > **Advanced** > **Code Injection**
2. Add to **Header** or **Footer**:
   ```html
   <script src="https://cdn.your-domain.com/booking-widget.js"></script>
   ```
3. Add a Code Block to your page with the widget div

### Wix
1. Click **Add** > **Embed** > **HTML iframe**
2. Paste the complete widget code:
   ```html
   <div id="booking-widget" data-tenant-id="your-id" data-api-url="your-api"></div>
   <script src="https://cdn.your-domain.com/booking-widget.js"></script>
   ```

### Static Websites
Simply add the widget code to any HTML file where you want the booking form to appear.

## 🔧 JavaScript API (Advanced)

### Global Configuration
Set up global callbacks and configuration:

```html
<script>
window.BookingWidgetConfig = {
  onBookingComplete: function(bookingData) {
    console.log('Booking completed:', bookingData);
    // Custom success handling
    gtag('event', 'booking_completed', {
      'value': bookingData.service.price
    });
  },
  
  onError: function(error) {
    console.error('Booking error:', error);
    // Custom error handling
  },
  
  onLoad: function(widgetId) {
    console.log('Widget loaded:', widgetId);
    // Widget initialization complete
  }
};
</script>
```

### Programmatic Control
```javascript
// Initialize widget programmatically
const config = {
  tenantId: 'your-tenant',
  apiUrl: 'https://api.example.com/api/v1',
  theme: 'light',
  primaryColor: '#1677ff'
};

const widget = window.BookingWidget.init(config);

// Destroy widget
widget.destroy();

// Update configuration
widget.updateConfig({ 
  theme: 'dark', 
  primaryColor: '#9c27b0' 
});
```

### Event Listening
```javascript
// Listen to widget events
window.addEventListener('bookingWidgetComplete', function(event) {
  console.log('Booking data:', event.detail.bookingData);
  console.log('Widget ID:', event.detail.widgetId);
});

window.addEventListener('bookingWidgetReady', function(event) {
  console.log('Total widgets:', event.detail.instanceCount);
  console.log('Widget instances:', event.detail.instances);
});
```

## 🎨 Styling & Customization

### Theme Customization
The widget supports light and dark themes, plus custom primary colors:

```html
<div id="booking-widget" 
     data-theme="dark"
     data-primary-color="#9c27b0">
</div>
```

### CSS Override (Advanced)
You can override widget styles using CSS custom properties:

```css
.booking-widget-container {
  --bw-primary-color: #your-color;
  --bw-border-radius: 12px;
  --bw-font-family: 'Your Font', sans-serif;
}

/* Override specific elements */
.booking-widget-container .ant-btn-primary {
  background: linear-gradient(45deg, #ff6b6b, #ee5a24);
}
```

### Responsive Design
The widget automatically adapts to different screen sizes. You can control the width:

```html
<!-- Fixed width -->
<div id="booking-widget" data-width="800px"></div>

<!-- Responsive width -->
<div id="booking-widget" data-width="100%"></div>

<!-- Mobile-first approach -->
<div id="booking-widget" 
     data-width="100%"
     style="max-width: 800px; margin: 0 auto;">
</div>
```

## 🔒 Security & Privacy

### Content Security Policy (CSP)
If your site uses CSP, add these directives:

```html
<meta http-equiv="Content-Security-Policy" 
      content="script-src 'self' https://cdn.your-domain.com; 
               style-src 'self' 'unsafe-inline';">
```

### Data Handling
- All data is transmitted over HTTPS
- No sensitive information is stored in browser storage
- Widget communicates only with your configured API endpoint

## 🐛 Troubleshooting

### Widget Not Appearing
1. **Check the console** for JavaScript errors
2. **Verify script loading**: Look for `BookingWidget loaded successfully` message
3. **Check required attributes**: Ensure `data-tenant-id` and `data-api-url` are present
4. **API connectivity**: Test if your API endpoint is accessible

### Styling Issues
1. **Check CSS conflicts**: The widget uses prefixed classes to avoid conflicts
2. **Theme issues**: Ensure the theme value is either `"light"` or `"dark"`
3. **Color format**: Primary color must be a valid hex color (e.g., `#1677ff`)

### API Connection Issues
1. **CORS configuration**: Ensure your API allows requests from your domain
2. **API URL format**: Must be a complete URL with protocol (https://)
3. **Tenant ID**: Verify the tenant ID exists in your system

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|---------|
| "Missing required attributes" | No tenant-id or api-url | Add required data attributes |
| "Invalid API URL format" | Malformed URL | Use complete URL with protocol |
| "Widget initialization failed" | JavaScript error | Check browser console |
| "API connection failed" | Network/CORS issue | Check API configuration |

## 📱 Mobile Optimization

The widget is fully responsive and works great on mobile devices:

- **Touch-friendly**: All interactions work with touch
- **Mobile layout**: Adapts to smaller screens automatically
- **Performance**: Optimized for mobile networks
- **Accessibility**: Screen reader compatible

## 🔄 Updates & Versioning

### Auto-updates (CDN)
Using the CDN with `@latest` automatically gets updates:
```html
<script src="https://cdn.jsdelivr.net/npm/booking-widget@latest/dist/booking-widget.min.js"></script>
```

### Version Pinning
For stability, pin to a specific version:
```html
<script src="https://cdn.jsdelivr.net/npm/booking-widget@1.0.0/dist/booking-widget.min.js"></script>
```

### Self-hosted Updates
1. Download the new version
2. Replace your existing widget file
3. Clear any caches
4. Test the integration

## 📊 Analytics Integration

### Google Analytics 4
```javascript
window.BookingWidgetConfig = {
  onBookingComplete: function(bookingData) {
    gtag('event', 'booking_completed', {
      'event_category': 'engagement',
      'value': bookingData.service?.price || 0,
      'currency': 'USD'
    });
  }
};
```

### Facebook Pixel
```javascript
window.BookingWidgetConfig = {
  onBookingComplete: function(bookingData) {
    fbq('track', 'Purchase', {
      value: bookingData.service?.price || 0,
      currency: 'USD'
    });
  }
};
```

## 🆘 Support

### Self-Help Resources
- **Demo**: Open `demo.html` in your browser
- **Browser Console**: Check for error messages and logs
- **Network Tab**: Verify API calls are working

### Contact Support
- **GitHub Issues**: [Report bugs or request features](https://github.com/your-repo/issues)
- **Email**: support@your-domain.com
- **Documentation**: This guide and the technical specification

## 📋 Checklist for Going Live

- [ ] Widget displays correctly on your website
- [ ] Booking flow completes successfully
- [ ] API integration is working (appointments are created)
- [ ] Mobile experience is tested and working
- [ ] Analytics tracking is set up (if needed)
- [ ] CSP headers are configured (if applicable)
- [ ] Error handling is tested
- [ ] Performance is acceptable on your target devices

---

## 🚀 Advanced Developer Information

For detailed technical information, architecture decisions, and development guidelines, see [EMBEDDABLE_WIDGET_PLAN.md](./EMBEDDABLE_WIDGET_PLAN.md).

### Build from Source
```bash
# Clone repository
git clone [repository-url]
cd booking-widget

# Install dependencies
npm install

# Build the widget
npm run build:widget

# Test locally
npm run dev
```

### API Requirements
Your booking API should support these endpoints:
- `GET /{tenantId}/services` - List available services
- `GET /{tenantId}/team/members` - List team members
- `GET /{tenantId}/appointments` - List existing appointments
- `POST /{tenantId}/appointments` - Create new appointment

### Browser Compatibility
- **Modern browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile**: iOS Safari 13+, Chrome Mobile 80+
- **Polyfills**: Automatic for older browsers if needed

---

*Last updated: 2024 - Version 1.0.0*