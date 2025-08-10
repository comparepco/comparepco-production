# Database Schema Documentation

## 🗄️ Database Overview

The application uses **Supabase** as the backend service, which provides:
- **PostgreSQL** database
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates
- **Authentication** and **Authorization**
- **Storage** for file uploads

## 📊 Core Tables

### Users Table (`users`)

Stores user profiles and authentication data.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user',
  admin_role VARCHAR(50),
  account_type VARCHAR(50),
  partner_id UUID REFERENCES partners(id),
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique user identifier
- `email`: User's email address (unique)
- `name`: User's full name
- `phone`: User's phone number
- `role`: User role (user, driver, partner, admin, super_admin)
- `admin_role`: Admin-specific role
- `account_type`: Account type (staff, individual, company)
- `partner_id`: Reference to partner organization
- `is_active`: Account status
- `email_verified`: Email verification status
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### Cars Table (`cars`)

Stores vehicle information and availability.

```sql
CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(50),
  license_plate VARCHAR(20) UNIQUE,
  vin VARCHAR(17) UNIQUE,
  mileage INTEGER,
  fuel_type VARCHAR(20),
  transmission VARCHAR(20),
  seats INTEGER,
  doors INTEGER,
  price_per_day DECIMAL(10,2),
  price_per_week DECIMAL(10,2),
  price_per_month DECIMAL(10,2),
  images TEXT[],
  features TEXT[],
  description TEXT,
  location VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_available BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique car identifier
- `partner_id`: Reference to partner organization
- `make`: Car manufacturer
- `model`: Car model
- `year`: Manufacturing year
- `color`: Car color
- `license_plate`: Vehicle license plate
- `vin`: Vehicle identification number
- `mileage`: Current mileage
- `fuel_type`: Type of fuel
- `transmission`: Transmission type
- `seats`: Number of seats
- `doors`: Number of doors
- `price_per_day`: Daily rental price
- `price_per_week`: Weekly rental price
- `price_per_month`: Monthly rental price
- `images`: Array of image URLs
- `features`: Array of car features
- `description`: Car description
- `location`: Pickup/dropoff location
- `latitude`: GPS latitude
- `longitude`: GPS longitude
- `is_available`: Availability status
- `status`: Car status (active, maintenance, retired)

### Bookings Table (`bookings`)

Stores booking and reservation data.

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  car_id UUID REFERENCES cars(id) NOT NULL,
  driver_id UUID REFERENCES drivers(id),
  partner_id UUID REFERENCES partners(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  pickup_location VARCHAR(255),
  dropoff_location VARCHAR(255),
  total_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique booking identifier
- `user_id`: Reference to user making booking
- `car_id`: Reference to booked car
- `driver_id`: Reference to assigned driver
- `partner_id`: Reference to partner organization
- `start_date`: Booking start date
- `end_date`: Booking end date
- `start_time`: Pickup time
- `end_time`: Dropoff time
- `pickup_location`: Pickup location
- `dropoff_location`: Dropoff location
- `total_amount`: Total booking cost
- `deposit_amount`: Deposit amount
- `status`: Booking status (pending, confirmed, active, completed, cancelled)
- `payment_status`: Payment status (pending, paid, refunded)
- `payment_method`: Payment method used
- `notes`: Additional booking notes

### Partners Table (`partners`)

Stores partner organization information.

```sql
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  business_type VARCHAR(100),
  tax_id VARCHAR(50),
  license_number VARCHAR(50),
  commission_rate DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  verification_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique partner identifier
- `name`: Partner organization name
- `email`: Partner contact email
- `phone`: Partner contact phone
- `address`: Business address
- `city`: City
- `state`: State/province
- `country`: Country
- `postal_code`: Postal code
- `business_type`: Type of business
- `tax_id`: Tax identification number
- `license_number`: Business license number
- `commission_rate`: Commission percentage
- `is_active`: Partner status
- `verification_status`: Verification status (pending, verified, rejected)

### Drivers Table (`drivers`)

Stores driver information and credentials.

