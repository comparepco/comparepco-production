# ComparePCO - Enterprise Car Rental Platform

A comprehensive, enterprise-grade car rental platform that connects **Drivers** (Uber/Lyft drivers) with **Partners** (car rental companies) through an advanced **Admin** management system. Built with Next.js 14, Supabase, and TypeScript.

## 🎯 Business Model

**ComparePCO** is a specialized PCO (Private Car Operator) car rental platform that:
- **Connects Drivers** who need cars for Uber/Lyft with **Partners** who provide vehicles
- **Manages the entire rental lifecycle** from vehicle listing to payment processing
- **Provides role-based dashboards** for different user types with specific permissions
- **Ensures compliance** with PCO licensing requirements and document verification

## 👥 User Roles & Access

### 🚗 **Drivers** (`DRIVER`)
- **Public Registration**: Sign up and get approved by admins
- **Vehicle Comparison**: Browse and compare available vehicles
- **Booking Management**: Book vehicles, track payments, view history
- **Document Upload**: Submit required PCO documents
- **Dashboard**: Personal booking overview and payment tracking

### 🏢 **Partners** (`PARTNER`)
- **Fleet Management**: Add, edit, and manage vehicle inventory
- **Advanced Dashboard**: Fleetio-inspired dashboard with 30+ widgets
- **Booking Operations**: Manage all rental bookings and customer service
- **Staff Management**: Create and manage partner staff with role-based permissions
- **Financial Management**: Revenue tracking, payment processing, invoicing
- **Document Management**: Upload and manage business documents
- **Analytics**: Comprehensive business intelligence and reporting

### 👨‍💼 **Partner Staff** (`PARTNER_STAFF`)
- **Role-Based Access**: Fleet Manager, Booking Manager, Driver Manager, etc.
- **Limited Permissions**: Access only to assigned areas based on role
- **Staff Dashboard**: Customized dashboard based on permissions
- **Collaborative Tools**: Work within partner organization

### 🔧 **Admins** (`ADMIN`, `SUPER_ADMIN`, `ADMIN_STAFF`)
- **User Management**: Approve/reject drivers and partners
- **Fleet Approval**: Review and approve partner vehicles
- **System Oversight**: Monitor platform activity and performance
- **Support Management**: Handle customer service and support tickets
- **Analytics**: Platform-wide analytics and reporting

## 🚀 Core Features

### 📊 **Advanced Dashboard System**
- **Fleetio-Inspired Design**: Modern, widget-based dashboard with real-time data
- **30+ Interactive Widgets**: Revenue analytics, fleet metrics, booking insights
- **Role-Based Views**: Different dashboards for each user type
- **Real-Time Updates**: Live data synchronization with Supabase
- **Expandable Widgets**: Click-to-expand detailed views with charts and tables

### 🚗 **Fleet Management**
- **Vehicle Categories**: PCO-specific categories (X, COMFORT, BUSINESS COMFORT, EXEC, GREEN, LUX, BLACKLANE, WHEELY)
- **Multi-Category Selection**: Vehicles can belong to up to 3 categories
- **Bulk Operations**: Mass update pricing, status, categories, availability
- **Document Management**: Vehicle documents, insurance, MOT tracking
- **Maintenance Tracking**: Scheduled maintenance, service history
- **Analytics**: Fleet utilization, revenue per vehicle, performance metrics

### 📋 **Booking System**
- **Comprehensive Booking Management**: 2,714 lines of booking logic
- **Status Tracking**: Active, pending, completed, cancelled bookings
- **Payment Processing**: Integrated payment system with Stripe
- **Revenue Tracking**: Detailed revenue analytics and reporting
- **Customer Service**: Support ticket system and communication tools

### 👥 **Staff Management**
- **Role-Based Permissions**: Granular access control for partner staff
- **Staff Creation**: Partners can create staff accounts with specific roles
- **Permission System**: Fleet management, booking access, financial access
- **Collaborative Tools**: Team-based workflow management

### 📈 **Analytics & Reporting**
- **Business Intelligence**: Revenue trends, utilization rates, performance metrics
- **Custom Reports**: Generate detailed reports for different business needs
- **Real-Time Metrics**: Live dashboard with key performance indicators
- **Export Functionality**: CSV/Excel export for all data

