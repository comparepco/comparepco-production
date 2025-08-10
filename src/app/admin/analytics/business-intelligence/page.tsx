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
  Users, Car, MapPin, AlertTriangle, Zap, Award, Building, Briefcase, Lightbulb, Brain
} from 'lucide-react';

interface BusinessMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  customerSatisfaction: number;
  marketShare: number;
  operationalEfficiency: number;
  customerRetention: number;
  profitMargin: number;
  employeeProductivity: number;
}

interface BusinessInsight {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral' | 'opportunity' | 'risk' | 'metric' | 'trend';
  impact: 'high' | 'medium' | 'low';
  category: string;
  value: string;
  trend: number;
  recommendation: string;
}

interface StrategicKPI {
  name: string;
  current: number;
  target: number;
  unit: string;
  status: 'on-track' | 'ahead' | 'behind' | 'at-risk';
  trend: number;
}

interface MarketOpportunity {
  category: string;
  potential: number;
  current: number;
  growth: number;
  difficulty: 'low' | 'medium' | 'high';
  timeframe: string;
}

export default function AdminBusinessIntelligencePage() {
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    totalRevenue: 0,
    revenueGrowth: 0,
    customerSatisfaction: 0,
    marketShare: 0,
    operationalEfficiency: 0,
    customerRetention: 0,
    profitMargin: 0,
    employeeProductivity: 0
  });
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [kpis, setKpis] = useState<StrategicKPI[]>([]);
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
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
    loadBusinessIntelligence();
  }, [timeRange]);

  const loadBusinessIntelligence = async () => {
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

      // Calculate business metrics from real data
      const totalRevenue = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const totalBookings = bookingsData?.length || 0;
      
      // Simulate business intelligence data
      const revenueGrowth = 18.7;
      const customerSatisfaction = 4.2;
      const marketShare = 12.5;
      const operationalEfficiency = 87.3;
      const customerRetention = 92.1;
      const profitMargin = 23.5;
      const employeeProductivity = 94.2;

      const calculatedMetrics: BusinessMetrics = {
        totalRevenue,
        revenueGrowth,
        customerSatisfaction,
        marketShare,
        operationalEfficiency,
        customerRetention,
        profitMargin,
        employeeProductivity
      };

      // Generate business insights
      const insightsData: BusinessInsight[] = [
        {
          id: '1',
          title: 'Revenue Growth Acceleration',
          description: 'Monthly revenue growth increased by 15% compared to last quarter',
          type: 'positive',
          impact: 'high',
          category: 'Financial',
          value: '+15%',
          trend: 15,
          recommendation: 'Continue current marketing strategies and expand to new regions'
        },
        {
          id: '2',
          title: 'Customer Satisfaction Decline',
          description: 'Customer satisfaction scores dropped by 0.3 points this month',
          type: 'negative',
          impact: 'medium',
          category: 'Customer',
          value: '-0.3',
          trend: -0.3,
          recommendation: 'Review customer support processes and driver training programs'
        },
        {
          id: '3',
          title: 'Market Share Opportunity',
          description: 'Potential to capture 3% additional market share in regional markets',
          type: 'opportunity',
          impact: 'high',
          category: 'Market',
          value: '+3%',
          trend: 3,
          recommendation: 'Increase marketing spend in target regional markets'
        },
        {
          id: '4',
          title: 'Operational Efficiency Improvement',
          description: 'Fleet utilization increased by 8% through better scheduling',
          type: 'positive',
          impact: 'medium',
          category: 'Operations',
          value: '+8%',
          trend: 8,
          recommendation: 'Implement similar scheduling optimizations across all regions'
        },
        {
          id: '5',
          title: 'Competitive Pricing Risk',
          description: 'Competitors reduced prices by 5% in key markets',
          type: 'risk',
          impact: 'high',
          category: 'Competition',
          value: '-5%',
          trend: -5,
          recommendation: 'Analyze pricing strategy and consider targeted promotions'
        }
      ];

      // Generate strategic KPIs
      const kpisData: StrategicKPI[] = [
        { name: 'Revenue Growth', current: 18.7, target: 20, unit: '%', status: 'on-track', trend: 2.3 },
        { name: 'Market Share', current: 12.5, target: 15, unit: '%', status: 'behind', trend: -2.5 },
        { name: 'Customer Satisfaction', current: 4.2, target: 4.5, unit: '/5', status: 'behind', trend: -0.3 },
        { name: 'Operational Efficiency', current: 87.3, target: 90, unit: '%', status: 'on-track', trend: 2.7 },
        { name: 'Customer Retention', current: 92.1, target: 95, unit: '%', status: 'behind', trend: -2.9 },
        { name: 'Profit Margin', current: 23.5, target: 25, unit: '%', status: 'on-track', trend: 1.5 }
      ];

      // Generate market opportunities
      const opportunitiesData: MarketOpportunity[] = [
        { category: 'Regional Expansion', potential: 2500000, current: 500000, growth: 400, difficulty: 'medium', timeframe: '6 months' },
        { category: 'Premium Services', potential: 1800000, current: 300000, growth: 500, difficulty: 'low', timeframe: '3 months' },
        { category: 'Corporate Partnerships', potential: 3200000, current: 800000, growth: 300, difficulty: 'high', timeframe: '12 months' },
        { category: 'Technology Integration', potential: 1500000, current: 200000, growth: 650, difficulty: 'medium', timeframe: '9 months' }
      ];

      setMetrics(calculatedMetrics);
      setInsights(insightsData);
      setKpis(kpisData);
      setOpportunities(opportunitiesData);

    } catch (error) {
      console.error('Error loading business intelligence:', error);
      toast.error('Failed to load business intelligence');
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
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs target</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      case 'negative': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300';
      case 'opportunity': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
      case 'risk': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
      default: return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingUp className="w-4 h-4" />;
      case 'negative': return <TrendingDown className="w-4 h-4" />;
      case 'opportunity': return <Lightbulb className="w-4 h-4" />;
      case 'risk': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getKPIStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-green-600 dark:text-green-400';
      case 'ahead': return 'text-blue-600 dark:text-blue-400';
      case 'behind': return 'text-red-600 dark:text-red-400';
      case 'at-risk': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Quick Actions functions
  const handleExportReport = async () => {
    try {
      toast.loading('Generating business intelligence report...');
      
      const reportData = {
        title: 'PCO Business Intelligence Report',
        type: 'business_intelligence',
        status: 'generated',
        format: 'pdf',
        data: {
          businessInsights: insights, // Use insights state
          generated_at: new Date().toISOString(),
          summary: {
            totalInsights: insights.length,
            keyMetrics: insights.filter(insight => insight.type === 'metric').length,
            trends: insights.filter(insight => insight.type === 'trend').length
          }
        }
      };

      // Generate PDF
      const pdf = new jsPDF();
      
      // Add title
      pdf.setFontSize(20);
      pdf.text('PCO Business Intelligence Report', 20, 20);
      
      // Add generation date
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
      
      // Add summary
      pdf.setFontSize(16);
      pdf.text('Business Insights Summary', 20, 50);
      pdf.setFontSize(12);
      pdf.text(`Total Insights: ${insights.length}`, 20, 65);
      pdf.text(`Key Metrics: ${insights.filter(insight => insight.type === 'metric').length}`, 20, 75);
      pdf.text(`Trends: ${insights.filter(insight => insight.type === 'trend').length}`, 20, 85);
      
      // Add business insights
      pdf.setFontSize(16);
      pdf.text('Key Business Insights', 20, 105);
      pdf.setFontSize(12);
      insights.slice(0, 10).forEach((insight, index) => {
        const y = 120 + (index * 8);
        if (y < 280) { // Prevent overflow
          pdf.text(`${insight.title}: ${insight.value}`, 20, y);
        }
      });

      // Save PDF
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pco-business-intelligence-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show export data in modal
      setExportData(reportData);
      setShowExportModal(true);
      toast.success('Business intelligence report downloaded as PDF');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const handleViewTrends = () => {
    try {
      const trendsData = {
        title: 'PCO Business Intelligence Trends',
        data: {
          metrics,
          insights,
          kpis,
          opportunities
        },
        timeRange
      };

      setTrendsData(trendsData);
      setShowTrendsModal(true);
      toast.success('Business intelligence trends loaded');
    } catch (error) {
      console.error('Trends error:', error);
      toast.error('Failed to load trends analysis');
    }
  };

  const handleDetailedAnalysis = () => {
    try {
      const analysisData = {
        timeRange,
        insights,
        kpis,
        opportunities,
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
  const totalPages = Math.ceil(insights.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInsights = insights.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading business intelligence...</p>
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
                <Brain className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Business Intelligence
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Strategic insights, KPIs, and business analytics for informed decision-making
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
                  <span>Generate Report</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Key Business Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getMetricCard('Total Revenue', `£${(metrics.totalRevenue / 1000000).toFixed(1)}M`, <DollarSign className="w-6 h-6" />, metrics.revenueGrowth, 'green')}
          {getMetricCard('Market Share', `${metrics.marketShare}%`, <Target className="w-6 h-6" />, 2.5, 'blue')}
          {getMetricCard('Customer Satisfaction', `${metrics.customerSatisfaction}/5`, <Star className="w-6 h-6" />, -0.3, 'orange')}
          {getMetricCard('Operational Efficiency', `${metrics.operationalEfficiency}%`, <Zap className="w-6 h-6" />, 2.7, 'purple')}
        </div>

        {/* Business Insights and Strategic KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Business Insights */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Business Insights</h3>
              <Lightbulb className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="space-y-4">
              {insights.map((insight) => (
                <div key={insight.id} className={`p-4 rounded-lg ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getInsightIcon(insight.type)}
                      <h4 className="text-sm font-medium">{insight.title}</h4>
                    </div>
                    <span className="text-sm font-medium">{insight.value}</span>
                  </div>
                  <p className="text-xs mb-2">{insight.description}</p>
                  <div className="text-xs">
                    <strong>Recommendation:</strong> {insight.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic KPIs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Strategic KPIs</h3>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-4">
              {kpis.map((kpi, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{kpi.name}</span>
                      <span className={`text-xs font-medium ${getKPIStatusColor(kpi.status)}`}>
                        {kpi.status.replace('-', ' ')}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {kpi.current}{kpi.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Target: {kpi.target}{kpi.unit}</span>
                    <span className={kpi.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {kpi.trend >= 0 ? '+' : ''}{kpi.trend}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Opportunities and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Market Opportunities */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market Opportunities</h3>
            <div className="space-y-4">
              {opportunities.map((opportunity, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{opportunity.category}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{opportunity.timeframe}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        £{(opportunity.potential / 1000000).toFixed(1)}M potential
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {opportunity.growth}% growth
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Current: £{(opportunity.current / 1000000).toFixed(1)}M</span>
                    <span className={`px-2 py-1 rounded ${
                      opportunity.difficulty === 'low' ? 'bg-green-100 text-green-700' :
                      opportunity.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {opportunity.difficulty} difficulty
                    </span>
                  </div>
                </div>
              ))}
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

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">Revenue Growth</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.revenueGrowth}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">Profit Margin</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.profitMargin}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">Customer Retention</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.customerRetention}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">Market Share</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.marketShare}%</span>
              </div>
            </div>
          </div>

          {/* Operational Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Operational Metrics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">Operational Efficiency</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.operationalEfficiency}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">Employee Productivity</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.employeeProductivity}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">Customer Satisfaction</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.customerSatisfaction}/5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">System Uptime</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">99.8%</span>
              </div>
            </div>
          </div>

          {/* Strategic Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Strategic Recommendations</h3>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Expand Regional Markets</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">Focus on underserved regional markets for growth</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Improve Customer Experience</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400">Enhance support and driver training programs</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Optimize Operations</span>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400">Implement advanced scheduling and routing</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && exportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🧠 Business Intelligence Report</h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Revenue</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">£{exportData.data.summary.totalRevenue.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">Revenue Growth</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{exportData.data.summary.revenueGrowth}%</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Customer Satisfaction</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{exportData.data.summary.customerSatisfaction}%</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Market Share</div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{exportData.data.summary.marketShare}%</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Report Details</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Generated: {new Date(exportData.data.generated_at).toLocaleString()}</div>
                  <div>Time Range: {exportData.data.timeRange}</div>
                  <div>Type: {exportData.type}</div>
                  <div>Insights: {exportData.data.insights.length}</div>
                  <div>KPIs: {exportData.data.kpis.length}</div>
                  <div>Opportunities: {exportData.data.opportunities.length}</div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    const doc = new jsPDF();
                    doc.text('PCO Business Intelligence Report', 10, 10);
                    doc.text(`Generated on: ${new Date(exportData.data.generated_at).toLocaleDateString()}`, 10, 20);
                    doc.text(`Time Range: ${exportData.data.timeRange}`, 10, 30);
                    doc.text(`Total Revenue: £${exportData.data.summary.totalRevenue.toLocaleString()}`, 10, 40);
                    doc.text(`Revenue Growth: ${exportData.data.summary.revenueGrowth}%`, 10, 50);
                    doc.text(`Customer Satisfaction: ${exportData.data.summary.customerSatisfaction}/5`, 10, 60);
                    doc.text(`Market Share: ${exportData.data.summary.marketShare}%`, 10, 70);

                    doc.save(`pco-business-intelligence-${new Date().toISOString().split('T')[0]}.pdf`);
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📈 Business Intelligence Trends</h3>
              <button onClick={() => setShowTrendsModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Revenue</div>
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-100">£{trendsData.data.metrics.totalRevenue.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">Revenue Growth</div>
                  <div className="text-xl font-bold text-green-900 dark:text-green-100">{trendsData.data.metrics.revenueGrowth}%</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Customer Satisfaction</div>
                  <div className="text-xl font-bold text-purple-900 dark:text-purple-100">{trendsData.data.metrics.customerSatisfaction}%</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Market Share</div>
                  <div className="text-xl font-bold text-orange-900 dark:text-orange-100">{trendsData.data.metrics.marketShare}%</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Business Insights</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {trendsData.data.insights.map((insight: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{insight.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{insight.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{insight.value}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {insight.type}, {insight.impact} impact
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Strategic KPIs</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {trendsData.data.kpis.map((kpi: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{kpi.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Target: {kpi.target}{kpi.unit}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{kpi.current}{kpi.unit}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {kpi.status}, {kpi.trend >= 0 ? '+' : ''}{kpi.trend}%
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🔍 Detailed Business Analysis</h3>
              <button onClick={() => setShowAnalysisModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Business Insights</h4>
                <div className="space-y-2">
                  {analysisData.insights.map((insight: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{insight.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{insight.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{insight.value}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Type: {insight.type}, Impact: {insight.impact}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Market Opportunities</h4>
                <div className="space-y-2">
                  {analysisData.opportunities.map((opportunity: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{opportunity.category}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Potential: £{opportunity.potential.toLocaleString()}, Current: £{opportunity.current.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{opportunity.growth}% growth</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Difficulty: {opportunity.difficulty}, Timeframe: {opportunity.timeframe}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Key Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Revenue</div>
                    <div className="text-xl font-bold text-blue-900 dark:text-blue-100">£{analysisData.metrics.totalRevenue.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">Revenue Growth</div>
                    <div className="text-xl font-bold text-green-900 dark:text-green-100">{analysisData.metrics.revenueGrowth}%</div>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Customer Satisfaction</div>
                    <div className="text-xl font-bold text-purple-900 dark:text-purple-100">{analysisData.metrics.customerSatisfaction}%</div>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Market Share</div>
                    <div className="text-xl font-bold text-orange-900 dark:text-orange-100">{analysisData.metrics.marketShare}%</div>
                  </div>
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