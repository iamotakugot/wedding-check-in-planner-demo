# Performance Optimization Guide

## Code Splitting
- Admin pages ใช้ lazy loading
- Vendor libraries แยกเป็น chunks
- Bundle size optimization

## Firebase Optimization
- ใช้ `.indexOn` rules สำหรับ queries:
  - `rsvps`: uid, isComing, guestId
  - `guests`: rsvpUid, rsvpId, groupId, zoneId, tableId, checkedInAt
  - `zones`: order
  - `tables`: zoneId, order
- Limit data ที่ fetch
- ใช้ offline persistence
- Debounce สำหรับ frequent updates (drag operations, state updates)

## Mobile Optimization
- Facebook Messenger WebView compatibility
- Touch-friendly UI
- Responsive design
- Optimize images (lazy loading, WebP)

## Bundle Size
- Current: ~1.6MB (minified)
- Target: < 500KB per chunk
- Use dynamic imports
- Tree-shaking enabled

## Caching Strategy
- Cache static data (config, zones, tables)
- Service worker สำหรับ offline support
- Stale-while-revalidate pattern

