# Story 6.5: Real-time Updates with Socket.IO

**Epic**: 6 - Engagement Features  
**Status**: Ready  
**Priority**: High  
**Story Points**: 8

## Story
**As a** wedding guest,  
**I want** to see likes dan comments update in real-time,  
**so that** saya can feel connected to wedding community.

## Acceptance Criteria
- [ ] Socket.IO server setup dengan Next.js 15
- [ ] Room-based connections per event gallery
- [ ] Real-time like count updates
- [ ] Real-time new comments display
- [ ] Connection status indicators
- [ ] Auto-reconnection handling
- [ ] Efficient room management
- [ ] Mobile network optimization
- [ ] Connection pooling for multiple guests
- [ ] Graceful fallback to polling if WebSocket fails

## Technical Implementation

### Tasks
- [ ] Setup Socket.IO server API route
- [ ] Create Socket.IO client provider
- [ ] Implement room-based connections
- [ ] Add real-time like broadcasts
- [ ] Add real-time comment broadcasts
- [ ] Create connection status UI
- [ ] Implement auto-reconnection
- [ ] Add fallback polling mechanism
- [ ] Optimize for mobile networks
- [ ] Write integration tests

### Files to Create/Modify
1. `app/api/socket/route.ts` - Socket.IO server
2. `lib/socket/socket-server.ts` - Server logic
3. `lib/socket/socket-client.ts` - Client utilities
4. `components/providers/SocketProvider.tsx`
5. `hooks/useSocket.ts` - Socket connection hook
6. `hooks/useRealtimeLikes.ts` - Real-time likes
7. `hooks/useRealtimeComments.ts` - Real-time comments

## Dev Agent Record

### Agent Model Used
- Claude 3.5 Sonnet

### Debug Log References
None

### Completion Notes
None

### Change Log
None

### File List
None