### 🔐 **Security & Compliance**
- **Row Level Security (RLS)**: Database-level security policies
- **Role-Based Access Control**: Granular permissions for all user types
- **Document Verification**: Automated document approval workflow
- **Audit Trails**: Complete activity logging and tracking

## 🛠 Technology Stack

### **Frontend**
- **Next.js 14** (App Router) - React framework with server-side rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Comprehensive icon library
- **Recharts** - Data visualization and charts
- **React Hook Form** - Form management and validation
- **Zod** - Schema validation

### **Backend & Database**
- **Supabase** - Backend-as-a-Service (PostgreSQL, Auth, Storage, Realtime)
- **PostgreSQL** - Primary database
- **Row Level Security (RLS)** - Database-level security
- **Supabase Auth** - Authentication and authorization
- **Supabase Storage** - File upload and management
- **Supabase Realtime** - Real-time data synchronization

### **Additional Tools**
- **Stripe** - Payment processing
- **React Hot Toast** - Notification system
- **Framer Motion** - Animations and transitions
- **Date-fns** - Date manipulation
- **React Select** - Advanced select components

## 📦 Installation & Setup

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

### **1. Clone Repository**
```bash
git clone <repository-url>
cd comparepco-production
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Configuration**
Create `.env.local` file:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Additional Services (Optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### **4. Database Setup**
```bash
# Apply database migrations
npx supabase db push

# Or run migrations manually
npx supabase migration up
```

### **5. Start Development Server**
```bash
npm run dev
```

### **6. Access Application**
- **Main Site**: http://localhost:3000
- **Partner Dashboard**: http://localhost:3000/partner
- **Admin Dashboard**: http://localhost:3000/admin
- **Driver Portal**: http://localhost:3000/driver

## 🗄 Database Schema

### **Core Tables**
- `users` - User accounts and authentication
- `partners` - Partner companies and business information
- `partner_staff` - Staff members with role-based permissions
- `vehicles` - Fleet vehicle information and status
- `vehicle_categories` - Vehicle categorization system
- `bookings` - Rental booking records and status
- `drivers` - Driver information and performance data
- `documents` - Document management and verification
- `payments` - Payment processing and tracking
- `notifications` - Real-time notification system

### **Support Tables**
- `support_tickets` - Customer service ticket system
- `chat_messages` - Real-time chat functionality
- `maintenance_records` - Vehicle maintenance tracking
- `claims` - Insurance and damage claims
- `reports` - Custom reporting system

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking

# Database
npx supabase db push    # Push schema changes
npx supabase migration new <name>  # Create new migration
npx supabase db reset   # Reset database

# Testing
npm test                # Run tests
npm run test:watch      # Watch mode testing
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard and management
│   ├── partner/           # Partner portal and fleet management
│   ├── partner-staff/     # Partner staff specific views
│   ├── driver/            # Driver portal and booking
│   ├── auth/              # Authentication pages
│   └── api/               # API routes
├── components/            # Reusable React components
│   ├── admin/            # Admin-specific components
│   ├── partner/          # Partner-specific components
│   ├── shared/           # Shared components
│   └── ui/               # UI components
├── contexts/             # React contexts (Auth, etc.)
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries and configurations
├── types/                # TypeScript type definitions
└── styles/               # Global styles and CSS

supabase/
├── migrations/           # Database migrations
└── config.toml          # Supabase configuration
```

## 🚀 Deployment

### **Vercel Deployment**
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Supabase Production**
1. Create production Supabase project
2. Apply all migrations to production database
3. Update environment variables with production URLs

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Permissions**: Granular access control for all user types
- **Authentication**: Secure user authentication with Supabase Auth
- **Data Validation**: Input validation with Zod schemas
- **Audit Logging**: Complete activity tracking and logging

## 📊 Performance Features

- **Server-Side Rendering**: Next.js SSR for better performance
- **Image Optimization**: Next.js Image component optimization
- **Code Splitting**: Automatic code splitting for better loading
- **Caching**: Strategic caching for improved performance
- **Real-Time Updates**: Efficient real-time data synchronization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- **Documentation**: Check the docs/ folder for detailed guides
- **Issues**: Create an issue in the repository
- **Email**: Contact the development team

---

**ComparePCO** - Connecting drivers with quality vehicles for the PCO market. 