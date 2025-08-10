export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ADMIN_STAFF' | 'STAFF' | 'PARTNER' | 'PARTNER_STAFF' | 'DRIVER';

export const ROLE_LABELS: Record<Role, string> = {
  'SUPER_ADMIN': 'Super Admin',
  'ADMIN': 'Admin',
  'ADMIN_STAFF': 'Admin Staff',
  'STAFF': 'Staff',
  'PARTNER': 'Partner',
  'PARTNER_STAFF': 'Partner Staff',
  'DRIVER': 'Driver'
};

// Permission levels
export type PermissionLevel = 'FULL' | 'MANAGE' | 'VIEW' | 'LIMITED' | 'NONE';

// Define permissions for each role
export interface RolePermissions {
  // System Management
  systemSettings: PermissionLevel;
  roleManagement: PermissionLevel;
  
  // Fleet Management
  fleetManagement: PermissionLevel;
  vehicleApproval: PermissionLevel;
  fleetAnalytics: PermissionLevel;
  
  // Partner Management
  partnerManagement: PermissionLevel;
  partnerApproval: PermissionLevel;
  
  // Driver Management
  driverManagement: PermissionLevel;
  driverApproval: PermissionLevel;
  
  // Booking Management
  bookingManagement: PermissionLevel;
  bookingApproval: PermissionLevel;
  
  // Financial Management
  financialManagement: PermissionLevel;
  paymentManagement: PermissionLevel;
  revenueAnalytics: PermissionLevel;
  
  // Document Management
  documentManagement: PermissionLevel;
  documentApproval: PermissionLevel;
  
  // Support & Communication
  supportManagement: PermissionLevel;
  notificationManagement: PermissionLevel;
  
  // Analytics & Reporting
  analyticsAccess: PermissionLevel;
  reportGeneration: PermissionLevel;
  
  // Security & Compliance
  securityManagement: PermissionLevel;
  auditLogs: PermissionLevel;
  complianceManagement: PermissionLevel;
}

