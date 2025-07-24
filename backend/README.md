# Team Ovistra Backend

AI-powered video editing backend service for Adobe Premiere Pro CEP plugin.

## Tech Stack

### Core
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Cache**: Redis 7+
- **Real-time**: Socket.io

### AI/ML
- **Primary**: OpenAI API
- **Korean Models**: Naver CLOVA, Kakao Karlo
- **Video Processing**: FFmpeg

### DevOps
- **Container**: Docker
- **CI/CD**: GitHub Actions
- **Monitoring**: Winston logging
- **Testing**: Jest + Supertest

## Architecture

```
backend/
├── src/
│   ├── api/          # REST API routes
│   ├── services/     # Business logic
│   ├── models/       # Database models
│   ├── middleware/   # Express middleware
│   ├── utils/        # Utility functions
│   ├── config/       # Configuration
│   └── types/        # TypeScript types
├── tests/            # Test files
├── prisma/           # Database schema
└── docker/           # Docker configuration
```

## Getting Started

```bash
# Install dependencies
npm install

# Setup database
npm run db:setup

# Run development server
npm run dev

# Run tests
npm test
```

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ovistra

# Redis
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your-key
NAVER_CLIENT_ID=your-id
NAVER_CLIENT_SECRET=your-secret

# Security
JWT_SECRET=your-secret
ENCRYPTION_KEY=your-key
```

## API Documentation

API documentation is available at `/api/docs` when running in development mode.