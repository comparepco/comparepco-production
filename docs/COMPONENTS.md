# Components Documentation

## 📁 Component Organization

### UI Components (`src/components/ui/`)

Base UI components that provide the foundation for the application's design system.

#### Button Component
```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}
```

**Usage:**
```tsx
import Button from '@/components/ui/button';

<Button variant="primary" size="lg" onClick={handleClick}>
  Login
</Button>
```

#### Card Component
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
}
```

**Usage:**
```tsx
import Card from '@/components/ui/card';

<Card padding="md" shadow="lg">
  <h2>Card Title</h2>
  <p>Card content</p>
</Card>
```

#### Toast Component
```typescript
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}
```

**Usage:**
```tsx
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  message: 'Successfully saved!',
  type: 'success',
});
```

### Layout Components (`src/components/layout/`)

Components responsible for the overall layout and navigation structure.

#### MainNav Component
```typescript
interface MainNavProps {
  user?: User | null;
  onSignOut?: () => void;
}
```

**Features:**
- Responsive navigation bar
- User authentication status
- Role-based navigation items
- Mobile menu support

#### Footer Component
```typescript
interface FooterProps {
  className?: string;
}
```

**Features:**
- Company information
- Social media links
- Legal links
- Newsletter signup

#### BottomNav Component
```typescript
interface BottomNavProps {
  activePage?: string;
}
```

**Features:**
- Mobile-first navigation
- Active state indicators
- Icon-based navigation
- Fixed positioning

#### PublicNavWrapper Component
```typescript
interface PublicNavWrapperProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}
```

**Features:**
- Conditional navigation display
- Route-based navigation logic
- Responsive layout wrapper

### Home Components (`src/components/home/`)

Components specific to the home page and car browsing functionality.

#### CarCard Component
```typescript
interface CarCardProps {
  car: Car;
  onSave?: (carId: string) => void;
  onBook?: (carId: string) => void;
  isSaved?: boolean;
}
```

**Features:**
- Car image display
- Car details (make, model, price)
- Save/book actions
- Responsive design

#### HeroFilter Component
```typescript
interface HeroFilterProps {
  cars: Car[];
  onFilterChange: (filters: FilterOptions) => void;
}
```

**Features:**
- Make/model filtering
- Price range filtering
- Location filtering
- Real-time filter updates

#### CarCarousel Component
```typescript
interface CarCarouselProps {
  cars: Car[];
  title?: string;
  showViewAll?: boolean;
}
```

**Features:**
- Horizontal scrolling
- Car card display
- Navigation arrows
- Responsive grid

#### FeatureTile Component
```typescript
interface FeatureTileProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
}
```

**Features:**
- Icon display
- Feature description
- Optional link
- Hover effects

### Authentication Components

#### LoginForm Component
```typescript
interface LoginFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
}
```

**Features:**
- Email/password fields
- Password visibility toggle
- Remember me checkbox
- Forgot password link
- Form validation

#### RegisterForm Component
```typescript
interface RegisterFormProps {
  userType: 'driver' | 'partner' | 'user';
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
}
```

**Features:**
- Role-based registration
- Form validation
- Password strength indicator
- Terms acceptance

### Admin Components (`src/components/admin/`)

Components specific to the admin dashboard.

#### AdminDashboard Component
```typescript
interface AdminDashboardProps {
  stats: DashboardStats;
  recentBookings: Booking[];
  recentUsers: User[];
}
```

**Features:**
- Statistics overview
- Recent activity
- Quick actions
- Navigation shortcuts

#### UserManagement Component
```typescript
interface UserManagementProps {
  users: User[];
  onUserUpdate: (userId: string, updates: Partial<User>) => void;
  onUserDelete: (userId: string) => void;
}
```

**Features:**
- User list display
- Search and filtering
- Bulk actions
- User editing

### Partner Components (`src/components/partner/`)

Components specific to the partner portal.

#### FleetManagement Component
```typescript
interface FleetManagementProps {
  vehicles: Vehicle[];
  onVehicleAdd: (vehicle: Vehicle) => void;
  onVehicleUpdate: (vehicleId: string, updates: Partial<Vehicle>) => void;
}
```

**Features:**
- Vehicle inventory
- Add/edit vehicles
- Status management
- Performance metrics

#### DriverManagement Component
```typescript
interface DriverManagementProps {
  drivers: Driver[];
  onDriverAssign: (driverId: string, vehicleId: string) => void;
  onDriverUpdate: (driverId: string, updates: Partial<Driver>) => void;
}
```

**Features:**
- Driver list
- Assignment management
- Performance tracking
- Document management

### Driver Components (`src/components/driver/`)

Components specific to the driver portal.

#### TripManagement Component
```typescript
interface TripManagementProps {
  trips: Trip[];
  onTripStart: (tripId: string) => void;
  onTripEnd: (tripId: string) => void;
}
```

**Features:**
- Trip list
- Start/end trip actions
- Route information
- Earnings calculation

#### EarningsDashboard Component
```typescript
interface EarningsDashboardProps {
  earnings: EarningsData;
  payouts: Payout[];
}
```

**Features:**
- Earnings overview
- Payout history
- Performance metrics
- Payment methods

### Shared Components (`src/components/shared/`)

Components used across multiple features.

#### LoadingSpinner Component
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
}
```

