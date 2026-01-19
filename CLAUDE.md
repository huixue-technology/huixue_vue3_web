# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
# Development
yarn serve          # Start dev server (localhost:8080)

# Production
yarn build          # Build for production
yarn lint           # Run ESLint + TypeScript checking

# API
yarn openapi        # Generate TypeScript types from OpenAPI spec
```

## Project Overview

**Huixue (慧学)** is a Vue3 educational grading and analysis system serving both students and teachers. It provides grade tracking, comparative analysis, performance simulation, and a gamified challenge system.

## Tech Stack

- Vue 3.4.21 with Composition API
- Pinia 3.0.2 (state management)
- Vue Router 4.3.0
- Ant Design Vue 4.2.6
- ECharts 5.6.0 + vue-echarts 7.0.3 (data visualization)
- umi-request 1.4.0 (axios-based HTTP client)
- TypeScript

## Architecture

### Role-Based Access Control

The application has dual roles determined by user identity length:
- **Students** (`role.length === 10`): Can view grades, compare with peers, access challenges
- **Teachers**: Full access to class management, grade analysis, and comparison tools

Navigation is dynamically rendered based on role. NavBar is hidden on authentication pages (`/login`, `/register`).

### API Layer

Located in `src/servers/api/`, organized by domain:
- Modular structure: `user.ts`, `grade.ts`, `student.ts`, `exam.ts`, etc.
- Centralized API client with interceptors
- Dev proxy configured to `http://111.228.38.111:5000` (see [vue.config.js:14-22](vue.config.js#L14-L22))

### State Management

Pinia stores in `src/store/modules/`:
- User authentication state (`user.ts`) persists to localStorage
- Auto-initialization from localStorage on app startup
- Stores reactive state accessible across components

### Directory Structure

```
src/
├── components/      # Reusable Vue components
├── composables/     # Composition API utilities (e.g., useLogout)
├── layout/         # Layout components (NavBar)
├── locales/        # i18n (8+ languages supported)
├── servers/api/    # API service layer
├── store/          # Pinia stores
└── views/          # Page components by feature
    ├── challenge/   # Student challenge system
    ├── compare/     # Grade comparison tools
    ├── grade/       # Grade analysis dashboard
    ├── student/     # Student features
    └── teacher/     # Teacher features
```

### Path Aliases

Use `@` for src directory imports (configured in [vue.config.js:7-11](vue.config.js#L7-L11)):
```typescript
import Something from '@/components/...'
```

### Key Features

1. **Grade Analysis**: Dashboard-style interface with data cards and ECharts visualizations
2. **Comparative Analysis**: Student vs student, class vs class comparisons
3. **Challenge System**: Gamified peer challenges
4. **Performance Simulation**: Predict future performance
5. **Multi-language**: 8+ language support via locales
6. **Real-time Countdown**: Live countdown to college entrance exam (高考)
