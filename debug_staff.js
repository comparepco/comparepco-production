// Debug script to test staff creation
const testData = {
  partnerId: "test-partner-id",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "1234567890",
  role: "assistant",
  department: "Operations",
  position: "Staff Assistant",
  startDate: "2024-01-01",
  salary: 25000,
  address: "123 Test Street",
  emergencyContactName: "Jane Doe",
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

console.log('Test data for staff creation:');
console.log(JSON.stringify(testData, null, 2));

// This would be the API call
console.log('\nAPI call would be:');
console.log('POST /api/partner/staff');
console.log('Body:', JSON.stringify(testData, null, 2)); 