import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface StaffMember {
  id: string;
  partnerId: string;
  userId: string;
  role: string;
  department?: string;
  position?: string;
  startDate?: string;
  salary?: number;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  notes?: string;
  lastLogin?: string;
  loginCount?: number;
  permissions: Record<string, boolean>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
    phone?: string;
  };
}

interface UseStaffManagementReturn {
  staff: StaffMember[];
  loading: boolean;
  error: string | null;
  partnerId: string | null;
  createStaff: (data: any) => Promise<void>;
  updateStaff: (staffId: string, updates: any) => Promise<void>;
  deleteStaff: (staffId: string) => Promise<void>;
  refreshStaff: () => Promise<void>;
}

export function useStaffManagement(): UseStaffManagementReturn {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);

  const getPartnerId = useCallback(async () => {
    if (!user) return null;

    try {
      let currentPartnerId = user.id;
      
      // If user is partner_staff, get their partner_id
      if (user.role === 'PARTNER_STAFF') {
        const response = await fetch('/api/partner/staff', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.staff && data.staff.length > 0) {
            currentPartnerId = data.staff[0].partnerId;
          }
        }
      }
      
      return currentPartnerId;
    } catch (error) {
      console.error('Error getting partner ID:', error);
      return null;
    }
  }, [user]);

  const loadStaff = useCallback(async (partnerId: string) => {
    if (!partnerId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/partner/staff?partnerId=${partnerId}`);
      const data = await response.json();

      if (response.ok) {
        setStaff(data.staff || []);
      } else {
        setError(data.error || 'Failed to load staff');
      }
    } catch (error) {
      console.error('Error loading staff:', error);
      setError('Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, []);

  const createStaff = useCallback(async (formData: any) => {
    if (!partnerId) {
      throw new Error('Partner ID not available');
    }

    try {
      setError(null);

      const response = await fetch('/api/partner/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          partnerId
        })
      });

      const data = await response.json();

      if (response.ok) {
        await loadStaff(partnerId);
        return data;
      } else {
        throw new Error(data.error || 'Failed to create staff member');
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
  }, [partnerId, loadStaff]);

  const updateStaff = useCallback(async (staffId: string, updates: any) => {
    try {
      setError(null);

      const response = await fetch('/api/partner/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, updates })
      });

      const data = await response.json();

      if (response.ok) {
        await loadStaff(partnerId!);
        return data;
      } else {
        throw new Error(data.error || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  }, [partnerId, loadStaff]);

  const deleteStaff = useCallback(async (staffId: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/partner/staff?staffId=${staffId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        await loadStaff(partnerId!);
        return data;
      } else {
        throw new Error(data.error || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  }, [partnerId, loadStaff]);

  const refreshStaff = useCallback(async () => {
    if (partnerId) {
      await loadStaff(partnerId);
    }
  }, [partnerId, loadStaff]);

  // Initialize partner ID and load staff
  useEffect(() => {
    const initialize = async () => {
      if (user) {
        const currentPartnerId = await getPartnerId();
        if (currentPartnerId) {
          setPartnerId(currentPartnerId);
          await loadStaff(currentPartnerId);
        }
      }
    };

    initialize();
  }, [user, getPartnerId, loadStaff]);

  return {
    staff,
    loading,
    error,
    partnerId,
    createStaff,
    updateStaff,
    deleteStaff,
    refreshStaff
  };
} 