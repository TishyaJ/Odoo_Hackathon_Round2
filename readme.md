# 📦 RentalPro – Peer-to-Peer Rental Marketplace
Team members : Yuvraj Singh , Tishya Jha

video link : https://drive.google.com/drive/folders/10HMccEHxnx-ypVKNR3WctD6sNv26-1bC

A **modern, full-stack rental platform** connecting item owners with renters through a seamless booking experience. Built with cutting-edge technologies for scalability, RentalPro enables users to list, discover, and rent items with secure payments and full management tools.

---

## 🎯 Core Features

### 🔐 Authentication & User Management
- Multi-factor authentication with OTP verification
- Google OAuth login
- Role-based access control (Customer, Admin)
- Profile management with Cloudinary image uploads
- Secure JWT token-based sessions

### 📦 Product Management
- Dynamic product listings with rich media support
- Category-based organization with custom icons
- Advanced search & filtering (price, location, availability)
- Cloudinary integration for image storage
- Flexible pricing models (hourly, daily, weekly, monthly)

### 📅 Booking System
- Real-time availability calendar
- Conflict-free scheduling
- Duration-based dynamic pricing & discounts
- Booking status tracking (reserved → confirmed → pickup → active → returned)
- Late fee calculation

### 💳 Payment Integration
- Stripe payment processing
- Secure payment intents
- Invoice generation with detailed breakdowns
- Service fee calculations
- Email notifications for payment confirmations

### 📊 Dashboard & Analytics
- Owner dashboard for listing management
- Admin dashboard for platform oversight
- User statistics & booking history
- Real-time notifications
- Wishlist functionality

### ⭐ Reviews & Feedback
- Product reviews with ratings
- Verified purchase badges
- Feedback system for platform improvement
- Sentiment analysis for feedback categorization

---

## 🛠 Technology Stack

### Frontend
- **React 18** + TypeScript
- Wouter (client-side routing)
- TanStack Query (state management)
- Tailwind CSS + shadcn/ui
- Framer Motion (animations)
- React Hook Form + Zod (form validation)

### Backend
- **Node.js** + Express.js
- TypeScript for type safety
- Drizzle ORM + PostgreSQL
- JWT authentication + bcrypt
- Stripe API (payments)
- SendGrid (email)
- Cloudinary (media storage)

### Database
- PostgreSQL (Neon serverless)
- Normalized schema with relations
- Indexed queries for performance
- Enum types for data consistency

---

## 🏗 Architecture Highlights

### Database Design
- Normalized schema with minimal redundancy
- Strong entity relationships
- Optimized indexes
- Constraint enforcement
- Audit trails for transactions

### API Design
- RESTful endpoints with consistent patterns
- Input validation at multiple layers
- Error handling with meaningful responses
- Rate limiting & security measures
- Transaction-safe operations

### Security
- Password hashing with bcrypt
- JWT token management
- CORS protection
- Input sanitization
- SQL injection prevention

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Razorpay account
- Cloudinary account
- SendGrid account 

### Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL=your_postgres_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
SENDGRID_API_KEY=your_sendgrid_key
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
