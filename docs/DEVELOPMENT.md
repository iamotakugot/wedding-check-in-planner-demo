# Development Guide

## Code Review Checklist
- [ ] ตรวจสอบ infinite loops (useEffect dependencies)
- [ ] ตรวจสอบ memory leaks (cleanup functions)
- [ ] ตรวจสอบ type safety
- [ ] ตรวจสอบ error handling
- [ ] ตรวจสอบ performance (debounce, memoization)

## Testing Guidelines
- Manual testing สำหรับ critical flows
- Test mobile compatibility (Facebook Messenger browser)
- Test realtime sync (Card ↔ Admin)
- Test error scenarios

## Deployment Process
1. `npm run build`
2. ตรวจสอบ build errors
3. `firebase deploy`
4. Monitor errors และ performance

## Troubleshooting

### Infinite Loops
- ตรวจสอบ useEffect dependencies
- ใช้ useRef สำหรับ values ที่ไม่ต้องการ trigger re-render
- ใช้ functional updates สำหรับ state

### Memory Leaks
- ตรวจสอบ cleanup functions ใน useEffect
- Unsubscribe Firebase listeners
- Remove event listeners

### Performance Issues
- ใช้ React DevTools Profiler
- ตรวจสอบ bundle size
- ใช้ code splitting
- Optimize Firebase queries

