# PCO Compare Production

A comprehensive partner dashboard system built with Next.js, Supabase, and React, inspired by Fleetio's design patterns. This application provides role-based views for partner staff with detailed data visualization and interactive elements.

## 🚀 Features

### Dashboard System
- **Fleetio-inspired Dashboard**: Modern, widget-based dashboard with drag-and-drop functionality
- **Role-based Views**: Different dashboards for partners and partner staff
- **Real-time Updates**: Live data synchronization with Supabase
- **Interactive Widgets**: Expandable widgets with detailed insights and pop-out modals

### Partner Dashboard
- **Revenue Analytics**: Detailed revenue tracking with charts and growth metrics
- **Fleet Management**: Vehicle status, maintenance tracking, and utilization metrics
- **Booking System**: Active, pending, and completed bookings with revenue tracking
- **Staff Management**: Role-based staff overview with permissions
- **Driver Management**: Driver performance and availability tracking
- **Maintenance Tracking**: Scheduled, overdue, and completed maintenance
- **Document Management**: Document status and approval workflow
- **Payment Processing**: Payment tracking and processing
- **Alert System**: Critical, warning, and info alerts
- **Notification Center**: Real-time notifications with unread counts

### Partner Staff Dashboard
- **Role-specific Views**: Customized dashboards based on staff roles
- **Fleet Manager View**: Vehicle management and maintenance oversight
- **Booking Manager View**: Booking management and customer service
- **Driver Manager View**: Driver performance and scheduling
- **Document Manager View**: Document processing and approval workflow

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: React Icons (FontAwesome)
- **Backend**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd comparepco-production
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄 Database Setup

The application uses Supabase with the following main tables:

- `partners` - Partner information and status
- `partner_staff` - Staff members with role-based permissions
- `vehicles` - Fleet vehicle information
- `bookings` - Booking records and status
- `drivers` - Driver information and performance
- `documents` - Document management and approval workflow
- `payments` - Payment processing and tracking
- `notifications` - Real-time notification system

## 🎯 Key Components

### Dashboard Widgets
- **Metric Widgets**: Display key performance indicators
- **Chart Widgets**: Visualize data trends with interactive charts
- **Alert Widgets**: Show important alerts and notifications
- **Activity Widgets**: Display recent activity feeds
- **Map Widgets**: Show location-based data
- **Project Widgets**: Track ongoing projects and tasks

### Modal System
- **Expanded Widget Views**: Detailed insights in pop-out modals
- **Interactive Elements**: Charts, tables, and action buttons
- **Real-time Data**: Live updates within modal views

## 🔧 Development

### Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard
│   ├── partner/           # Partner dashboard
│   ├── partner-staff/     # Partner staff dashboard
│   └── compare/           # Comparison tools
├── components/            # Reusable React components
│   ├── admin/            # Admin-specific components
│   ├── partner/          # Partner-specific components
│   └── ui/               # Generic UI components
├── lib/                  # Utility functions and configurations
└── types/                # TypeScript type definitions
```

### Key Features Implementation
- **Widget System**: Modular, expandable dashboard widgets
- **Real-time Updates**: Supabase Realtime integration
- **Role-based Access**: Permission-based dashboard views
- **Data Visualization**: Interactive charts and metrics
- **Modal System**: Pop-out detailed views for widgets

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📝 Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for server-side operations)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `/docs` folder

## 🔄 Updates

Stay updated with the latest features and improvements by:
- Following the repository
- Checking the releases page
- Reading the changelog

---

**Built with ❤️ using Next.js, Supabase, and React** 