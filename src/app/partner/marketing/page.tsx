'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMarketing } from '@/hooks/useMarketing';
import {
  FaGift, FaShareAlt, FaUsers, FaChartLine, FaPlus, FaEdit, FaTrash, FaCopy,
  FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaWhatsapp, FaEnvelope,
  FaQrcode, FaDownload, FaEye, FaEyeSlash, FaCalendarAlt, FaClock,
  FaMoneyBillWave, FaPercent, FaTag, FaLink, FaBullhorn, FaRocket,
  FaTrophy, FaStar, FaHandshake, FaUserPlus, FaChartPie, FaFilter,
  FaSearch, FaSort, FaSortUp, FaSortDown, FaEllipsisH, FaTimes, FaCheck,
  FaExclamationTriangle, FaInfoCircle, FaQuestionCircle, FaHistory,
  FaCreditCard, FaUniversity, FaReceipt, FaCalculator, FaCalendar,
  FaGlobe, FaMobile, FaDesktop, FaTablet, FaMapMarkerAlt, FaPhone
} from 'react-icons/fa';

interface PromoCode {
  id: string;
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
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
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'whatsapp' | 'email';
  content: string;
  image_url?: string;
  link_url?: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
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
  description: string;
  referrer_reward: number;
  referee_reward: number;
  reward_type: 'percentage' | 'fixed';
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

// Helper functions
const money = (n: number | undefined) => `£${(n||0).toLocaleString()}`;
const formatDate = (d: any) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'facebook':
      return <FaFacebook className="w-4 h-4" />;
    case 'twitter':
      return <FaTwitter className="w-4 h-4" />;
    case 'instagram':
      return <FaInstagram className="w-4 h-4" />;
    case 'linkedin':
      return <FaLinkedin className="w-4 h-4" />;
    case 'whatsapp':
      return <FaWhatsapp className="w-4 h-4" />;
    case 'email':
      return <FaEnvelope className="w-4 h-4" />;
    default:
      return <FaGlobe className="w-4 h-4" />;
  }
};

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case 'facebook':
      return 'bg-blue-100 text-blue-600';
    case 'twitter':
      return 'bg-blue-100 text-blue-500';
    case 'instagram':
      return 'bg-pink-100 text-pink-600';
    case 'linkedin':
      return 'bg-blue-100 text-blue-700';
    case 'whatsapp':
      return 'bg-green-100 text-green-600';
    case 'email':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function PartnerMarketingPage() {
  const { user } = useAuth();
  const { 
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
  } = useMarketing();
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'promoCodes' | 'campaigns' | 'referrals' | 'analytics'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Modal states
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [fleets, setFleets] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [promoForm, setPromoForm] = useState({
    name: '',
    code: '',
    description: '',
    discountType: 'FIXED' as 'FIXED' | 'PERCENTAGE',
    discountValue: 0,
    minAmount: 0,
    maxDiscount: 0,
    usageLimit: 100,
    startDate: '',
    endDate: '',
    applicableFleets: [] as string[]
  });

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    platform: 'FACEBOOK' as 'FACEBOOK' | 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN' | 'WHATSAPP' | 'EMAIL',
    content: '',
    imageUrl: '',
    linkUrl: '',
    scheduledDate: ''
  });

  const [referralForm, setReferralForm] = useState({
    name: '',
    description: '',
    referrerReward: 0,
    refereeReward: 0,
    rewardType: 'FIXED' as 'FIXED' | 'PERCENTAGE',
    minBookingAmount: 0,
    maxReferralsPerUser: 0
  });

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Load fleets on component mount
  useEffect(() => {
    if (user?.id) {
      loadFleets();
    }
  }, [user?.id]);

  const loadFleets = async () => {
    try {
      const fleetData = await fetchFleets();
      setFleets(fleetData || []);
    } catch (error) {
      console.error('Error loading fleets:', error);
    }
  };

  const handleCreatePromoCode = async () => {
    try {
      setShowPromoModal(true);
    } catch (error) {
      setErrorMessage('Failed to open promo code form');
    }
  };

  const handleCreateCampaign = async () => {
    try {
      setShowCampaignModal(true);
    } catch (error) {
      setErrorMessage('Failed to open campaign form');
    }
  };

  const handleCreateReferralProgram = async () => {
    try {
      setShowReferralModal(true);
    } catch (error) {
      setErrorMessage('Failed to open referral program form');
    }
  };

  const handleSubmitPromoCode = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // Basic validation
      if (!promoForm.name || !promoForm.code || !promoForm.description) {
        setErrorMessage('Please fill in all required fields');
        return;
      }

      if (promoForm.discountValue <= 0) {
        setErrorMessage('Discount value must be greater than 0');
        return;
      }

      if (!promoForm.startDate || !promoForm.endDate) {
        setErrorMessage('Please select start and end dates');
        return;
      }

      if (new Date(promoForm.endDate) <= new Date(promoForm.startDate)) {
        setErrorMessage('End date must be after start date');
        return;
      }

      await createPromoCode({
        ...promoForm,
        start_date: promoForm.startDate,
        end_date: promoForm.endDate,
        applicable_fleets: promoForm.applicableFleets
      });
      setShowPromoModal(false);
      setPromoForm({
        name: '',
        code: '',
        description: '',
        discountType: 'FIXED',
        discountValue: 0,
        minAmount: 0,
        maxDiscount: 0,
        usageLimit: 100,
        startDate: '',
        endDate: '',
        applicableFleets: []
      });
      setSuccessMessage('Promo code created successfully!');
    } catch (error) {
      setErrorMessage('Failed to create promo code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCampaign = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // Basic validation
      if (!campaignForm.name || !campaignForm.content) {
        setErrorMessage('Please fill in campaign name and content');
        return;
      }

      await createCampaign({
        ...campaignForm,
        scheduled_date: campaignForm.scheduledDate
      });
      setShowCampaignModal(false);
      setCampaignForm({
        name: '',
        platform: 'FACEBOOK',
        content: '',
        imageUrl: '',
        linkUrl: '',
        scheduledDate: ''
      });
      setSuccessMessage('Campaign created successfully!');
    } catch (error) {
      setErrorMessage('Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReferralProgram = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');

      // Basic validation
      if (!referralForm.name || !referralForm.description) {
        setErrorMessage('Please fill in program name and description');
        return;
      }

      if (referralForm.referrerReward <= 0 || referralForm.refereeReward <= 0) {
        setErrorMessage('Reward amounts must be greater than 0');
        return;
      }

      await createReferralProgram({
        ...referralForm
      });
      setShowReferralModal(false);
      setReferralForm({
        name: '',
        description: '',
        referrerReward: 0,
        refereeReward: 0,
        rewardType: 'FIXED',
        minBookingAmount: 0,
        maxReferralsPerUser: 0
      });
      setSuccessMessage('Referral program created successfully!');
    } catch (error) {
      setErrorMessage('Failed to create referral program');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setSuccessMessage('Code copied to clipboard!');
  };

  const handleTogglePromoCode = async (id: string, currentStatus: boolean) => {
    try {
      await togglePromoCodeStatus(id, !currentStatus);
      setSuccessMessage('Promo code status updated!');
    } catch (error) {
      setErrorMessage('Failed to update promo code status');
    }
  };

  const exportData = (type: string) => {
    // Implementation for data export
    setSuccessMessage(`${type} data exported successfully!`);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
                         <div>
               <p className="text-sm font-medium text-gray-600">Active Promo Codes</p>
               <p className="text-2xl font-bold text-gray-900">{stats?.active_promo_codes || 0}</p>
             </div>
             <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
               <FaGift className="text-xl" />
             </div>
           </div>
           <div className="mt-4">
             <span className="text-sm text-gray-600">
               {stats?.total_discounts_given || 0} total discounts given
             </span>
           </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
               <p className="text-2xl font-bold text-gray-900">{stats?.active_campaigns || 0}</p>
             </div>
             <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
               <FaBullhorn className="text-xl" />
             </div>
           </div>
           <div className="mt-4">
             <span className="text-sm text-gray-600">
               {(stats?.total_engagement || 0).toLocaleString()} total engagement
             </span>
           </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">Total Referrals</p>
               <p className="text-2xl font-bold text-gray-900">{stats?.total_referrals || 0}</p>
             </div>
             <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
               <FaUserPlus className="text-xl" />
             </div>
           </div>
           <div className="mt-4">
             <span className="text-sm text-gray-600">
               {money(stats?.total_rewards_paid || 0)} rewards paid
             </span>
           </div>
         </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">12.5%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
              <FaChartLine className="text-xl" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600">
              +2.3% from last month
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/partner/marketing/promo-codes"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
          >
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <FaGift className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Manage Promo Codes</p>
              <p className="text-sm text-gray-600">Create and manage discount codes</p>
            </div>
          </a>

          <button
            onClick={handleCreateCampaign}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <FaPlus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Launch Campaign</p>
              <p className="text-sm text-gray-600">Create social media campaign</p>
            </div>
          </button>

          <a
            href="/partner/marketing/referral-programs"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors block"
          >
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <FaUsers className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Referral Programs</p>
              <p className="text-sm text-gray-600">Set up customer referral rewards</p>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <FaGift className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">SUMMER20 promo code used</p>
              <p className="text-xs text-gray-600">2 minutes ago</p>
            </div>
            <span className="text-sm text-green-600 font-medium">+£45</span>
          </div>

          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <FaShareAlt className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Campaign shared on Facebook</p>
              <p className="text-xs text-gray-600">15 minutes ago</p>
            </div>
            <span className="text-sm text-blue-600 font-medium">+23 views</span>
          </div>

          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <FaUserPlus className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">New referral signup</p>
              <p className="text-xs text-gray-600">1 hour ago</p>
            </div>
            <span className="text-sm text-purple-600 font-medium">+£25 reward</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPromoCodes = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Promo Codes ({promoCodes.length})
          </h3>
          <button
            onClick={handleCreatePromoCode}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <FaPlus />
            Create Promo Code
          </button>
        </div>
      </div>

      {promoCodes.length === 0 ? (
        <div className="p-8 text-center">
          <FaGift className="text-gray-400 text-4xl mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No promo codes found</p>
          <p className="text-gray-400">Create your first promo code to start attracting customers</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {promoCodes.map((promo) => (
            <div key={promo.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                        <FaGift className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{promo.name}</h4>
                        <p className="text-sm text-gray-600">{promo.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Code</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-purple-600">{promo.code}</p>
                        <button
                          onClick={() => handleCopyCode(promo.code)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <FaCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Discount</p>
                                             <p className="text-lg font-bold text-gray-900">
                         {promo.discount_type === 'PERCENTAGE' ? `${promo.discount_value}%` : money(promo.discount_value)}
                       </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Usage</p>
                      <p className="text-sm text-gray-900">
                        {promo.used_count} / {promo.usage_limit}
                      </p>
                    </div>
                                         <div>
                       <p className="text-sm font-medium text-gray-600">Valid Until</p>
                       <p className="text-sm text-gray-900">{formatDate(promo.end_date)}</p>
                     </div>
                     <div>
                       <p className="text-sm font-medium text-gray-600">Applicable Fleets</p>
                       <p className="text-sm text-gray-900">
                         {promo.applicable_fleets?.length > 0 
                           ? promo.applicable_fleets.join(', ') 
                           : 'All Fleets'
                         }
                       </p>
                     </div>
                   </div>

                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                      promo.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {promo.is_active ? 'Active' : 'Inactive'}
                    </span>
                                         <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border-purple-200">
                       {promo.discount_type === 'PERCENTAGE' ? 'Percentage' : 'Fixed'}
                     </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                                     <button
                     onClick={() => handleTogglePromoCode(promo.id, promo.is_active)}
                     className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
                       promo.is_active 
                         ? 'bg-red-600 text-white hover:bg-red-700' 
                         : 'bg-green-600 text-white hover:bg-green-700'
                     }`}
                   >
                    {promo.is_active ? <FaTimes /> : <FaCheck />}
                    {promo.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <FaEllipsisH />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCampaigns = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Social Media Campaigns ({campaigns.length})
          </h3>
          <button
            onClick={handleCreateCampaign}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaPlus />
            Create Campaign
          </button>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="p-8 text-center">
          <FaBullhorn className="text-gray-400 text-4xl mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No campaigns found</p>
          <p className="text-gray-400">Create your first social media campaign</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPlatformColor(campaign.platform)}`}>
                        {getPlatformIcon(campaign.platform)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{campaign.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{campaign.platform}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-700 mb-2">{campaign.content}</p>
                    {campaign.link_url && (
                      <a href={campaign.link_url} className="text-sm text-blue-600 hover:underline">
                        {campaign.link_url}
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Views</p>
                      <p className="text-lg font-bold text-gray-900">{campaign.engagement_metrics.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Clicks</p>
                      <p className="text-lg font-bold text-gray-900">{campaign.engagement_metrics.clicks}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Shares</p>
                      <p className="text-lg font-bold text-gray-900">{campaign.engagement_metrics.shares}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conversions</p>
                      <p className="text-lg font-bold text-gray-900">{campaign.engagement_metrics.conversions}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(campaign.status)}`}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </span>
                    {campaign.scheduled_date && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border-blue-200">
                        <FaCalendarAlt className="mr-1" />
                        {formatDate(campaign.scheduled_date)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1">
                    <FaEye />
                    View
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <FaEllipsisH />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReferrals = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Referral Programs ({referralPrograms.length})
          </h3>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
            <FaPlus />
            Create Program
          </button>
        </div>
      </div>

      {referralPrograms.length === 0 ? (
        <div className="p-8 text-center">
          <FaHandshake className="text-gray-400 text-4xl mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No referral programs found</p>
          <p className="text-gray-400">Create a referral program to encourage word-of-mouth marketing</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {referralPrograms.map((program) => (
            <div key={program.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                        <FaHandshake className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{program.name}</h4>
                        <p className="text-sm text-gray-600">{program.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Referrer Reward</p>
                                             <p className="text-lg font-bold text-green-600">
                         {program.reward_type === 'PERCENTAGE' ? `${program.referrer_reward}%` : money(program.referrer_reward)}
                       </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Referee Reward</p>
                                             <p className="text-lg font-bold text-blue-600">
                         {program.reward_type === 'PERCENTAGE' ? `${program.referee_reward}%` : money(program.referee_reward)}
                       </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                      <p className="text-lg font-bold text-gray-900">{program.total_referrals}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rewards Paid</p>
                      <p className="text-lg font-bold text-gray-900">{money(program.total_rewards_paid)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                      program.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {program.is_active ? 'Active' : 'Inactive'}
                    </span>
                                         <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border-green-200">
                       {program.reward_type === 'PERCENTAGE' ? 'Percentage' : 'Fixed'}
                     </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1">
                    <FaEye />
                    View Details
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <FaEllipsisH />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{money(125000)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <FaMoneyBillWave className="text-xl" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600">
              +15.3% from last month
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">12.5%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <FaChartPie className="text-xl" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600">
              +2.1% from last month
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customer Acquisition</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <FaUsers className="text-xl" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600">
              +8.7% from last month
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ROI</p>
              <p className="text-2xl font-bold text-gray-900">3.2x</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
              <FaChartLine className="text-xl" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600">
              +0.4x from last month
            </span>
          </div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart will be displayed here</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <FaBullhorn className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Marketing Dashboard</h1>
                <p className="text-sm text-gray-600">Manage your promotional activities</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Partner
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FaCheck className="text-green-600" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-red-600" />
              <p className="text-red-800">{errorMessage}</p>
            </div>
            <button 
              onClick={reload}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaChartLine className="inline mr-2" />
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('promoCodes')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'promoCodes' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaGift className="inline mr-2" />
              Promo Codes
            </button>
            <button 
              onClick={() => setActiveTab('campaigns')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'campaigns' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaBullhorn className="inline mr-2" />
              Campaigns
            </button>
            <button 
              onClick={() => setActiveTab('referrals')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'referrals' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaHandshake className="inline mr-2" />
              Referrals
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'analytics' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaChartPie className="inline mr-2" />
              Analytics
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading marketing data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-100 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
            <button 
              onClick={reload}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Tab Content */}
        {!loading && !error && (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'promoCodes' && renderPromoCodes()}
            {activeTab === 'campaigns' && renderCampaigns()}
            {activeTab === 'referrals' && renderReferrals()}
            {activeTab === 'analytics' && renderAnalytics()}
          </>
        )}

        {/* Promo Code Modal */}
        {showPromoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create Promo Code</h3>
                <button
                  onClick={() => setShowPromoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={promoForm.name}
                      onChange={(e) => setPromoForm({...promoForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Welcome Discount"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="WELCOME50"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea
                    value={promoForm.description}
                    onChange={(e) => setPromoForm({...promoForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="£50 off first booking"
                    rows={3}
                    required
                  />
                </div>
                
                {/* Discount Configuration */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Discount Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Discount Type</label>
                      <select
                        value={promoForm.discountType}
                        onChange={(e) => setPromoForm({...promoForm, discountType: e.target.value as 'FIXED' | 'PERCENTAGE'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="FIXED">Fixed Amount</option>
                        <option value="PERCENTAGE">Percentage</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Discount Value <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={promoForm.discountValue || ''}
                        onChange={(e) => setPromoForm({...promoForm, discountValue: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="50"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* Usage & Limits */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Usage & Limits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Usage Limit <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={promoForm.usageLimit || ''}
                        onChange={(e) => setPromoForm({...promoForm, usageLimit: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="100"
                        min="1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Min Amount</label>
                      <input
                        type="number"
                        value={promoForm.minAmount || ''}
                        onChange={(e) => setPromoForm({...promoForm, minAmount: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Date Range */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Date Range</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Start Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={promoForm.startDate}
                        onChange={(e) => setPromoForm({...promoForm, startDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">End Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        value={promoForm.endDate}
                        onChange={(e) => setPromoForm({...promoForm, endDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* Fleet Selection */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Fleet Selection</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Applicable Fleets</label>
                    <select
                      multiple
                      value={promoForm.applicableFleets}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setPromoForm({...promoForm, applicableFleets: selected});
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                    >
                      {fleets.length > 0 ? (
                        fleets.map((fleet) => (
                          <option key={fleet.id} value={fleet.name}>
                            {fleet.name} ({fleet.vehicles?.length || 0} vehicles)
                          </option>
                        ))
                      ) : (
                        <option disabled>No fleets available</option>
                      )}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple fleets. Leave empty to apply to all fleets.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPromoModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPromoCode}
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    isSubmitting 
                      ? 'bg-purple-400 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Promo Code'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Modal */}
        {showCampaignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create Campaign</h3>
                <button
                  onClick={() => setShowCampaignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Summer Fleet Promotion"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Platform <span className="text-red-500">*</span></label>
                    <select
                      value={campaignForm.platform}
                      onChange={(e) => setCampaignForm({...campaignForm, platform: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="FACEBOOK">Facebook</option>
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="TWITTER">Twitter</option>
                      <option value="LINKEDIN">LinkedIn</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="EMAIL">Email</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content <span className="text-red-500">*</span></label>
                  <textarea
                    value={campaignForm.content}
                    onChange={(e) => setCampaignForm({...campaignForm, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Book your summer adventure with our premium fleet! 🚗✨"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                  <input
                    type="url"
                    value={campaignForm.imageUrl}
                    onChange={(e) => setCampaignForm({...campaignForm, imageUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (Optional)</label>
                  <input
                    type="url"
                    value={campaignForm.linkUrl}
                    onChange={(e) => setCampaignForm({...campaignForm, linkUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/summer-promo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date (Optional)</label>
                  <input
                    type="datetime-local"
                    value={campaignForm.scheduledDate}
                    onChange={(e) => setCampaignForm({...campaignForm, scheduledDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCampaignModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitCampaign}
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    isSubmitting 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Campaign'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Referral Program Modal */}
        {showReferralModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create Referral Program</h3>
                <button
                  onClick={() => setShowReferralModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={referralForm.name}
                      onChange={(e) => setReferralForm({...referralForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Refer & Earn"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reward Type</label>
                    <select
                      value={referralForm.rewardType}
                      onChange={(e) => setReferralForm({...referralForm, rewardType: e.target.value as 'FIXED' | 'PERCENTAGE'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="FIXED">Fixed Amount</option>
                      <option value="PERCENTAGE">Percentage</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea
                    value={referralForm.description}
                    onChange={(e) => setReferralForm({...referralForm, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Earn rewards for every successful referral"
                    rows={3}
                    required
                  />
                </div>
                
                {/* Reward Configuration */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Reward Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Referrer Reward <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={referralForm.referrerReward}
                        onChange={(e) => setReferralForm({...referralForm, referrerReward: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="25"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Referee Reward <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={referralForm.refereeReward}
                        onChange={(e) => setReferralForm({...referralForm, refereeReward: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="10"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* Program Limits */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Program Limits</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Min Booking Amount</label>
                      <input
                        type="number"
                        value={referralForm.minBookingAmount}
                        onChange={(e) => setReferralForm({...referralForm, minBookingAmount: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Max Referrals Per User</label>
                      <input
                        type="number"
                        value={referralForm.maxReferralsPerUser}
                        onChange={(e) => setReferralForm({...referralForm, maxReferralsPerUser: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0 (unlimited)"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                

              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowReferralModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReferralProgram}
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    isSubmitting 
                      ? 'bg-green-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Program'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 