import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PromoCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_amount?: number;
  max_discount?: number;
  usage_limit: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  applicable_fleets: string[];
  created_at: string;
  updated_at: string;
}

interface SocialCampaign {
  id: string;
  name: string;
  platform: 'FACEBOOK' | 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN' | 'WHATSAPP' | 'EMAIL';
  content: string;
  image_url?: string;
  link_url?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  scheduled_date?: string;
  engagement_metrics: {
    views: number;
    clicks: number;
    shares: number;
    conversions: number;
  };
  created_at: string;
  updated_at: string;
}

interface ReferralProgram {
  id: string;
  name: string;
  description?: string;
  referrer_reward: number;
  referee_reward: number;
  reward_type: 'PERCENTAGE' | 'FIXED';
  min_booking_amount?: number;
  max_referrals_per_user?: number;
  is_active: boolean;
  total_referrals: number;
  total_rewards_paid: number;
  created_at: string;
  updated_at: string;
}

interface MarketingStats {
  total_promo_codes: number;
  active_promo_codes: number;
  total_discounts_given: number;
  total_campaigns: number;
  active_campaigns: number;
  total_engagement: number;
  total_referrals: number;
  total_rewards_paid: number;
}

export function useMarketing() {
  const { user } = useAuth();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [campaigns, setCampaigns] = useState<SocialCampaign[]>([]);
  const [referralPrograms, setReferralPrograms] = useState<ReferralProgram[]>([]);
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromoCodes = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/partner/promo-codes?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch promo codes');
      
      const data = await response.json();
      setPromoCodes(data.promoCodes || []);
    } catch (err) {
      console.error('Error fetching promo codes:', err);
      setError('Failed to fetch promo codes');
    }
  };

  const fetchCampaigns = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/partner/campaigns?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to fetch campaigns');
    }
  };

  const fetchReferralPrograms = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/partner/referral-programs?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch referral programs');
      
      const data = await response.json();
      setReferralPrograms(data.referralPrograms || []);
    } catch (err) {
      console.error('Error fetching referral programs:', err);
      setError('Failed to fetch referral programs');
    }
  };

  const fetchStats = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/partner/marketing-stats?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch marketing stats');
      
      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching marketing stats:', err);
      setError('Failed to fetch marketing stats');
    }
  };

  const createPromoCode = async (promoCodeData: any) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const response = await fetch(`/api/partner/promo-codes?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoCodeData)
      });
      
      if (!response.ok) throw new Error('Failed to create promo code');
      
      const data = await response.json();
      await fetchPromoCodes(); // Refresh the list
      return data.promoCode;
    } catch (err) {
      console.error('Error creating promo code:', err);
      throw err;
    }
  };

  const createCampaign = async (campaignData: any) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const response = await fetch(`/api/partner/campaigns?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });
      
      if (!response.ok) throw new Error('Failed to create campaign');
      
      const data = await response.json();
      await fetchCampaigns(); // Refresh the list
      return data.campaign;
    } catch (err) {
      console.error('Error creating campaign:', err);
      throw err;
    }
  };

  const createReferralProgram = async (referralData: any) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const response = await fetch(`/api/partner/referral-programs?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referralData)
      });
      
      if (!response.ok) throw new Error('Failed to create referral program');
      
      const data = await response.json();
      await fetchReferralPrograms(); // Refresh the list
      return data.referralProgram;
    } catch (err) {
      console.error('Error creating referral program:', err);
      throw err;
    }
  };

  const togglePromoCodeStatus = async (id: string, isActive: boolean) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const response = await fetch(`/api/partner/promo-codes/${id}?userId=${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive })
      });
      
      if (!response.ok) throw new Error('Failed to update promo code status');
      
      const data = await response.json();
      await fetchPromoCodes(); // Refresh the list
      return data.promoCode;
    } catch (err) {
      console.error('Error updating promo code status:', err);
      throw err;
    }
  };

  const fetchFleets = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/partner/fleets?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch fleets');
      
      const data = await response.json();
      return data.fleets || [];
    } catch (err) {
      console.error('Error fetching fleets:', err);
      setError('Failed to fetch fleets');
      return [];
    }
  };

  const reload = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchPromoCodes(),
        fetchCampaigns(),
        fetchReferralPrograms(),
        fetchStats()
      ]);
    } catch (err) {
      console.error('Error reloading marketing data:', err);
      setError('Failed to reload data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      reload();
    }
  }, [user?.id]);

  return {
    promoCodes,
    campaigns,
    referralPrograms,
    stats,
    loading,
    error,
    createPromoCode,
    createCampaign,
    createReferralProgram,
    togglePromoCodeStatus,
    fetchFleets,
    reload
  };
} 