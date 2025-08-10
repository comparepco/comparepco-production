// Test the staff creation API
const testData = {
  partnerId: "550e8400-e29b-41d4-a716-446655440000", // Example UUID
  firstName: "Test",
  lastName: "User",
  email: "test.user@example.com",
  phone: "1234567890",
  role: "assistant",
  department: "Operations",
  position: "Test Position",
  startDate: "2024-01-01",
  salary: 25000,
  address: "123 Test Street",
  emergencyContactName: "Emergency Contact",
  emergencyContactPhone: "0987654321",
  emergencyContactRelationship: "Spouse",
  notes: "Test staff member",
  password: "testpassword123",
  permissions: {
    canManageFleet: false,
    canManageDrivers: false,
    canViewReports: false
  }
};

console.log('Testing staff creation API with data:');
console.log(JSON.stringify(testData, null, 2));

// This would be the actual API call
console.log('\nTo test this, you would need to:');
console.log('1. Replace the partnerId with a real UUID from your database');
console.log('2. Use a real email address');
console.log('3. Make sure the partner exists in the database');
console.log('4. Call POST /api/partner/staff with this data'); 