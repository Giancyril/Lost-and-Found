# Lost & Found System

A comprehensive lost and found management system built with modern web technologies, featuring AI-powered search, smart matching, and real-time notifications.

## Features

### Core Functionality
- **Item Reporting**: Users can report lost and found items with detailed descriptions, images, and location information
- **Smart Matching**: Automatic matching algorithm that connects lost items with found items based on location, category, and timeline
- **Claim Management**: Streamlined claim process with status tracking (Pending, Approved, Rejected)
- **User Authentication**: Secure user registration and login with JWT tokens
- **Role-Based Access**: Admin and user roles with different permission levels

### Advanced Features
- **AI-Powered Search**: Integration with Google Gemini AI for intelligent item search and matching
- **Real-time Notifications**: Email notifications for potential matches and claim status updates
- **Interactive Maps**: Location-based visualization using Leaflet maps with heat mapping
- **Bulletin Board**: Community bulletin for posting lost items with tips from other users
- **Archive System**: Automated archiving of stale items to keep the database clean
- **Audit Logging**: Comprehensive audit trail for all administrative actions

### User Experience
- **Responsive Design**: Mobile-first design using Tailwind CSS and Flowbite components
- **Dashboard Analytics**: Real-time statistics and analytics for administrators
- **Export Functionality**: Export data for reporting and analysis
- **Onboarding Tour**: Interactive tour for new users
- **Security Features**: Rate limiting, input validation, and security honeypot

## Tech Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL database
- **JWT** for authentication
- **bcrypt** for password hashing
- **Google Gemini AI** for intelligent search
- **Nodemailer** for email notifications
- **Zod** for schema validation

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Flowbite React** for UI components
- **Leaflet** for interactive maps
- **React Hook Form** for form handling
- **React Toastify** for notifications

### Testing
- **Jest** for backend testing
- **Vitest** for frontend testing
- **React Testing Library** for component testing
- **Property-based testing** with Fast-Check

## Project Structure

```
lost-and-found-main/
├── server/                 # Backend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── modules/    # Feature modules
│   │   │   ├── auth/       # Authentication
│   │   │   ├── midddlewares/ # Express middlewares
│   │   │   └── utils/      # Utility functions
│   │   └── prisma/         # Database schema
│   └── package.json
├── frontend/               # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── dashboard/      # Admin dashboard
│   │   └── store/          # Redux store
│   └── package.json
└── README.md
```

## Features in Detail

### Smart Matching Algorithm
- **Location-based matching**: Uses Haversine formula to calculate distances between lost and found item locations
- **Timeline validation**: Ensures found items are dated after lost items
- **Category matching**: Matches items within the same category
- **Deduplication**: Prevents duplicate notifications for the same item pair

### AI-Powered Search
- **Natural language processing**: Understands complex search queries
- **Semantic matching**: Goes beyond keyword matching to understand context
- **Fallback mechanism**: Gracefully falls back to text search if AI is unavailable
- **Reasoning explanations**: Provides explanations for search results

### Email Notifications
- **Smart match notifications**: Automatic emails when potential matches are found
- **Claim status updates**: Notifications for claim approvals/rejections
- **Customizable templates**: Professional email templates with branding
- **Rate limiting**: Prevents email spam

### Security Features
- **Input validation**: Comprehensive validation using Zod schemas
- **Rate limiting**: API rate limiting to prevent abuse
- **Authentication**: JWT-based authentication with secure password hashing
- **CORS protection**: Cross-origin request protection
- **Security honeypot**: Bot protection mechanisms