# Booking Widget

A modern, responsive booking widget built with React, TypeScript, and Ant Design. This application provides a multi-step booking flow for appointment scheduling with real-time availability and notifications.

## Features

- **Multi-step booking flow**: Service selection → Date/Time → Personal Info → Summary
- **Real-time availability**: Dynamic time slot management
- **Responsive design**: Works on desktop and mobile devices
- **Form validation**: Built-in validation for all user inputs
- **Notifications**: Toast notifications for user feedback
- **API integration**: Backend integration for booking management

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Ant Design** - UI component library
- **Axios** - HTTP client
- **date-fns/dayjs** - Date manipulation
- **Sonner** - Toast notifications

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── App/                    # Main app component
│   ├── booking/               # Booking-related components
│   │   ├── AppointmentBookingForm.tsx  # Main booking form
│   │   ├── api.ts             # API functions
│   │   ├── types.ts           # TypeScript types
│   │   ├── functions.ts       # Utility functions
│   │   ├── use-notifications.ts # Notification hooks
│   │   └── steps/             # Individual form steps
│   │       ├── ServiceStep.tsx
│   │       ├── DateTimeStep.tsx
│   │       ├── PersonalInfoStep.tsx
│   │       └── SummaryStep.tsx
│   └── types/                 # Global type definitions
└── styles/                    # CSS styles
```

## Key Files

- **`src/components/booking/AppointmentBookingForm.tsx`** - Main booking form component
- **`src/components/booking/api.ts`** - API integration functions
- **`src/components/booking/types.ts`** - TypeScript interfaces for booking data
- **`src/components/booking/steps/`** - Individual step components for the booking flow
- **`src/styles/App.css`** - Main application styles