```sql
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id),
  user_id UUID REFERENCES users(id) UNIQUE,
  license_number VARCHAR(50) UNIQUE,
  license_expiry DATE,
  vehicle_class VARCHAR(20),
  experience_years INTEGER,
  rating DECIMAL(3,2),
  total_trips INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  verification_status VARCHAR(20) DEFAULT 'pending',
  background_check_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique driver identifier
- `partner_id`: Reference to partner organization
- `user_id`: Reference to user account
- `license_number`: Driver's license number
- `license_expiry`: License expiry date
- `vehicle_class`: Vehicle class license
- `experience_years`: Years of driving experience
- `rating`: Driver rating (1-5)
- `total_trips`: Total number of trips
- `total_earnings`: Total earnings
- `is_available`: Availability status
- `verification_status`: Verification status
- `background_check_status`: Background check status

### Saved Cars Table (`saved_cars`)

Stores user's saved/favorite cars.

```sql
CREATE TABLE saved_cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  car_id UUID REFERENCES cars(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, car_id)
);
```

**Fields:**
- `id`: Unique saved car identifier
- `user_id`: Reference to user
- `car_id`: Reference to saved car
- `created_at`: Save timestamp

## 🔗 Table Relationships

### One-to-Many Relationships

1. **Partner → Cars**: One partner can have multiple cars
2. **Partner → Drivers**: One partner can have multiple drivers
3. **Partner → Bookings**: One partner can have multiple bookings
4. **User → Bookings**: One user can have multiple bookings
5. **User → Saved Cars**: One user can save multiple cars
6. **Car → Bookings**: One car can have multiple bookings

### Many-to-Many Relationships

1. **Users ↔ Cars** (through saved_cars): Users can save multiple cars, cars can be saved by multiple users

### Foreign Key Constraints

```sql
-- Cars table
ALTER TABLE cars ADD CONSTRAINT fk_cars_partner 
FOREIGN KEY (partner_id) REFERENCES partners(id);

-- Bookings table
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user 
FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_car 
FOREIGN KEY (car_id) REFERENCES cars(id);
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_driver 
FOREIGN KEY (driver_id) REFERENCES drivers(id);
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_partner 
FOREIGN KEY (partner_id) REFERENCES partners(id);

-- Drivers table
ALTER TABLE drivers ADD CONSTRAINT fk_drivers_partner 
FOREIGN KEY (partner_id) REFERENCES partners(id);
ALTER TABLE drivers ADD CONSTRAINT fk_drivers_user 
FOREIGN KEY (user_id) REFERENCES users(id);

-- Saved cars table
ALTER TABLE saved_cars ADD CONSTRAINT fk_saved_cars_user 
FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE saved_cars ADD CONSTRAINT fk_saved_cars_car 
FOREIGN KEY (car_id) REFERENCES cars(id);
```

## 🔐 Row Level Security (RLS)

### Users Table Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );
```

### Cars Table Policies

```sql
-- Enable RLS
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Anyone can view available cars
CREATE POLICY "Anyone can view available cars" ON cars
  FOR SELECT USING (is_available = true);

-- Partners can manage their own cars
CREATE POLICY "Partners can manage own cars" ON cars
  FOR ALL USING (
    partner_id IN (
      SELECT id FROM partners 
      WHERE id IN (
        SELECT partner_id FROM users 
        WHERE id = auth.uid()
      )
    )
  );
```

### Bookings Table Policies

```sql
-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (user_id = auth.uid());

-- Users can create bookings
CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Partners can view bookings for their cars
CREATE POLICY "Partners can view car bookings" ON bookings
  FOR SELECT USING (
    partner_id IN (
      SELECT partner_id FROM users 
      WHERE id = auth.uid()
    )
  );
```

## 📊 Indexes

### Performance Indexes

