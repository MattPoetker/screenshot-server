# Next.js Migration Plan

## Current Architecture
- Express.js server with API routes
- Static HTML frontend with vanilla JavaScript
- SQLite database with custom models
- Custom authentication with JWT
- Puppeteer screenshot functionality
- Tailwind CSS for styling

## Target Next.js Architecture

### 1. Project Structure
```
screenshot-app/
├── src/
│   ├── app/                    # App Router (Next.js 13+)
│   │   ├── globals.css         # Tailwind CSS
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Dashboard home
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Dashboard overview
│   │   │   ├── api-keys/
│   │   │   │   └── page.tsx    # API Keys management
│   │   │   ├── screenshots/
│   │   │   │   └── page.tsx    # Screenshots gallery
│   │   │   └── analytics/
│   │   │       └── page.tsx    # Analytics page
│   │   └── api/                # API Routes
│   │       ├── auth/
│   │       │   └── route.ts    # Authentication
│   │       ├── admin/
│   │       │   ├── api-keys/
│   │       │   │   └── route.ts
│   │       │   ├── dashboard/
│   │       │   │   └── route.ts
│   │       │   └── screenshots/
│   │       │       └── route.ts
│   │       └── screenshot/
│   │           └── route.ts    # Main screenshot API
│   ├── components/             # React Components
│   │   ├── ui/                 # Base UI components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── modals/             # Modal components
│   │   └── forms/              # Form components
│   ├── lib/                    # Utilities and config
│   │   ├── db/                 # Database utilities
│   │   ├── auth/               # Auth utilities
│   │   ├── screenshot/         # Screenshot logic
│   │   └── utils.ts            # General utilities
│   └── types/                  # TypeScript types
├── public/                     # Static assets
├── database/                   # SQLite database
└── uploads/                    # Screenshot storage
```

### 2. Key Technologies
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** (already configured)
- **NextAuth.js** for authentication
- **React Hook Form** for form handling
- **Zustand** for state management
- **React Query** for data fetching
- **Puppeteer** (migrated to lib/)

### 3. Migration Steps

#### Phase 1: Setup & Foundation
1. Create new Next.js project alongside existing Express app
2. Configure TypeScript and Tailwind CSS
3. Set up basic project structure

#### Phase 2: Database & Models
1. Move database files and models to Next.js lib/
2. Create database utilities for Next.js API routes
3. Test database connectivity

#### Phase 3: API Routes Migration
1. Convert Express routes to Next.js API routes
2. Migrate authentication system
3. Test all API endpoints

#### Phase 4: Frontend Migration
1. Convert HTML pages to Next.js pages/components
2. Migrate JavaScript logic to React components
3. Implement state management

#### Phase 5: Screenshot Functionality
1. Migrate Puppeteer logic to Next.js API route
2. Set up file handling for screenshot storage
3. Test screenshot generation

#### Phase 6: Authentication & Security
1. Implement NextAuth.js
2. Set up protected routes
3. Migrate JWT functionality

#### Phase 7: Testing & Optimization
1. Test all functionality end-to-end
2. Optimize performance
3. Add error handling

## Migration Benefits

### Developer Experience
- **TypeScript** - Better type safety and IDE support
- **Hot reloading** - Faster development cycle
- **Component-based** - Reusable UI components
- **Built-in optimization** - Image optimization, code splitting

### Performance
- **Server-side rendering** - Faster initial page loads
- **Static generation** - Better SEO and performance
- **Automatic code splitting** - Smaller bundle sizes
- **Built-in optimizations** - Image, font, and script optimization

### Scalability
- **API routes** - Serverless-ready API endpoints
- **Middleware** - Request/response processing
- **Edge runtime** - Deploy to edge locations
- **Vercel integration** - Easy deployment

### User Experience
- **Client-side routing** - Faster navigation
- **Progressive enhancement** - Works without JavaScript
- **Better error boundaries** - Graceful error handling
- **Loading states** - Better UX with suspense

## Risk Mitigation

1. **Parallel Development** - Keep Express app running during migration
2. **Incremental Migration** - Migrate features one by one
3. **Database Compatibility** - Use same SQLite database
4. **API Compatibility** - Maintain same API endpoints
5. **Backup Strategy** - Full backup before migration starts

## Timeline Estimate
- **Phase 1-2**: 2-3 hours (Setup & Database)
- **Phase 3**: 2-3 hours (API Migration)
- **Phase 4**: 3-4 hours (Frontend Migration)
- **Phase 5**: 1-2 hours (Screenshot Migration)
- **Phase 6**: 1-2 hours (Auth Migration)
- **Phase 7**: 1-2 hours (Testing)

**Total**: ~10-16 hours for complete migration