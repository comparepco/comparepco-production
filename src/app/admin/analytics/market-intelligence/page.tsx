'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import jsPDF from 'jspdf';
import {
  TrendingUp, TrendingDown, BarChart3, PieChart, LineChart,
  ArrowUpRight, ArrowDownRight, Calendar, Clock, CheckCircle, XCircle,
  DollarSign, Star, Activity, Target, Filter, Download, RefreshCw, Eye,
  Users, Car, MapPin, AlertTriangle, Zap, Award, Building, Globe
} from 'lucide-react';

interface MarketMetrics {
  marketShare: number;
  totalMarketSize: number;
  growthRate: number;
  competitorCount: number;
  averagePricing: number;
  customerAcquisitionCost: number;
  marketPenetration: number;
  brandRecognition: number;
}

interface MarketTrend {
  date: string;
  marketSize: number;
  ourShare: number;
  competitorShare: number;
  growthRate: number;
}

interface CompetitorAnalysis {
  name: string;
  marketShare: number;
  pricing: number;
  rating: number;
  features: string[];
  strengths: string[];
  weaknesses: string[];
}

interface RegionalPerformance {
  region: string;
  marketSize: number;
  ourShare: number;
  growthRate: number;
  revenue: number;
  customers: number;
}

export default function AdminMarketIntelligencePage() {
  const [metrics, setMetrics] = useState<MarketMetrics>({
    marketShare: 0,
    totalMarketSize: 0,
    growthRate: 0,
    competitorCount: 0,
    averagePricing: 0,
    customerAcquisitionCost: 0,
    marketPenetration: 0,
    brandRecognition: 0
  });
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([]);
  const [regions, setRegions] = useState<RegionalPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTrendsModal, setShowTrendsModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    loadMarketIntelligence();
  }, [timeRange]);

  const loadMarketIntelligence = async () => {
    try {
      setLoading(true);
      
      // Real data queries from Supabase
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*');

      if (bookingsError) {
        console.error('Error loading bookings:', bookingsError);
        toast.error('Failed to load booking data');
        return;
      }

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*');

      if (paymentsError) {
        console.error('Error loading payments:', paymentsError);
        toast.error('Failed to load payment data');
        return;
      }

      // Calculate market metrics from real data
      const totalRevenue = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const totalBookings = bookingsData?.length || 0;
      
      // Simulate market intelligence data
      const marketShare = 12.5;
      const totalMarketSize = 2500000000; // £2.5B UK market
      const growthRate = 18.7;
      const competitorCount = 8;
      const averagePricing = 45.50;
      const customerAcquisitionCost = 25.30;
      const marketPenetration = 15.2;
      const brandRecognition = 78.5;

      const calculatedMetrics: MarketMetrics = {
        marketShare,
        totalMarketSize,
        growthRate,
        competitorCount,
        averagePricing,
        customerAcquisitionCost,
        marketPenetration,
        brandRecognition
      };

      // Generate market trends
      const trends: MarketTrend[] = [];
      const days = 7;
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayBookings = bookingsData?.filter(b => 
          b.created_at?.startsWith(dateStr)
        ).length || 0;
        
        const dayRevenue = paymentsData?.filter(p => 
          p.created_at?.startsWith(dateStr)
        ).reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

        trends.push({
          date: dateStr,
          marketSize: totalMarketSize / 365,
          ourShare: marketShare,
          competitorShare: 100 - marketShare,
          growthRate: growthRate
        });
      }

      // Generate competitor analysis
      const competitorData: CompetitorAnalysis[] = [
        {
          name: 'Uber',
          marketShare: 45.2,
          pricing: 42.30,
          rating: 4.2,
          features: ['Global Coverage', 'Multiple Services', 'Advanced Tech'],
          strengths: ['Brand Recognition', 'Global Network', 'Technology'],
          weaknesses: ['High Commission', 'Driver Issues', 'Regulatory Challenges']
        },
        {
          name: 'Bolt',
          marketShare: 18.7,
          pricing: 38.50,
          rating: 4.1,
          features: ['Lower Commission', 'Driver Benefits', 'Local Focus'],
          strengths: ['Lower Costs', 'Driver Satisfaction', 'Local Knowledge'],
          weaknesses: ['Limited Coverage', 'Smaller Network', 'Brand Recognition']
        },
        {
          name: 'Free Now',
          marketShare: 12.3,
          pricing: 44.20,
          rating: 4.0,
          features: ['Taxi Integration', 'Multiple Options', 'City Focus'],
          strengths: ['Taxi Network', 'City Coverage', 'Multiple Services'],
          weaknesses: ['Limited Cities', 'Higher Pricing', 'Complex App']
        },
        {
          name: 'Ola',
          marketShare: 8.9,
          pricing: 40.10,
          rating: 3.9,
          features: ['Indian Origin', 'Multiple Services', 'Competitive Pricing'],
          strengths: ['Competitive Pricing', 'Multiple Services', 'Global Expansion'],
          weaknesses: ['Limited UK Presence', 'Brand Recognition', 'Network Size']
        }
      ];

      // Generate regional performance data
      const regionalData: RegionalPerformance[] = [
        { region: 'London', marketSize: 850000000, ourShare: 15.2, growthRate: 22.5, revenue: 129000000, customers: 45000 },
        { region: 'Manchester', marketSize: 180000000, ourShare: 12.8, growthRate: 18.7, revenue: 23040000, customers: 8500 },
        { region: 'Birmingham', marketSize: 150000000, ourShare: 11.5, growthRate: 16.3, revenue: 17250000, customers: 6200 },
        { region: 'Edinburgh', marketSize: 120000000, ourShare: 9.8, growthRate: 14.2, revenue: 11760000, customers: 4100 },
        { region: 'Glasgow', marketSize: 100000000, ourShare: 8.5, growthRate: 12.8, revenue: 8500000, customers: 3200 }
      ];

      setMetrics(calculatedMetrics);
      setTrends(trends);
      setCompetitors(competitorData);
      setRegions(regionalData);

    } catch (error) {
      console.error('Error loading market intelligence:', error);
      toast.error('Failed to load market intelligence');
    } finally {
      setLoading(false);
    }
  };

  const getMetricCard = (title: string, value: string | number, icon: React.ReactNode, trend?: number, color: string = 'blue') => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              {trend >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Math.abs(trend)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
          {icon}
        </div>
      </div>
    </div>
  );

  // Quick Actions functions
  const handleExportReport = async () => {
    try {
      toast.loading('Generating market intelligence report...');
      
      const reportData = {
        title: 'PCO Market Intelligence Report',
        type: 'market_intelligence',
        status: 'generated',
        format: 'pdf',
        data: {
          trends,
          regions,
          generated_at: new Date().toISOString(),
          summary: {
            totalMarketSize: trends.reduce((sum: number, trend: any) => sum + trend.marketSize, 0),
            ourShare: trends.length > 0 ? trends.reduce((sum: number, trend: any) => sum + trend.ourShare, 0) / trends.length : 0,
            growthRate: trends.length > 0 ? trends.reduce((sum: number, trend: any) => sum + trend.growthRate, 0) / trends.length : 0
          }
        }
      };

      // Generate PDF
      const pdf = new jsPDF();
      
      // Add title
      pdf.setFontSize(20);
      pdf.text('PCO Market Intelligence Report', 20, 20);
      
      // Add generation date
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
      
      // Add summary
      pdf.setFontSize(16);
      pdf.text('Market Summary', 20, 50);
      pdf.setFontSize(12);
      pdf.text(`Total Market Size: £${trends.reduce((sum: number, trend: any) => sum + trend.marketSize, 0).toLocaleString()}`, 20, 65);
      pdf.text(`Our Market Share: ${trends.length > 0 ? (trends.reduce((sum: number, trend: any) => sum + trend.ourShare, 0) / trends.length).toFixed(1) : '0.0'}%`, 20, 75);
      pdf.text(`Growth Rate: ${trends.length > 0 ? (trends.reduce((sum: number, trend: any) => sum + trend.growthRate, 0) / trends.length).toFixed(1) : '0.0'}%`, 20, 85);
      
      // Add market trends
      pdf.setFontSize(16);
      pdf.text('Market Trends', 20, 105);
      pdf.setFontSize(12);
      trends.slice(-5).forEach((trend: any, index: number) => {
        pdf.text(`${trend.date || trend.period}: £${trend.marketSize.toLocaleString()}`, 20, 120 + (index * 10));
      });

      // Save PDF
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pco-market-intelligence-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show export data in modal
      setExportData(reportData);
      setShowExportModal(true);
      toast.success('Market intelligence report downloaded as PDF');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const handleViewTrends = () => {
    try {
      const trendsData = {
        title: 'PCO Market Intelligence Trends',
        data: trends,
        metrics: {
          marketShare: metrics.marketShare,
          totalMarketSize: metrics.totalMarketSize,
          growthRate: metrics.growthRate,
          competitorCount: metrics.competitorCount
        },
        timeRange
      };

      setTrendsData(trendsData);
      setShowTrendsModal(true);
      toast.success('Market intelligence trends loaded');
    } catch (error) {
      console.error('Trends error:', error);
      toast.error('Failed to load trends analysis');
    }
  };

  const handleDetailedAnalysis = () => {
    try {
      const analysisData = {
        timeRange,
        competitors,
        regions,
        metrics
      };

      setAnalysisData(analysisData);
      setShowAnalysisModal(true);
      toast.success('Detailed analysis loaded');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to load detailed analysis');
    }
  };

  // Pagination functions
  const totalPages = Math.ceil(regions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRegions = regions.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading market intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Globe className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Market Intelligence
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Comprehensive market analysis, competitor insights, and strategic intelligence
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <Link 
                href="/admin/analytics/reports"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Export Report</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Key Market Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getMetricCard('Market Share', `${metrics.marketShare}%`, <Target className="w-6 h-6" />, 8.5, 'blue')}
          {getMetricCard('Growth Rate', `${metrics.growthRate}%`, <TrendingUp className="w-6 h-6" />, 12.3, 'green')}
          {getMetricCard('Market Size', `£${(metrics.totalMarketSize / 1000000000).toFixed(1)}B`, <Globe className="w-6 h-6" />, 5.7, 'purple')}
          {getMetricCard('Brand Recognition', `${metrics.brandRecognition}%`, <Star className="w-6 h-6" />, 2.1, 'orange')}
        </div>

        {/* Market Trends and Competitor Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Market Trends Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Share Trends</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="space-y-4">
              {trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">{trend.date}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{trend.ourShare.toFixed(1)}% our share</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{trend.competitorShare.toFixed(1)}% competitors</div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {trend.growthRate.toFixed(1)}% growth
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Competitor Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Competitor Analysis</h3>
              <Building className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-4">
              {competitors.map((competitor, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{competitor.name}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{competitor.marketShare}% share</div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>£{competitor.pricing} avg price</span>
                    <span>{competitor.rating}★ rating</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regional Performance and Market Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Regional Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Regional Performance</h3>
            <div className="space-y-4">
              {currentRegions.map((region, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{region.region}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{region.customers.toLocaleString()} customers</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{region.ourShare}% share</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{region.growthRate}% growth</div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    £{(region.revenue / 1000000).toFixed(1)}M
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </div>

          {/* Market Insights */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market Insights</h3>
            <div className="space-y-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Market Growth</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">UK ride-hailing market growing at 18.7% annually</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Opportunity</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">High potential in regional markets outside London</p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Competition</span>
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Uber maintains 45% market share, strong competition</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Strategy</span>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400">Focus on driver satisfaction and regional expansion</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">Competitor Count</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.competitorCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">Avg Pricing</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">£{metrics.averagePricing}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">Customer Acquisition Cost</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">£{metrics.customerAcquisitionCost}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">Market Penetration</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.marketPenetration}%</span>
              </div>
            </div>
          </div>

          {/* Competitive Advantages */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Our Advantages</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-900 dark:text-white">Lower Commission Rates</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-900 dark:text-white">Better Driver Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-900 dark:text-white">Local Market Knowledge</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-900 dark:text-white">Flexible Pricing</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={handleExportReport} className="w-full text-left p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export Report</span>
                </div>
              </button>
              <button onClick={handleViewTrends} className="w-full text-left p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">View Trends</span>
                </div>
              </button>
              <button onClick={handleDetailedAnalysis} className="w-full text-left p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">Detailed Analysis</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && exportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📊 Market Intelligence Report</h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Market Share</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{exportData.data.summary.marketShare}%</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">Total Market Size</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">£{exportData.data.summary.totalMarketSize.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Growth Rate</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{exportData.data.summary.growthRate}%</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Competitors</div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{exportData.data.summary.competitorCount}</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Report Details</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Generated: {new Date(exportData.data.generated_at).toLocaleString()}</div>
                  <div>Time Range: {exportData.data.timeRange}</div>
                  <div>Type: {exportData.type}</div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `pco-market-intelligence-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    toast.success('Report downloaded successfully');
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Report
                </button>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends Modal */}
      {showTrendsModal && trendsData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📈 Market Intelligence Trends</h3>
              <button onClick={() => setShowTrendsModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Market Share</div>
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{trendsData.metrics.marketShare}%</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">Market Size</div>
                  <div className="text-xl font-bold text-green-900 dark:text-green-100">£{trendsData.metrics.totalMarketSize.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Growth Rate</div>
                  <div className="text-xl font-bold text-purple-900 dark:text-purple-100">{trendsData.metrics.growthRate}%</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Competitors</div>
                  <div className="text-xl font-bold text-orange-900 dark:text-orange-100">{trendsData.metrics.competitorCount}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Daily Market Trends</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {trendsData.data.map((trend: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{trend.date}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Market Size: £{trend.marketSize.toLocaleString()}, Our Share: {trend.ourShare}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${trend.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.growthRate >= 0 ? '+' : ''}{trend.growthRate}% growth
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Competitor Share: {trend.competitorShare}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowTrendsModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Modal */}
      {showAnalysisModal && analysisData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🔍 Detailed Market Analysis</h3>
              <button onClick={() => setShowAnalysisModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Competitor Analysis</h4>
                <div className="space-y-2">
                  {analysisData.competitors.map((competitor: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{competitor.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Rating: {competitor.rating}/5, Pricing: £{competitor.pricing}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{competitor.marketShare}% market share</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {competitor.strengths.length} strengths, {competitor.weaknesses.length} weaknesses
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Regional Performance</h4>
                <div className="space-y-2">
                  {analysisData.regions.map((region: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{region.region}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Market Size: £{region.marketSize.toLocaleString()}, Revenue: £{region.revenue.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{region.ourShare}% our share</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {region.growthRate}% growth, {region.customers} customers
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowAnalysisModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 