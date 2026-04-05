# TourEase - AI-Powered Tourism Management Platform

A comprehensive tourism management platform that provides intelligent insights and management tools for tourism authorities, attraction owners, and tourists.

## Features

### 🤖 AI Chat Assistant
- Intelligent tourism recommendations powered by Google Gemini AI
- Real-time database context integration
- Personalized suggestions for tourists
- Smart data insights for authorities

### 👥 User Management
- **Tourism Authorities**: Dashboard with analytics, visitor insights, and predictive forecasting
- **Attraction Owners**: Attraction management, visitor analytics, and performance tracking
- **Tourists**: Interactive attraction discovery, favorites, and AI-powered recommendations

### 📊 Analytics & Insights
- Real-time visitor statistics
- Revenue analytics and forecasting
- Attraction performance metrics
- Demographic insights and trends

### 🗺️ Interactive Features
- Interactive maps with Leaflet integration
- Attraction browsing with advanced filtering
- User profile management with image uploads
- Responsive design for all devices

## Tech Stack

### Backend
- **Node.js** with Express.js
- **Prisma ORM** with MySQL database
- **Google Gemini AI** for intelligent responses
- **JWT Authentication** for secure access
- **Multer** for file uploads

### Frontend
- **Next.js 15** with React 18
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Leaflet** for interactive maps

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL database
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/akramsu/E-Tourism.git
   cd tourease
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   
   # Optional: Install root workspace manager
   cd ..
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` files in both server and client directories:
   
   **Server (.env)**
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/tourease"
   JWT_SECRET="your-jwt-secret"
   GEMINI_API_KEY="your-gemini-api-key"
   ```
   
   **Client (.env.local)**
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5003"
   ```

4. **Database Setup**
   ```bash
   docker compose up -d mysql
   npm run db:mysql:setup
   ```

   This starts a local MySQL 8 container, resets the Prisma schema, and imports the mock data from [server/prisma/final_complete_mock_data.sql](server/prisma/final_complete_mock_data.sql).

5. **Start the Application**
   
   **Backend Server:**
   ```bash
   cd server
   npm run dev
   ```
   
   **Frontend Client:**
   ```bash
   cd client
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5003

## Authentication & User Access

### 🔐 User Roles & Sign-in Process

TourEase supports three distinct user roles with different access levels:

#### **Tourism Authorities** 🏛️
- **Access Level**: Full analytics dashboard, visitor insights, predictive forecasting
- **Registration**: Authority accounts are **restricted** and can only be created by existing administrators
- **Purpose**: Government tourism boards, municipal authorities, tourism departments

#### **Attraction Owners** 🏢
- **Access Level**: Attraction management, visitor analytics, performance tracking
- **Registration**: Open registration available through the sign-up process
- **Purpose**: Business owners, attraction managers, tour operators

#### **Tourists** 👥
- **Access Level**: Browse attractions, AI chat assistant, favorites, profile management
- **Registration**: Open registration available through the sign-up process
- **Purpose**: Visitors, travelers, tourists exploring the platform

### 🧪 Testing Credentials

For development and testing purposes, use these pre-configured accounts:

#### **Authority Account (Testing)**
```
Email: authority@gmail.com
Password: authority
Role: Tourism Authority
Access: Full dashboard, analytics, AI insights
```

#### **Tourist Account (Testing)**
```
Email: tourist@a.com
Password: [use standard registration or existing account]
Role: Tourist
Access: Attraction browsing, AI chat, favorites
```

#### **Owner Account (Testing)**
```
Email: owner@gmail.com
Password: [use standard registration or existing account]
Role: Attraction Owner
Access: Attraction management, analytics
```

### 📝 Registration Process

1. **For Tourists & Owners:**
   - Visit the application homepage
   - Click "Sign Up" button
   - Fill in required information (name, email, password, etc.)
   - Verify email if email verification is enabled
   - Choose role (Tourist or Attraction Owner)

2. **For Tourism Authorities:**
   - Authority accounts are restricted for security
   - Contact existing administrators for account creation
   - For testing: Use the provided testing credentials above

### 🔑 Authentication Features

- **JWT Token-based Authentication**: Secure session management
- **Role-based Access Control**: Different interfaces for each user type
- **Profile Management**: Update personal information and preferences
- **Password Security**: Encrypted password storage with bcrypt
- **Session Persistence**: Stay logged in across browser sessions

## 🤖 AI Features & Capabilities


### 🎯 AI Chat Assistant
**Smart tourism guidance through natural conversation**

- **For Tourists**: Personalized attraction recommendations, real-time insights, interactive guidance
- **For Authorities**: Data analysis, performance analytics, predictive insights, strategic recommendations  
- **For Owners**: Business intelligence, visitor insights, optimization suggestions, competitive analysis

**Benefits**: 24/7 availability, personalized responses, data-driven recommendations

### 📊 Predictive Analytics
**AI-powered forecasting and trend analysis**

- **Visitor Forecasting**: Predict future visitor numbers using historical data
- **Revenue Projections**: Financial forecasting for tourism planning
- **Seasonal Analysis**: Understand and predict seasonal patterns
- **Demand Prediction**: Forecast attraction popularity and capacity needs

**Benefits**: Better planning, optimized resource allocation, informed decision-making

### 🔍 Smart Recommendations
**Intelligent suggestion engine for all users**

- **Personalized Suggestions**: User behavior analysis and contextual recommendations
- **Business Intelligence**: Revenue optimization and operational insights
- **Dynamic Adaptation**: Continuously improving recommendations based on feedback
- **Natural Language Search**: Conversational search queries with semantic understanding

**Benefits**: Enhanced user experience, increased engagement, better business outcomes

### � Intelligent Insights
**Automated pattern recognition and analysis**

- **Pattern Recognition**: Identify trends in visitor behavior and preferences
- **Anomaly Detection**: Spot unusual patterns in tourism data
- **Performance Optimization**: AI suggestions for improving metrics
- **Market Analysis**: Tourism market dynamics and opportunities

**Benefits**: Data-driven insights, automated analysis, competitive intelligence

## Project Structure

```
tourease/
├── client/                 # Next.js frontend application
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── pages/            # Additional pages
│   ├── public/           # Static assets
│   ├── styles/           # Global styles
│   ├── types/            # TypeScript type definitions
│   └── package.json      # Frontend dependencies
├── server/                # Express.js backend application
│   ├── prisma/           # Database schema and migrations
│   ├── src/              # Source code
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic services
│   │   └── utils/        # Utility functions
│   └── package.json      # Backend dependencies
├── package.json          # Root workspace configuration
└── README.md             # Project documentation
```

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Attractions
- `GET /api/attractions` - List attractions
- `POST /api/attractions` - Create attraction (owners)
- `PUT /api/attractions/:id` - Update attraction
- `DELETE /api/attractions/:id` - Delete attraction

### AI Chat
- `POST /api/ai-chat/message` - Send message to AI assistant
- `GET /api/ai-chat/history` - Get chat history
- `GET /api/ai-chat/recommendations` - Get AI recommendations

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/visits` - Visitor analytics
- `GET /api/analytics/revenue` - Revenue analytics