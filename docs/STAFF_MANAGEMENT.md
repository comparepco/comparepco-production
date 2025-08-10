# Staff Management System

## Overview

The Staff Management System is a comprehensive solution for partners to manage their team members, assign permissions, and track performance. It provides a secure, role-based access control system with detailed analytics and reporting capabilities.

## Features

### 🔐 Security & Permissions
- **Role-based Access Control**: Different permission levels for managers, supervisors, coordinators, and assistants
- **Granular Permissions**: Fine-grained control over what each staff member can access
- **Security Restrictions**: Staff members cannot access admin-level permissions
- **Audit Trail**: Track login activity and permission changes

### 👥 Staff Management
- **Complete Staff Profiles**: Personal information, work details, emergency contacts
- **Department Organization**: Organize staff by departments and roles
- **Salary Management**: Track and manage salary information
- **Employment Tracking**: Start dates, position changes, and status management

### 📊 Analytics & Reporting
- **Real-time Analytics**: Live dashboard with key metrics
- **Performance Insights**: Track login activity and engagement
- **Department Analysis**: Compare performance across departments
- **Salary Distribution**: Analyze compensation structure
- **Growth Trends**: Monitor staff growth and retention

### 🎨 User Interface
- **Modern Design**: Clean, intuitive interface with responsive design
- **Card-based Layout**: Easy-to-scan staff cards with key information
- **Advanced Filtering**: Filter by role, department, status, and more
- **Search Functionality**: Quick search across all staff information

## Database Schema

### Partner Staff Table
```sql
CREATE TABLE partner_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'assistant',
  department TEXT DEFAULT 'Operations',
  position TEXT,
  start_date DATE,
  salary DECIMAL(10,2),
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  notes TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
```

## API Endpoints

### GET /api/partner/staff
Retrieve staff members for a partner
- **Query Parameters**: `partnerId`, `userId`
- **Response**: Array of staff members with user details

### POST /api/partner/staff
Create a new staff member
- **Body**: Staff member data including personal info, work details, and permissions
- **Response**: Created staff member data

### PUT /api/partner/staff
Update staff member information
- **Body**: `staffId` and `updates` object
- **Response**: Updated staff member data

### DELETE /api/partner/staff
Delete a staff member
- **Query Parameters**: `staffId`
- **Response**: Success confirmation

## Permission System

### Available Permissions
- **Fleet Management**: `canManageFleet`, `canManageVehicles`, `canViewFleet`
- **Driver Management**: `canManageDrivers`, `canViewDrivers`
- **Booking Management**: `canManageBookings`, `canViewBookings`, `canViewAllBookings`
- **Financial Access**: `canViewFinancials`, `canManagePayments`, `canRefundPayments`
- **Analytics**: `canViewAnalytics`, `canViewReports`
- **Marketing**: `canManageMarketing`, `canManagePromotions`
- **Documents**: `canManageDocuments`, `canManageNotifications`
- **Support**: `canManageSupport`, `canManageStaff`

### Security Restrictions
- Staff members cannot have admin permissions (`isAdmin`, `canAccessAdmin`)
- Staff cannot manage other partners (`canManagePartners`)
- Staff cannot view all data (`canViewAllData`)

## Components

### StaffCard
Reusable component for displaying staff member information
- **Props**: Staff member data and action handlers
- **Features**: Status indicators, permission preview, action buttons

### StaffForm
Comprehensive form for creating and editing staff members
- **Features**: Validation, permission management, emergency contact info
- **Security**: Automatic permission sanitization

### StaffAnalytics
Analytics dashboard component
- **Features**: Key metrics, role distribution, department analysis
- **Charts**: Progress bars, activity metrics, performance insights

## Hooks

### useStaffManagement
Custom hook for staff management operations
- **Features**: CRUD operations, error handling, loading states
- **Returns**: Staff data, management functions, error states

## Usage Examples

### Creating a Staff Member
```typescript
const { createStaff } = useStaffManagement();

const handleCreate = async (formData) => {
  try {
    await createStaff({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'supervisor',
      department: 'Operations',
      permissions: {
        canManageFleet: true,
        canViewReports: true,
        // ... other permissions
      }
    });
  } catch (error) {
    console.error('Failed to create staff:', error);
  }
};
```

### Updating Permissions
```typescript
const { updateStaff } = useStaffManagement();

const handleUpdatePermissions = async (staffId, permissions) => {
  try {
    await updateStaff(staffId, { permissions });
  } catch (error) {
    console.error('Failed to update permissions:', error);
  }
};
```

## Security Considerations

### Row Level Security (RLS)
- Partners can only view their own staff
- Staff members can view other staff in the same partner
- Admins can view all staff members

### Permission Validation
- All permission updates are sanitized
- Admin permissions are automatically denied for staff
- Permission changes are logged and audited

### Data Protection
- Sensitive information is encrypted
- Access is controlled through RLS policies
- Audit trails track all changes

## Analytics Features

### Key Metrics
- Total staff count
- Active vs inactive staff
- Role distribution
- Average salary
- Recent activity

### Performance Insights
- Login activity tracking
- Department performance comparison
- Salary distribution analysis
- Staff growth trends

### Export Capabilities
- PDF reports
- CSV data export
- Custom date ranges
- Filtered analytics

## Best Practices

### Staff Creation
1. Always validate email addresses
2. Set appropriate role and department
3. Assign minimal required permissions
4. Include emergency contact information
5. Set reasonable salary expectations

### Permission Management
1. Follow principle of least privilege
2. Regularly review and update permissions
3. Monitor permission usage analytics
4. Document permission changes

### Data Maintenance
1. Keep staff information up to date
2. Regularly review inactive accounts
3. Monitor login activity for security
4. Archive old staff records appropriately

## Troubleshooting

### Common Issues

**Staff member cannot log in**
- Check if account is active
- Verify email confirmation
- Check role assignment

**Permission issues**
- Verify permission assignments
- Check role-based restrictions
- Review RLS policies

**Analytics not loading**
- Check partner ID assignment
- Verify data permissions
- Review API endpoint access

### Error Handling
- All API calls include proper error handling
- User-friendly error messages
- Detailed logging for debugging
- Graceful fallbacks for missing data

## Future Enhancements

### Planned Features
- Advanced reporting capabilities
- Integration with HR systems
- Automated permission suggestions
- Performance evaluation tools
- Training tracking
- Time-off management

### Technical Improvements
- Real-time notifications
- Advanced search capabilities
- Bulk operations
- API rate limiting
- Enhanced security features 