```sql
-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_partner_id ON users(partner_id);

-- Cars table indexes
CREATE INDEX idx_cars_partner_id ON cars(partner_id);
CREATE INDEX idx_cars_make_model ON cars(make, model);
CREATE INDEX idx_cars_available ON cars(is_available);
CREATE INDEX idx_cars_location ON cars(latitude, longitude);

-- Bookings table indexes
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_car_id ON bookings(car_id);
CREATE INDEX idx_bookings_partner_id ON bookings(partner_id);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Drivers table indexes
CREATE INDEX idx_drivers_partner_id ON drivers(partner_id);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_available ON drivers(is_available);

-- Saved cars table indexes
CREATE INDEX idx_saved_cars_user_id ON saved_cars(user_id);
CREATE INDEX idx_saved_cars_car_id ON saved_cars(car_id);
```

## 🔄 Triggers

### Updated At Trigger

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 📈 Data Types

### Enums

```sql
-- User roles enum
CREATE TYPE user_role AS ENUM (
  'user', 'driver', 'partner', 'admin', 'super_admin'
);

-- Booking status enum
CREATE TYPE booking_status AS ENUM (
  'pending', 'confirmed', 'active', 'completed', 'cancelled'
);

-- Payment status enum
CREATE TYPE payment_status AS ENUM (
  'pending', 'paid', 'refunded', 'failed'
);

-- Verification status enum
CREATE TYPE verification_status AS ENUM (
  'pending', 'verified', 'rejected'
);
```

## 🗂️ Views

### Popular Cars View

```sql
CREATE VIEW popular_cars AS
SELECT 
  c.*,
  COUNT(b.id) as booking_count,
  AVG(b.total_amount) as avg_booking_amount
FROM cars c
LEFT JOIN bookings b ON c.id = b.car_id
WHERE c.is_available = true
GROUP BY c.id
ORDER BY booking_count DESC;
```

### Driver Performance View

```sql
CREATE VIEW driver_performance AS
SELECT 
  d.*,
  u.name as driver_name,
  u.email as driver_email,
  COUNT(b.id) as total_bookings,
  SUM(b.total_amount) as total_revenue,
  AVG(b.total_amount) as avg_booking_value
FROM drivers d
JOIN users u ON d.user_id = u.id
LEFT JOIN bookings b ON d.id = b.driver_id
GROUP BY d.id, u.name, u.email;
```

## 🔍 Query Examples

### Get Available Cars with Partner Info

```sql
SELECT 
  c.*,
  p.name as partner_name,
  p.city as partner_city
FROM cars c
JOIN partners p ON c.partner_id = p.id
WHERE c.is_available = true
ORDER BY c.created_at DESC;
```

### Get User Bookings with Car Details

```sql
SELECT 
  b.*,
  c.make,
  c.model,
  c.year,
  c.images,
  p.name as partner_name
FROM bookings b
JOIN cars c ON b.car_id = c.id
JOIN partners p ON b.partner_id = p.id
WHERE b.user_id = $1
ORDER BY b.created_at DESC;
```

### Get Partner Dashboard Stats

```sql
SELECT 
  COUNT(c.id) as total_cars,
  COUNT(CASE WHEN c.is_available = true THEN 1 END) as available_cars,
  COUNT(b.id) as total_bookings,
  SUM(b.total_amount) as total_revenue,
  AVG(b.total_amount) as avg_booking_value
FROM partners p
LEFT JOIN cars c ON p.id = c.partner_id
LEFT JOIN bookings b ON c.id = b.car_id
WHERE p.id = $1;
```

## 🛡️ Security Best Practices

### Data Validation

1. **Input Validation**: Validate all user inputs
2. **SQL Injection Prevention**: Use parameterized queries
3. **Data Sanitization**: Sanitize data before storage
4. **Access Control**: Implement proper RLS policies

### Backup Strategy

1. **Automated Backups**: Daily automated backups
2. **Point-in-Time Recovery**: Enable PITR
3. **Cross-Region Replication**: Replicate to multiple regions
4. **Backup Testing**: Regularly test backup restoration

### Monitoring

1. **Query Performance**: Monitor slow queries
2. **Connection Pooling**: Optimize connection usage
3. **Storage Monitoring**: Monitor storage growth
4. **Security Logs**: Monitor access patterns 