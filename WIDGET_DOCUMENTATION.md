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

## 🔧 Troubleshooting

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

## 🌐 Making Your Widget Public (Production Deployment)

Currently, your widget is running locally on your development machine. To make it available for public use, you need to deploy it to a publicly accessible server. Here are several deployment options:

### 🚀 Deployment Options

#### Option 1: CDN Deployment (Recommended for Global Distribution)

> **🏆 RECOMMENDED CHOICE: jsDelivr + GitHub**
>
> **Why jsDelivr?**
> - **100% Free**: No bandwidth limits or usage fees
> - **Global CDN**: 700+ locations worldwide for fast loading
> - **99.9% Uptime**: Enterprise-grade reliability
> - **Zero Setup**: Just push to GitHub and tag a release
> - **Automatic HTTPS**: SSL certificates handled automatically
> - **Version Control**: Easy to manage different versions
> - **No Vendor Lock-in**: Your code stays in your GitHub repo
>
> **Perfect for**: Most use cases, especially if you're already using GitHub

#### 📊 Deployment Comparison

| Feature | jsDelivr | Netlify | Vercel | GitHub Pages | AWS S3+CloudFront |
|---------|----------|---------|---------|--------------|-------------------|
| **Cost** | Free | Free tier | Free tier | Free | ~$10-50/month |
| **Global CDN** | ✅ Excellent | ✅ Good | ✅ Excellent | ❌ US-centric | ✅ Excellent |
| **Setup Complexity** | ⭐ Simple | ⭐⭐ Easy | ⭐⭐ Easy | ⭐ Simple | ⭐⭐⭐⭐ Complex |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Bandwidth Limits** | None | 100GB/month | 100GB/month | Soft limit | Pay per use |
| **Custom Domain** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Best For** | Open source | Web apps | Modern apps | Demos | Enterprise |

#### 🎯 Choose Based on Your Needs:

**🥇 For Most Developers: jsDelivr + GitHub**
- You want simple, reliable, and free CDN delivery
- Your widget is open source or can be public
- You're already using GitHub for version control

**🥈 For Custom Branding: Netlify or Vercel**
- You need a custom domain for your widget URL
- You want more control over the deployment process
- You have additional web assets to host alongside the widget

**🥉 For Enterprise: AWS S3 + CloudFront**
- You need guaranteed SLA and professional support
- You have high traffic requirements (>100GB/month)
- You want full control over caching, compression, and security headers
- Budget is available for infrastructure costs

**❌ Avoid GitHub Pages for Production**
- Not a true CDN, slower international loading
- Bandwidth limitations for high-traffic widgets
- Better suited for documentation than production assets

**Step 1: Build for Production**
```bash
# Build the widget with production optimizations
npm run build:widget

# The built files will be in dist/widget/
# - booking-widget.umd.js (main widget file)
# - booking-widget.css (if any styles)
```

**Step 2: Upload to CDN Service**

**Using jsDelivr (Free GitHub-based CDN):**

### 🔧 Complete jsDelivr Deployment Guide

