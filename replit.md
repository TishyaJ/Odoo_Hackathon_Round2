# RentalPro - Smart Rental Platform

## Overview

RentalPro is a full-stack rental platform that enables users to rent out their unused items or find equipment for short-term use. The application features role-based access control with customers (who can list items or rent items) and administrators who manage the platform. The system includes dynamic pricing based on rental duration, real-time availability checking, Stripe payment integration, and Cloudinary for image management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using React with TypeScript and follows a component-based architecture:
- **Routing**: Uses Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management with custom query client
- **UI Framework**: Radix UI components with Tailwind CSS for styling
- **Form Handling**: React Hook Form with Zod validation
- **Component Structure**: Organized into pages, components, and UI components following atomic design principles

### Backend Architecture
The backend uses Express.js with TypeScript and follows a layered architecture:
- **API Layer**: RESTful endpoints with Express routers
- **Database Layer**: Drizzle ORM with PostgreSQL using Neon serverless connection
- **Authentication**: Replit Auth integration with session-based authentication
- **File Structure**: Separation of concerns with dedicated modules for routes, storage, and database connections

### Database Design
Uses PostgreSQL with Drizzle ORM for type-safe database operations:
- **Core Entities**: Users, Products, Categories, Bookings, Product Pricing, Notifications
- **Enums**: User roles (customer/admin), booking statuses, duration types
- **Relationships**: Foreign key relationships between entities with proper indexing
- **Session Storage**: Dedicated sessions table for Replit Auth

### Authentication & Authorization
- **Authentication Provider**: Replit's OpenID Connect (OIDC) integration
- **Session Management**: PostgreSQL-backed session store with configurable TTL
- **Role-Based Access**: Customer and Admin roles with different UI flows and API permissions
- **Security**: HTTP-only cookies, secure session handling, and CSRF protection

### Payment Processing
- **Payment Provider**: Stripe integration in test mode
- **Webhook Handling**: Secure webhook processing for payment confirmations
- **Pricing Logic**: Dynamic pricing based on rental duration (hourly, daily, weekly, monthly)
- **Late Fees**: Automatic calculation of 5% daily penalty for overdue returns

### File Storage & Media
- **Image Storage**: Cloudinary integration for product photo uploads
- **Upload Strategy**: Signed upload URLs for secure client-side uploads
- **File Processing**: Automatic image optimization and transformation via Cloudinary

### Real-time Features
- **Availability Checking**: Real-time stock management and booking conflicts prevention
- **Notifications**: Database-driven notification system for booking updates
- **Dynamic Pricing**: Live price calculations based on rental duration and demand

## External Dependencies

### Database & Infrastructure
- **Neon PostgreSQL**: Serverless PostgreSQL database with connection pooling
- **Drizzle ORM**: Type-safe database operations and migrations
- **Connect-PG-Simple**: PostgreSQL session store for Express sessions

### Authentication & Security
- **Replit Auth**: OpenID Connect provider for user authentication
- **OpenID-Client**: OIDC client library for authentication flows
- **Passport.js**: Authentication middleware for Express
- **bcryptjs**: Password hashing (if needed for additional security)

### Payment Processing
- **Stripe**: Payment processing with webhook integration
- **@stripe/stripe-js**: Client-side Stripe integration
- **@stripe/react-stripe-js**: React components for Stripe Elements

### File Storage & Media
- **Cloudinary**: Cloud-based image and video management
- **Multer**: Middleware for handling multipart/form-data uploads

### Frontend Libraries
- **React**: UI library with TypeScript support
- **Wouter**: Lightweight client-side routing
- **TanStack React Query**: Server state management and caching
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form state management
- **Zod**: Runtime type validation
- **date-fns**: Date manipulation utilities

### Development & Build Tools
- **Vite**: Frontend build tool and development server
- **ESBuild**: Fast bundler for backend code
- **TypeScript**: Static type checking
- **PostCSS**: CSS processing with Autoprefixer