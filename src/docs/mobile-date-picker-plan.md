# Mobile Date Picker Plan

## Overview
The goal is to enhance the date and time selection in the booking widget to be mobile-friendly by using antd-mobile components on mobile devices while retaining antd components on desktop. This will involve installing new dependencies, implementing device detection, conditional rendering, and ensuring the locale is English with dates starting from today.

## Prerequisites
- The project uses React, antd, and dayjs (already installed).
- Current implementation is in [`src/components/booking/steps/DateTimeStep.tsx`](src/components/booking/steps/DateTimeStep.tsx:1).
- antd-mobile and react-responsive are not installed, so they need to be added.

## Step-by-Step Plan

1. **Install Dependencies**
   - Install `antd-mobile` for mobile-optimized components.
   - Install `react-responsive` for media query-based device detection.

2. **Device Detection**
   - Use `useMediaQuery` from react-responsive to detect mobile devices (e.g., screen width <= 768px).

3. **Conditional Rendering in DateTimeStep.tsx**
   - Import components from antd-mobile (DatePicker and TimePicker).
   - Use the media query to render:
     - On desktop: Existing antd DatePicker and TimePicker.
     - On mobile: antd-mobile DatePicker and TimePicker.
   - Ensure both use dayjs for formatting and handle changes similarly.
   - Implement disabled dates to start from today (similar to current `disabledDate` function).

4. **Locale Configuration**
   - For antd: Wrap with ConfigProvider and set locale to `enUS` (import from 'antd/locale').
   - For antd-mobile: It defaults to English, but confirm and set if needed via its ConfigProvider.

5. **Form Integration**
   - Retain antd's Form for consistency, but ensure mobile components integrate well (may need to handle values manually if incompatibilities arise).

6. **Styling Adjustments**
   - Update [`src/styles/widget.css`](src/styles/widget.css:1) if needed for mobile-specific styles to ensure the pickers look good on smaller screens.

7. **Testing**
   - Test on desktop: Should use antd components, English locale, dates from today.
   - Test on mobile (emulator or device): Should switch to antd-mobile, same locale and date constraints.
   - Verify form values are correctly set and validated.

## Potential Risks and Mitigations
- **Compatibility Issues:** antd-mobile might not perfectly integrate with antd's Form. Mitigation: Handle onChange manually and set form fields.
- **Performance:** Adding new libraries – ensure bundle size is optimized (vite handles this).
- **Locale Consistency:** If antd-mobile needs explicit locale, add it.
- **Time Selection:** Confirm antd-mobile has TimePicker; if not, use Picker with time columns.

## Mermaid Diagram: Component Structure

```mermaid
graph TD
    A[DateTimeStep Component] --> B[useMediaQuery(isMobile: max-width 768px)]
    B -->|Yes| C[Render antd-mobile DatePicker & TimePicker]
    B -->|No| D[Render antd DatePicker & TimePicker]
    C --> E[Handle Date/Time Changes with dayjs]
    D --> E
    E --> F[Update Form Values]
    F --> G[Disable Past Dates]
    A --> H[ConfigProvider for English Locale]