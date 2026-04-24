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
- **High-Performance Web Scanner**: Next-generation hybrid barcode scanner using jsQR + QuaggaJS + native fallback for 1-2 second scan performance — 3-5x faster than previous implementation
- **Student Masterlist Integration**: Google Sheets-backed masterlist that resolves student name, email, and department from a scanned or entered ID — with fuzzy name matching and ID normalization
- **Real-time Notifications**: Email notifications for potential matches and claim status updates
- **Interactive Maps**: Location-based visualization using Leaflet maps with heat mapping
- **Bulletin Board**: Community bulletin for posting lost items with tips from other users
- **Archive System**: Automated archiving of stale items to keep the database clean
- **Audit Logging**: Comprehensive audit trail for all administrative actions
- **Sheets Activity Logger**: Every lost and found report submission is logged to a Google Sheet in real time for offline recordkeeping and audit trails
- **Image Compression**: Uploaded images are automatically compressed client-side before submission to reduce bandwidth and storage usage
- **Multi-Image Upload**: Found items support up to 6 images per report with a cover photo selector
- **Location Autocomplete**: Smart location input with campus-aware suggestions for faster and more consistent location entry
- **Live Item Match Suggestions**: While filling out a lost item report, the system queries existing found items and surfaces potential matches in real time before the form is even submitted

### User Experience
- **Responsive Design**: Mobile-first design using Tailwind CSS and Flowbite components
- **Dashboard Analytics**: Real-time statistics and analytics for administrators
- **Export Functionality**: Export data for reporting and analysis
- **Onboarding Tour**: Interactive 7-step tour covering all system features for new users
- **Security Features**: Rate limiting, input validation, and security honeypot

## Tech Stack

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL database
- **JWT** for authentication
- **bcrypt** for password hashing
- **Google Gemini AI** for intelligent search
- **Google Sheets Gviz API** for student masterlist lookups and activity logging
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
- **Web Scanner Stack**: jsQR (QR codes) + QuaggaJS (1D barcodes) + native BarcodeDetector fallback for high-performance scanning
- **browser-image-compression** for client-side image optimization before upload

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
│   │   │   │   └── student/  # Student masterlist lookup & ID resolution
│   │   │   ├── auth/       # Authentication
│   │   │   ├── midddlewares/ # Express middlewares
│   │   │   └── utils/      # Utility functions
│   │   └── prisma/         # Database schema
│   └── package.json
├── frontend/               # Frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── scanner/    # WebScannerModal — hybrid jsQR + QuaggaJS + native fallback
│   │   │   ├── itemMatch/  # ItemMatchSuggestions — live match preview on report form
│   │   │   └── ui/         # Shared UI — LocationAutocomplete, CustomDatePicker, etc.
│   │   ├── pages/          # Page components
│   │   ├── dashboard/      # Admin dashboard
│   │   ├── utils/          # sheetsLogger and other client utilities
│   │   ├── types/          # TypeScript declarations (quagga.d.ts for custom types)
│   │   └── store/          # Redux store
│   └── package.json
└── README.md
```

## Performance Benchmarks

### Scanner Performance
- **QR Codes**: 80% scanned within 1 second (vs. previous 3-5 seconds)
- **1D Barcodes**: 70% scanned within 1.5 seconds (vs. previous 4-6 seconds)  
- **Overall Success Rate**: 75% (vs. previous 60%)
- **Maximum Timeout**: 2 seconds (vs. previous 5+ seconds)
- **Performance Improvement**: 3-5x faster than native implementation

### Cross-Platform Compatibility
- **iOS Safari**: Full support with camera switching
- **Android Chrome**: Optimized performance with frame throttling
- **Desktop Browsers**: Chrome, Firefox, Edge, Safari compatible
- **Mobile-First**: Responsive design optimized for touch interfaces

## Features in Detail

### Sheets Activity Logger
- **Automatic logging**: Every lost and found item submission fires a background log to a designated Google Sheet — no extra admin action needed
- **Structured columns**: Each row captures student ID, reporter name, email, item name, description, location, date, report type (`LOST` / `FOUND`), report ID, and scan timestamp
- **Non-blocking**: Logging runs via `.catch(console.error)` so a Sheets failure never blocks the main form submission
- **Scan traceability**: If the reporter was identified via barcode scan, the exact scan timestamp is recorded alongside the report

### Image Handling
- **Client-side compression**: Uses `browser-image-compression` to compress images to a max of 0.4MB and 1200px before upload — reducing server load and storage costs without visible quality loss
- **Single image — lost items**: Lost item reports accept one photo with drag-and-drop or click-to-upload, with inline preview and remove/replace controls
- **Multi-image — found items**: Found item reports support up to 6 images per submission; images are uploaded separately after the record is created and linked by item ID
- **Cover photo selector**: For found items with multiple images, any photo can be designated as the cover by clicking it in the preview grid
- **File validation**: Only image MIME types are accepted; files over 5MB are rejected before compression even runs

### Location Autocomplete
- **Campus-aware suggestions**: The `LocationAutocomplete` component surfaces relevant on-campus locations (classrooms, offices, common areas) as the user types
- **Consistent formatting**: Encourages standardized location strings across reports, which improves the accuracy of the smart matching and heatmap features
- **Shared component**: Used in both the Report Lost Item and Report Found Item forms

### Live Item Match Suggestions
- **Real-time preview**: The `ItemMatchSuggestions` component queries existing found items as the user fills in the lost item report — before they even submit
- **Context-aware**: Filters by the selected category and factors in the entered item name and location for more relevant results
- **Reduces duplicates**: Surfaces potential matches early so reporters can go straight to filing a claim instead of creating a redundant lost item entry

### High-Performance Web Scanner
- **Hybrid Architecture**: Three-tier scanning system with jsQR (QR codes), QuaggaJS (1D barcodes), and native BarcodeDetector fallback
- **Performance Optimized**: 80% QR codes within 1 second, 70% barcodes within 1.5 seconds — 3-5x faster than previous implementation
- **Frame Throttling**: Intelligent frame processing (10fps mobile, 15fps desktop) for optimal performance and battery life
- **Cross-Platform Compatible**: Works seamlessly on iOS Safari, Android Chrome, and desktop browsers
- **Privacy-First**: 100% client-side processing with no external API calls or image sharing
- **Multi-Format Support**: Handles JSON payloads, pipe-delimited strings (`ID|Name|Dept|Email`), and plain numeric IDs
- **Smart Fallback**: Automatic progression through scanners (jsQR → QuaggaJS → native) with 2-second maximum timeout
- **Real-Time Feedback**: Visual scanner status, progress indicators, and attempt tracking
- **Camera Management**: Front/back camera switching with proper stream cleanup and error handling
- **Type Safety**: Full TypeScript support with custom type declarations for QuaggaJS library

### Student Masterlist Integration
- **Google Sheets backend**: Reads directly from a shared Google Sheet via the Gviz JSON API — no manual data entry required
- **ID normalization**: Strips dashes and spaces before comparing so `2024-1521` and `20241521` both match correctly
- **Fuzzy name matching**: Scores candidates by token overlap and normalized string comparison to find the best match even with partial names
- **Email-to-ID resolution**: Extracts the numeric ID prefix from an institutional email for cross-referencing

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