**Usage:**
```tsx
import LoadingSpinner from '@/components/shared/LoadingSpinner';

<LoadingSpinner size="lg" color="primary" />
```

#### ErrorBoundary Component
```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}
```

**Features:**
- Error catching
- Fallback UI
- Error reporting
- Recovery options

#### Modal Component
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

**Features:**
- Backdrop overlay
- Close on escape
- Focus management
- Responsive sizing

### Form Components (`src/components/forms/`)

Reusable form components and form-related utilities.

#### FormField Component
```typescript
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}
```

**Features:**
- Label association
- Error display
- Validation integration
- Accessibility support

#### FormSelect Component
```typescript
interface FormSelectProps {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
}
```

**Features:**
- Option list
- Search functionality
- Multi-select support
- Custom styling

### Table Components (`src/components/tables/`)

Data display and table-related components.

#### DataTable Component
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  pagination?: boolean;
  search?: boolean;
  sortable?: boolean;
}
```

**Features:**
- Sortable columns
- Search functionality
- Pagination
- Row selection

#### TablePagination Component
```typescript
interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}
```

**Features:**
- Page navigation
- Page size selection
- Total count display
- Responsive design

### Chart Components (`src/components/charts/`)

Data visualization and chart components.

#### LineChart Component
```typescript
interface LineChartProps {
  data: ChartData[];
  xAxis: string;
  yAxis: string;
  title?: string;
  color?: string;
}
```

**Features:**
- Smooth line rendering
- Tooltip display
- Responsive design
- Custom styling

#### BarChart Component
```typescript
interface BarChartProps {
  data: ChartData[];
  xAxis: string;
  yAxis: string;
  title?: string;
  colors?: string[];
}
```

**Features:**
- Bar rendering
- Color customization
- Animation effects
- Legend display

## 🎯 Component Guidelines

### 1. Props Interface
- Always define a props interface
- Use descriptive prop names
- Include optional props with `?`
- Provide default values where appropriate

### 2. Component Structure
```typescript
// 1. Imports
import React from 'react';
import { ComponentProps } from './types';

// 2. Props interface
interface ComponentProps {
  // Props definition
}

// 3. Component function
export default function Component({ prop1, prop2 }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### 3. Styling Patterns
- Use Tailwind classes for styling
- Create consistent spacing patterns
- Use CSS variables for theming
- Implement responsive design

### 4. Accessibility
- Include ARIA attributes
- Ensure keyboard navigation
- Provide alt text for images
- Use semantic HTML elements

### 5. Performance
- Memoize expensive calculations
- Use React.memo for pure components
- Lazy load heavy components
- Optimize re-renders

## 📝 Component Documentation Template

```markdown
# ComponentName

Brief description of the component's purpose.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description |
| prop2 | number | 0 | Description |

## Usage

```tsx
import ComponentName from '@/components/ComponentName';

<ComponentName prop1="value" prop2={42} />
```

## Examples

### Basic Usage
```tsx
<ComponentName />
```

### With Props
```tsx
<ComponentName prop1="custom" prop2={100} />
```

## Accessibility

- Keyboard navigation support
- Screen reader compatibility
- ARIA attributes included

## Performance

- Optimized for re-renders
- Lazy loading support
- Memoized calculations
```

## 🔧 Component Development Workflow

1. **Create component file** in appropriate directory
2. **Define props interface** with TypeScript
3. **Implement component logic** with React hooks
4. **Add styling** with Tailwind CSS
5. **Include accessibility** features
6. **Write documentation** with examples
7. **Add to index file** for easy imports
8. **Test component** in isolation
9. **Integrate** into pages
10. **Review and refactor** as needed 