#### Prerequisites
- GitHub account ([create one here](https://github.com/join))
- Git installed on your computer ([download here](https://git-scm.com/downloads))
- Your booking widget project ready for deployment

#### Step 1: Prepare Your Project for Production

**1.1 Clean Build Your Widget**
```bash
# Navigate to your project directory
cd /path/to/your/booking-widget

# Clean any previous builds
rm -rf dist/

# Install dependencies (if not already done)
npm install

# Build the production version
npm run build:widget
```

**1.2 Verify Build Output**
Check that these files exist:
```
dist/
├── widget/
│   ├── booking-widget.umd.js    # Main widget file
│   └── booking-widget.umd.js.map # Source map (optional)
└── demo.html                    # Demo file (optional)
```

**1.3 Test Your Build Locally**
```bash
# Test the built widget works
npx serve dist
# Open http://localhost:3000/demo.html in browser
# Verify the widget loads and functions correctly
```

#### Step 2: Create GitHub Repository

**2.1 Create New Repository on GitHub**
1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** in top right corner → **"New repository"**
3. Fill in repository details:
   ```
   Repository name: booking-widget-cdn
   Description: Embeddable booking widget for website integration
   Visibility: Public (required for jsDelivr)
   □ Initialize with README (unchecked)
   □ Add .gitignore (unchecked)
   □ Choose a license (optional)
   ```
4. Click **"Create repository"**

**2.2 Note Your Repository URL**
GitHub will show you the repository URL:
```
https://github.com/yourusername/booking-widget-cdn.git
```

#### Step 3: Initialize Local Git Repository

**3.1 Initialize Git in Your Project**
```bash
# In your project directory
cd /path/to/your/booking-widget

# Initialize git (if not already done)
git init

# Add the GitHub remote
git remote add origin https://github.com/yourusername/booking-widget-cdn.git
```

**3.2 Create .gitignore File**
```bash
# Create .gitignore to exclude unnecessary files
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Build artifacts (keep dist for CDN)
# dist/ <- DON'T ignore dist/ since we need it for jsDelivr

# Temporary files
*.tmp
*.temp
EOF
```

**3.3 Create README.md**
```bash
cat > README.md << 'EOF'
# Booking Widget

Embeddable appointment booking widget for websites.

## CDN Usage

```html
<!-- Latest version -->
<div id="booking-widget"
     data-tenant-id="your-tenant-id"
     data-api-url="https://your-api.com/api/v1">
</div>
<script src="https://cdn.jsdelivr.net/gh/yourusername/booking-widget-cdn@latest/dist/widget/booking-widget.umd.js"></script>
```

## Specific Version
```html
<script src="https://cdn.jsdelivr.net/gh/yourusername/booking-widget-cdn@v1.0.0/dist/widget/booking-widget.umd.js"></script>
```

## Demo
See `dist/demo.html` for a complete integration example.

EOF
```

#### Step 4: Commit and Push to GitHub

**4.1 Stage All Files**
```bash
# Add all files to git
git add .

# Check what will be committed
git status
```

**4.2 Make Initial Commit**
```bash
# Commit with descriptive message
git commit -m "Initial release: booking widget v1.0.0

- Production-ready embeddable booking widget
- Includes demo.html for integration example
- Built with React, TypeScript, and Ant Design
- Compatible with all modern browsers"
```

**4.3 Push to GitHub**
```bash
# Set the default branch and push
git branch -M main
git push -u origin main
```

#### Step 5: Create and Tag a Release

**5.1 Create a Git Tag**
```bash
# Create annotated tag with detailed message
git tag -a v1.0.0 -m "Release v1.0.0: Initial production release

Features:
- Service selection and booking flow
- Date/time picker with availability checking
- Employee selection
- Responsive design for mobile and desktop
- Customizable theming and styling
- Error handling and validation

Technical:
- Built with React 18 and TypeScript
- Uses Ant Design components
- UMD bundle for universal compatibility
- Minified and optimized for production"
```

**5.2 Push the Tag to GitHub**
```bash
# Push the tag to GitHub
git push origin v1.0.0
```

**5.3 Create GitHub Release (Recommended)**
1. Go to your repository on GitHub
2. Click **"Releases"** → **"Create a new release"**
3. Select tag: **v1.0.0**
4. Release title: **"Booking Widget v1.0.0 - Initial Release"**
5. Description:
   ```markdown
   ## 🎉 Initial Production Release
   
   This is the first production-ready version of the booking widget.
   
   ### 📦 CDN Usage
   ```html
   <script src="https://cdn.jsdelivr.net/gh/yourusername/booking-widget-cdn@v1.0.0/dist/widget/booking-widget.umd.js"></script>
   ```
   
   ### ✨ Features
   - Complete booking flow with service/date/time/employee selection
   - Responsive design optimized for all devices
   - Customizable themes and styling
   - Production-ready error handling
   
   ### 📋 Requirements
   - Modern browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
   - HTTPS-enabled API endpoint
   - CORS properly configured for your domain
   ```
6. Check **"Set as the latest release"**
7. Click **"Publish release"**

#### Step 6: Verify CDN Deployment

**6.1 Test jsDelivr URL**
Wait 5-10 minutes for jsDelivr to cache your files, then test:

```bash
# Test if your widget is available
curl -I "https://cdn.jsdelivr.net/gh/yourusername/booking-widget-cdn@v1.0.0/dist/widget/booking-widget.umd.js"

# Should return HTTP 200 OK
```

**6.2 Test in Browser**
Create a test HTML file:
```html
<!DOCTYPE html>
<html>
<head><title>Widget CDN Test</title></head>
<body>
    <div id="booking-widget"
         data-tenant-id="10e7c063-e054-4e30-ae97-c62d489dea76"
         data-api-url="http://localhost:8000/api/v1">
    </div>
    <script src="https://cdn.jsdelivr.net/gh/yourusername/booking-widget-cdn@v1.0.0/dist/widget/booking-widget.umd.js"></script>
</body>
</html>
```

**6.3 Monitor jsDelivr Stats (Optional)**
Visit: `https://www.jsdelivr.com/package/gh/yourusername/booking-widget-cdn`
- View download statistics
- Monitor usage and performance
- Check which versions are being used

#### Step 7: Update Your Documentation

**7.1 Update Integration Examples**
Replace all local references in your documentation:
```html
<!-- OLD: Local development -->
<script src="./dist/widget/booking-widget.umd.js"></script>

<!-- NEW: Production CDN -->
<script src="https://cdn.jsdelivr.net/gh/yourusername/booking-widget-cdn@v1.0.0/dist/widget/booking-widget.umd.js"></script>
```

**7.2 Share CDN URLs**
Provide these URLs to your clients:

```html
<!-- Latest version (auto-updates) -->
<script src="https://cdn.jsdelivr.net/gh/yourusername/booking-widget-cdn@latest/dist/widget/booking-widget.umd.js"></script>

<!-- Specific version (recommended for production) -->
<script src="https://cdn.jsdelivr.net/gh/yourusername/booking-widget-cdn@v1.0.0/dist/widget/booking-widget.umd.js"></script>

<!-- Major version (gets patches but no breaking changes) -->
<script src="https://cdn.jsdelivr.net/gh/yourusername/booking-widget-cdn@v1/dist/widget/booking-widget.umd.js"></script>
```

#### 🔄 Future Updates Process

**For New Releases:**
1. Make changes to your widget
2. Update version in `package.json`
3. Build: `npm run build:widget`
4. Test locally
5. Commit changes: `git add . && git commit -m "Release v1.0.1: Bug fixes"`
6. Tag: `git tag -a v1.0.1 -m "Bug fix release"`
7. Push: `git push origin main && git push origin v1.0.1`
8. Create GitHub release
9. Wait 5-10 minutes for jsDelivr to update
10. Test new CDN URL

**Semantic Versioning Guide:**
- `v1.0.1` - Bug fixes (safe to auto-update)
- `v1.1.0` - New features (backward compatible)
- `v2.0.0` - Breaking changes (manual update required)

### ✅ Deployment Checklist

**Before Tagging:**
- [ ] Widget builds successfully (`npm run build:widget`)
- [ ] Local testing passes (`npx serve dist`)
- [ ] All features work in demo.html
- [ ] README.md is updated with correct URLs
- [ ] Version number updated in package.json

**After Deployment:**
- [ ] jsDelivr URL returns HTTP 200
- [ ] Widget loads in test HTML page
- [ ] All functionality works via CDN
- [ ] GitHub release created with proper documentation
- [ ] Client documentation updated with new CDN URLs

**Troubleshooting:**
- **404 Error**: Wait 10 minutes, jsDelivr needs time to cache
- **CORS Error**: Check your API server CORS settings
- **Widget Won't Load**: Verify the file path matches your build output
- **Old Version Loading**: Use specific version tags, not `@latest`

**Using unpkg (npm-based CDN):**
1. Publish to npm: `npm publish`
2. Widget available at:
   ```
   https://unpkg.com/your-widget-name@1.0.0/dist/widget/booking-widget.umd.js
   ```

#### Option 2: Static File Hosting

**Netlify (Free Tier Available):**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build your project
npm run build:widget

# Deploy to Netlify
netlify deploy --dir=dist --prod
```
Your widget will be available at: `https://your-app-name.netlify.app/widget/booking-widget.umd.js`

**Vercel (Free Tier Available):**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```
Widget URL: `https://your-app-name.vercel.app/widget/booking-widget.umd.js`

**GitHub Pages:**
1. Enable GitHub Pages in your repository settings
2. Set source to "GitHub Actions" or "Deploy from a branch"
3. Widget URL: `https://yourusername.github.io/your-repo/dist/widget/booking-widget.umd.js`

#### Option 3: Self-Hosted Server

**Using Your Own Web Server:**
```bash
# Build the widget
npm run build:widget

# Upload dist/widget/ folder to your web server
# Make it accessible at: https://yourdomain.com/widget/booking-widget.umd.js
```

**Using Cloud Storage:**
- **AWS S3**: Upload to S3 bucket with public read access + CloudFront CDN
- **Google Cloud Storage**: Upload with public access + Cloud CDN
- **Azure Blob Storage**: Upload with public container + Azure CDN

### 🔧 Production Configuration

#### 1. Update Your Demo Files
After deployment, update your HTML to use the production URL:

```html
<!-- Replace local reference -->
<script src="./dist/widget/booking-widget.umd.js"></script>

<!-- With production CDN URL -->
<script src="https://your-cdn-url.com/booking-widget.umd.js"></script>
```

#### 2. CORS Configuration
Ensure your API server allows requests from your widget's domain:

```javascript
// Express.js example
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://your-cdn-url.com',
    // Add any domains where your widget will be embedded
  ]
}));
```

#### 3. Environment-Specific Builds
Create different builds for different environments:

```bash
# Development build (with debugging)
NODE_ENV=development npm run build:widget

# Production build (optimized)
NODE_ENV=production npm run build:widget
```

### 📋 Production Deployment Checklist

**Pre-Deployment:**
- [ ] Widget works correctly in local environment
- [ ] All API endpoints are accessible and working
- [ ] Error handling is implemented and tested
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility tested

**Deployment Setup:**
- [ ] Production build created (`npm run build:widget`)
- [ ] Widget files uploaded to hosting service
- [ ] CDN/hosting URL is publicly accessible
- [ ] HTTPS enabled on hosting service
- [ ] CORS properly configured on API server

**Post-Deployment:**
- [ ] Widget loads correctly from production URL
- [ ] API calls work from production environment
- [ ] Test booking flow end-to-end
- [ ] Monitor for any console errors
- [ ] Set up error monitoring/logging

### 🌍 Distribution Strategy

#### For Single Client
```html
<!-- Direct embed with your production URL -->
<script src="https://your-cdn.com/booking-widget.js"></script>
```

#### For Multiple Clients (White-label)
Create a configuration endpoint:
```javascript
// Your API can serve client-specific configuration
// GET https://yourapi.com/api/v1/widget-config/{clientId}
{
  "apiUrl": "https://yourapi.com/api/v1",
  "tenantId": "client-specific-id",
  "theme": "light",
  "primaryColor": "#1677ff"
}
```

#### For Marketplace Distribution
Package as an npm module:
```json
{
  "name": "@yourcompany/booking-widget",
  "version": "1.0.0",
  "main": "dist/widget/booking-widget.umd.js",
  "files": ["dist/"]
}
```

### 🚀 Scaling Considerations

**CDN Benefits:**
- **Global distribution**: Faster loading worldwide
- **High availability**: 99.9%+ uptime
- **Bandwidth**: Handles high traffic automatically
- **Caching**: Reduces server load

**Performance Optimization:**
```bash
# Minimize bundle size
npm run build:widget -- --analyze

# Enable gzip compression on your server
# Widget should be ~50-100KB gzipped
```

**Version Management:**
```bash
# Semantic versioning for updates
git tag v1.0.1
git push origin v1.0.1

# Users can pin to specific versions
https://cdn.jsdelivr.net/gh/user/repo@v1.0.1/dist/widget/booking-widget.umd.js
```

### 🔍 Monitoring & Analytics

**Error Monitoring:**
```javascript
// Add to your widget initialization
window.BookingWidgetConfig = {
  onError: function(error) {
    // Send to error monitoring service
    fetch('https://your-monitoring.com/errors', {
      method: 'POST',
      body: JSON.stringify({
        error: error.message,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      })
    });
  }
};
```

**Usage Analytics:**
```javascript
window.BookingWidgetConfig = {
  onLoad: function(widgetId) {
    // Track widget loads
    analytics.track('Widget Loaded', { widgetId });
  },
  onBookingComplete: function(bookingData) {
    // Track successful bookings
    analytics.track('Booking Completed', {
      serviceType: bookingData.service?.name,
      value: bookingData.service?.price
    });
  }
};
```

### 📞 Support & Maintenance

**Documentation for Clients:**
Create a simple integration guide:
```markdown
# Integration Guide

## Quick Setup
1. Add this code where you want the booking widget:
   ```html
   <div id="booking-widget"
        data-tenant-id="YOUR_ID_HERE"
        data-api-url="https://yourapi.com/api/v1"></div>
   <script src="https://your-cdn.com/booking-widget.js"></script>
   ```

## Support
- Email: support@yourcompany.com
- Documentation: https://your-site.com/docs
```

**Update Process:**
1. Test changes locally
2. Build production version
3. Deploy to staging environment
4. Test in staging
5. Deploy to production CDN
6. Update version numbers
7. Notify clients of updates (if breaking changes)

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