export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  'SUPER_ADMIN': {
    // Full access to everything
    systemSettings: 'FULL',
    roleManagement: 'FULL',
    fleetManagement: 'FULL',
    vehicleApproval: 'FULL',
    fleetAnalytics: 'FULL',
    partnerManagement: 'FULL',
    partnerApproval: 'FULL',
    driverManagement: 'FULL',
    driverApproval: 'FULL',
    bookingManagement: 'FULL',
    bookingApproval: 'FULL',
    financialManagement: 'FULL',
    paymentManagement: 'FULL',
    revenueAnalytics: 'FULL',
    documentManagement: 'FULL',
    documentApproval: 'FULL',
    supportManagement: 'FULL',
    notificationManagement: 'FULL',
    analyticsAccess: 'FULL',
    reportGeneration: 'FULL',
    securityManagement: 'FULL',
    auditLogs: 'FULL',
    complianceManagement: 'FULL'
  },
  'ADMIN': {
    // Admin has most permissions but can't manage roles or system settings
    systemSettings: 'VIEW',
    roleManagement: 'NONE',
    fleetManagement: 'FULL',
    vehicleApproval: 'FULL',
    fleetAnalytics: 'FULL',
    partnerManagement: 'FULL',
    partnerApproval: 'FULL',
    driverManagement: 'FULL',
    driverApproval: 'FULL',
    bookingManagement: 'FULL',
    bookingApproval: 'FULL',
    financialManagement: 'FULL',
    paymentManagement: 'FULL',
    revenueAnalytics: 'FULL',
    documentManagement: 'FULL',
    documentApproval: 'FULL',
    supportManagement: 'FULL',
    notificationManagement: 'FULL',
    analyticsAccess: 'FULL',
    reportGeneration: 'FULL',
    securityManagement: 'VIEW',
    auditLogs: 'VIEW',
    complianceManagement: 'VIEW'
  },
  'ADMIN_STAFF': {
    // Admin staff has limited permissions based on their assigned roles
    systemSettings: 'NONE',
    roleManagement: 'NONE',
    fleetManagement: 'VIEW',
    vehicleApproval: 'NONE',
    fleetAnalytics: 'VIEW',
    partnerManagement: 'VIEW',
    partnerApproval: 'NONE',
    driverManagement: 'VIEW',
    driverApproval: 'NONE',
    bookingManagement: 'VIEW',
    bookingApproval: 'NONE',
    financialManagement: 'VIEW',
    paymentManagement: 'VIEW',
    revenueAnalytics: 'VIEW',
    documentManagement: 'VIEW',
    documentApproval: 'NONE',
    supportManagement: 'MANAGE',
    notificationManagement: 'VIEW',
    analyticsAccess: 'VIEW',
    reportGeneration: 'VIEW',
    securityManagement: 'NONE',
    auditLogs: 'NONE',
    complianceManagement: 'NONE'
  },
  'STAFF': {
    // Staff permissions
    systemSettings: 'NONE',
    roleManagement: 'NONE',
    fleetManagement: 'NONE',
    vehicleApproval: 'NONE',
    fleetAnalytics: 'NONE',
    partnerManagement: 'NONE',
    partnerApproval: 'NONE',
    driverManagement: 'NONE',
    driverApproval: 'NONE',
    bookingManagement: 'NONE',
    bookingApproval: 'NONE',
    financialManagement: 'NONE',
    paymentManagement: 'NONE',
    revenueAnalytics: 'NONE',
    documentManagement: 'NONE',
    documentApproval: 'NONE',
    supportManagement: 'NONE',
    notificationManagement: 'NONE',
    analyticsAccess: 'NONE',
    reportGeneration: 'NONE',
    securityManagement: 'NONE',
    auditLogs: 'NONE',
    complianceManagement: 'NONE'
  },
  'PARTNER': {
    // Partner permissions
    systemSettings: 'NONE',
    roleManagement: 'NONE',
    fleetManagement: 'MANAGE',
    vehicleApproval: 'NONE',
    fleetAnalytics: 'VIEW',
    partnerManagement: 'NONE',
    partnerApproval: 'NONE',
    driverManagement: 'MANAGE',
    driverApproval: 'NONE',
    bookingManagement: 'MANAGE',
    bookingApproval: 'NONE',
    financialManagement: 'VIEW',
    paymentManagement: 'VIEW',
    revenueAnalytics: 'VIEW',
    documentManagement: 'MANAGE',
    documentApproval: 'NONE',
    supportManagement: 'VIEW',
    notificationManagement: 'VIEW',
    analyticsAccess: 'VIEW',
    reportGeneration: 'VIEW',
    securityManagement: 'NONE',
    auditLogs: 'NONE',
    complianceManagement: 'NONE'
  },
  'PARTNER_STAFF': {
    // Partner staff permissions
    systemSettings: 'NONE',
    roleManagement: 'NONE',
    fleetManagement: 'VIEW',
    vehicleApproval: 'NONE',
    fleetAnalytics: 'VIEW',
    partnerManagement: 'NONE',
    partnerApproval: 'NONE',
    driverManagement: 'VIEW',
    driverApproval: 'NONE',
    bookingManagement: 'VIEW',
    bookingApproval: 'NONE',
    financialManagement: 'VIEW',
    paymentManagement: 'VIEW',
    revenueAnalytics: 'VIEW',
    documentManagement: 'VIEW',
    documentApproval: 'NONE',
    supportManagement: 'VIEW',
    notificationManagement: 'VIEW',
    analyticsAccess: 'VIEW',
    reportGeneration: 'VIEW',
    securityManagement: 'NONE',
    auditLogs: 'NONE',
    complianceManagement: 'NONE'
  },
  'DRIVER': {
    // Driver permissions
    systemSettings: 'NONE',
    roleManagement: 'NONE',
    fleetManagement: 'NONE',
    vehicleApproval: 'NONE',
    fleetAnalytics: 'NONE',
    partnerManagement: 'NONE',
    partnerApproval: 'NONE',
    driverManagement: 'NONE',
    driverApproval: 'NONE',
    bookingManagement: 'VIEW',
    bookingApproval: 'NONE',
    financialManagement: 'VIEW',
    paymentManagement: 'VIEW',
    revenueAnalytics: 'VIEW',
    documentManagement: 'VIEW',
    documentApproval: 'NONE',
    supportManagement: 'VIEW',
    notificationManagement: 'VIEW',
    analyticsAccess: 'VIEW',
    reportGeneration: 'VIEW',
    securityManagement: 'NONE',
    auditLogs: 'NONE',
    complianceManagement: 'NONE'
  }
};

// Helper function to check if user has permission
export function hasPermission(userRole: Role, permission: keyof RolePermissions, requiredLevel: PermissionLevel = 'VIEW'): boolean {
  const userPermissions = ROLE_PERMISSIONS[userRole];
  if (!userPermissions) return false;
  
  const userLevel = userPermissions[permission];
  if (!userLevel) return false;
  
  // Permission hierarchy: NONE < VIEW < LIMITED < MANAGE < FULL
  const levels: PermissionLevel[] = ['NONE', 'VIEW', 'LIMITED', 'MANAGE', 'FULL'];
  const userLevelIndex = levels.indexOf(userLevel);
  const requiredLevelIndex = levels.indexOf(requiredLevel);
  
  return userLevelIndex >= requiredLevelIndex;
}

// Helper function to get user's permission level for a specific permission
export function getUserPermissionLevel(userRole: Role, permission: keyof RolePermissions): PermissionLevel {
  const userPermissions = ROLE_PERMISSIONS[userRole];
  return userPermissions?.[permission] || 'NONE';
}

// Helper function to check if user is admin or super admin
export function isAdmin(userRole: Role): boolean {
  return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
}

// Helper function to check if user is super admin
export function isSuperAdmin(userRole: Role): boolean {
  return userRole === 'SUPER_ADMIN';
}

// Helper function to check if user can manage roles
export function canManageRoles(userRole: Role): boolean {
  return userRole === 'SUPER_ADMIN';
}

// Helper function to check if user can manage system settings
export function canManageSystemSettings(userRole: Role): boolean {
  return userRole === 'SUPER_ADMIN';
} 