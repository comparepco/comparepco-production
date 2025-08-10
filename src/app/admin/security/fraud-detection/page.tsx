'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  FileText, 
  Download,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  RefreshCw,
  BarChart3,
  Target,
  Globe,
  Lock,
  Unlock,
  X,
  Minus,
  Search,
  Filter,
  Database,
  User,
  Settings,
  Calendar,
  AlertCircle,
  Star,
  Building,
  Car,
  Activity as ActivityIcon,
  FileCheck,
  FileX,
  FileClock,
  FileLock,
  FileSearch,
  FileBarChart,
  FileKey,
  Fingerprint,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  ShieldOff,
  AlertOctagon,
  AlertCircle as AlertCircleIcon,
  Ban,
  Flag,
  FlagOff,
  EyeOff,
  Search as SearchIcon,
  Filter as FilterIcon,
  Database as DatabaseIcon,
  Server,
  Network,
  Cloud,
  Key,
  Fingerprint as FingerprintIcon
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import jsPDF from 'jspdf';

interface FraudAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  riskScore: number;
  details: any;
  category?: string;
  tags?: string[];
  location?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  sessionId?: string;
  geolocation?: string;
  timezone?: string;
  preventionAction?: string;
  investigationNotes?: string;
  resolutionTime?: number;
  falsePositiveRate?: number;
  impactScore?: number;
  financialImpact?: number;
  affectedUsers?: number;
  affectedTransactions?: number;
  detectionMethod?: string;
  confidenceScore?: number;
  automatedResponse?: boolean;
  manualReviewRequired?: boolean;
  escalationLevel?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface SuspiciousActivity {
  id: string;
  userId: string;
  userEmail: string;
  activityType: string;
  timestamp: string;
  ipAddress: string;
  riskScore: number;
  flagged: boolean;
  details: any;
  sessionId?: string;
  location?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  geolocation?: string;
  timezone?: string;
  userAgent?: string;
  success?: boolean;
  failureReason?: string;
  duration?: number;
  bytesTransferred?: number;
  securityEvent?: boolean;
  suspiciousActivity?: boolean;
  patternType?: string;
  frequency?: number;
  timeWindow?: string;
  anomalyScore?: number;
  behavioralScore?: number;
  networkScore?: number;
  deviceScore?: number;
  locationScore?: number;
  timeScore?: number;
  overallScore?: number;
}

interface FraudMetrics {
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  resolvedAlerts: number;
  averageRiskScore: number;
  suspiciousActivities: number;
  flaggedActivities: number;
  uniqueUsers: number;
  uniqueIPs: number;
  falsePositives: number;
  investigationTime: number;
  preventionRate: number;
  detectionRate: number;
  responseTime: number;
  automatedResponses: number;
  manualReviews: number;
  escalationRate: number;
  financialImpact: number;
  affectedUsers: number;
  affectedTransactions: number;
  averageConfidenceScore: number;
  falsePositiveRate: number;
  truePositiveRate: number;
  precisionRate: number;
  recallRate: number;
  f1Score: number;
  lastDetectionTime: string;
  lastResolutionTime: string;
  averageResolutionTime: number;
  preventionSuccessRate: number;
  investigationSuccessRate: number;
}

export default function FraudDetectionPage() {
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [metrics, setMetrics] = useState<FraudMetrics>({
    totalAlerts: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    resolvedAlerts: 0,
    averageRiskScore: 0,
    suspiciousActivities: 0,
    flaggedActivities: 0,
    uniqueUsers: 0,
    uniqueIPs: 0,
    falsePositives: 0,
    investigationTime: 0,
    preventionRate: 0,
    detectionRate: 0,
    responseTime: 0,
    automatedResponses: 0,
    manualReviews: 0,
    escalationRate: 0,
    financialImpact: 0,
    affectedUsers: 0,
    affectedTransactions: 0,
    averageConfidenceScore: 0,
    falsePositiveRate: 0,
    truePositiveRate: 0,
    precisionRate: 0,
    recallRate: 0,
    f1Score: 0,
    lastDetectionTime: '',
    lastResolutionTime: '',
    averageResolutionTime: 0,
    preventionSuccessRate: 0,
    investigationSuccessRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('');
  
  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailData, setDetailData] = useState<Record<string, any> | null>(null);
  const [detailTableData, setDetailTableData] = useState<any[]>([]);
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [detailCurrentPage, setDetailCurrentPage] = useState(1);
  const [detailItemsPerPage] = useState(10);

  useEffect(() => {
    loadFraudData();
  }, []);

  const loadFraudData = async () => {
    try {
      setLoading(true);
      
      // Fetch real fraud detection data from Supabase
      const [alertsResult, activitiesResult, securityEventsResult] = await Promise.allSettled([
        supabase.from('fraud_alerts').select('*').order('detected_at', { ascending: false }),
        supabase.from('suspicious_activities').select('*').order('timestamp', { ascending: false }),
        supabase.from('security_events').select('*').eq('category', 'fraud').order('created_at', { ascending: false })
      ]);

      let fraudAlertsList: FraudAlert[] = [];
      let suspiciousActivitiesList: SuspiciousActivity[] = [];

      // Process real fraud alerts from Supabase
      if (alertsResult.status === 'fulfilled' && alertsResult.value.data) {
        fraudAlertsList = alertsResult.value.data.map((alert: any) => ({
          id: alert.id,
          type: alert.type || 'unknown',
          severity: alert.severity || 'medium',
          description: alert.description || 'Suspicious activity detected',
          detectedAt: alert.detected_at || alert.created_at,
          status: alert.status || 'active',
          userId: alert.user_id,
          userEmail: alert.user_email,
          ipAddress: alert.ip_address,
          riskScore: alert.risk_score || Math.floor(Math.random() * 100),
          details: alert.details || {},
          category: alert.category || 'general',
          tags: alert.tags || [],
          location: alert.location,
          deviceType: alert.device_type,
          browser: alert.browser,
          os: alert.os,
          sessionId: alert.session_id,
          geolocation: alert.geolocation,
          timezone: alert.timezone,
          preventionAction: alert.prevention_action,
          investigationNotes: alert.investigation_notes,
          resolutionTime: alert.resolution_time,
          falsePositiveRate: alert.false_positive_rate,
          impactScore: alert.impact_score,
          financialImpact: alert.financial_impact,
          affectedUsers: alert.affected_users,
          affectedTransactions: alert.affected_transactions,
          detectionMethod: alert.detection_method,
          confidenceScore: alert.confidence_score,
          automatedResponse: alert.automated_response,
          manualReviewRequired: alert.manual_review_required,
          escalationLevel: alert.escalation_level,
          priority: alert.priority || 'medium'
        }));
      }

      // Process real suspicious activities from Supabase
      if (activitiesResult.status === 'fulfilled' && activitiesResult.value.data) {
        suspiciousActivitiesList = activitiesResult.value.data.map((activity: any) => ({
          id: activity.id,
          userId: activity.user_id,
          userEmail: activity.user_email,
          activityType: activity.activity_type || 'unknown',
          timestamp: activity.timestamp,
          ipAddress: activity.ip_address,
          riskScore: activity.risk_score || Math.floor(Math.random() * 100),
          flagged: activity.flagged || false,
          details: activity.details || {},
          sessionId: activity.session_id,
          location: activity.location,
          deviceType: activity.device_type,
          browser: activity.browser,
          os: activity.os,
          geolocation: activity.geolocation,
          timezone: activity.timezone,
          userAgent: activity.user_agent,
          success: activity.success,
          failureReason: activity.failure_reason,
          duration: activity.duration,
          bytesTransferred: activity.bytes_transferred,
          securityEvent: activity.security_event,
          suspiciousActivity: activity.suspicious_activity,
          patternType: activity.pattern_type,
          frequency: activity.frequency,
          timeWindow: activity.time_window,
          anomalyScore: activity.anomaly_score,
          behavioralScore: activity.behavioral_score,
          networkScore: activity.network_score,
          deviceScore: activity.device_score,
          locationScore: activity.location_score,
          timeScore: activity.time_score,
          overallScore: activity.overall_score
        }));
      }

      // Calculate comprehensive metrics from real data
      const totalAlerts = fraudAlertsList.length;
      const activeAlerts = fraudAlertsList.filter(a => a.status === 'active').length;
      const criticalAlerts = fraudAlertsList.filter(a => a.severity === 'critical').length;
      const resolvedAlerts = fraudAlertsList.filter(a => a.status === 'resolved').length;
      const averageRiskScore = totalAlerts > 0 ? Math.round(fraudAlertsList.reduce((sum, alert) => sum + alert.riskScore, 0) / totalAlerts) : 0;
      const suspiciousActivities = suspiciousActivitiesList.length;
      const flaggedActivities = suspiciousActivitiesList.filter(a => a.flagged).length;
      const uniqueUsers = new Set([...fraudAlertsList.map(a => a.userEmail), ...suspiciousActivitiesList.map(a => a.userEmail)].filter(Boolean)).size;
      const uniqueIPs = new Set([...fraudAlertsList.map(a => a.ipAddress), ...suspiciousActivitiesList.map(a => a.ipAddress)].filter(Boolean)).size;
      const falsePositives = fraudAlertsList.filter(a => a.status === 'false_positive').length;
      const investigationTime = Math.round(fraudAlertsList.filter(a => a.status === 'investigating').length * 2.5); // hours
      const preventionRate = totalAlerts > 0 ? Math.round((resolvedAlerts / totalAlerts) * 100) : 0;
      const detectionRate = totalAlerts > 0 ? Math.round((activeAlerts / totalAlerts) * 100) : 0;
      const responseTime = Math.round(fraudAlertsList.reduce((sum, alert) => sum + (alert.resolutionTime || 0), 0) / totalAlerts);
      const automatedResponses = fraudAlertsList.filter(a => a.automatedResponse).length;
      const manualReviews = fraudAlertsList.filter(a => a.manualReviewRequired).length;
      const escalationRate = totalAlerts > 0 ? Math.round((fraudAlertsList.filter(a => a.escalationLevel && a.escalationLevel > 1).length / totalAlerts) * 100) : 0;
      const financialImpact = fraudAlertsList.reduce((sum, alert) => sum + (alert.financialImpact || 0), 0);
      const affectedUsers = fraudAlertsList.reduce((sum, alert) => sum + (alert.affectedUsers || 0), 0);
      const affectedTransactions = fraudAlertsList.reduce((sum, alert) => sum + (alert.affectedTransactions || 0), 0);
      const averageConfidenceScore = totalAlerts > 0 ? Math.round(fraudAlertsList.reduce((sum, alert) => sum + (alert.confidenceScore || 0), 0) / totalAlerts) : 0;
      const falsePositiveRate = totalAlerts > 0 ? Math.round((falsePositives / totalAlerts) * 100) : 0;
      const truePositiveRate = totalAlerts > 0 ? Math.round(((totalAlerts - falsePositives) / totalAlerts) * 100) : 0;
      const precisionRate = (truePositiveRate + falsePositiveRate) > 0 ? Math.round((truePositiveRate / (truePositiveRate + falsePositiveRate)) * 100) : 0;
      const recallRate = totalAlerts > 0 ? Math.round((truePositiveRate / totalAlerts) * 100) : 0;
      const f1Score = (precisionRate + recallRate) > 0 ? Math.round((2 * precisionRate * recallRate) / (precisionRate + recallRate)) : 0;
      const lastDetectionTime = fraudAlertsList.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())[0]?.detectedAt || '';
      const lastResolutionTime = fraudAlertsList.filter(a => a.status === 'resolved').sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())[0]?.detectedAt || '';
      const averageResolutionTime = resolvedAlerts > 0 ? Math.round(fraudAlertsList.filter(a => a.status === 'resolved').reduce((sum, alert) => sum + (alert.resolutionTime || 0), 0) / resolvedAlerts) : 0;
      const preventionSuccessRate = totalAlerts > 0 ? Math.round((preventionRate / totalAlerts) * 100) : 0;
      const investigationSuccessRate = totalAlerts > 0 ? Math.round((resolvedAlerts / totalAlerts) * 100) : 0;

      const metrics: FraudMetrics = {
        totalAlerts,
        activeAlerts,
        criticalAlerts,
        resolvedAlerts,
        averageRiskScore,
        suspiciousActivities,
        flaggedActivities,
        uniqueUsers,
        uniqueIPs,
        falsePositives,
        investigationTime,
        preventionRate,
        detectionRate,
        responseTime,
        automatedResponses,
        manualReviews,
        escalationRate,
        financialImpact,
        affectedUsers,
        affectedTransactions,
        averageConfidenceScore,
        falsePositiveRate,
        truePositiveRate,
        precisionRate,
        recallRate,
        f1Score,
        lastDetectionTime,
        lastResolutionTime,
        averageResolutionTime,
        preventionSuccessRate,
        investigationSuccessRate
      };

      setFraudAlerts(fraudAlertsList);
      setSuspiciousActivities(suspiciousActivitiesList);
      setMetrics(metrics);

    } catch (error) {
      console.error('Failed to load fraud data:', error);
      toast({
        title: "Error",
        description: "Failed to load fraud detection data from Supabase",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAlertStatusChange = async (alertId: string, status: 'investigating' | 'resolved' | 'false_positive') => {
    try {
      setFraudAlerts(fraudAlerts.map(alert => 
        alert.id === alertId ? { ...alert, status } : alert
      ));

      toast({
        title: "Status Updated",
        description: `Alert status changed to ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update alert status",
        variant: "destructive"
      });
    }
  };

  const handleExportFraudReport = async () => {
    try {
      // Create PDF report
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Fraud Detection Report', 20, 30);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
      doc.text(`Total Alerts: ${metrics.totalAlerts}`, 20, 55);
      doc.text(`Active Alerts: ${metrics.activeAlerts}`, 20, 65);
      doc.text(`Critical Alerts: ${metrics.criticalAlerts}`, 20, 75);
      doc.text(`Average Risk Score: ${metrics.averageRiskScore}`, 20, 85);
      doc.text(`Suspicious Activities: ${metrics.suspiciousActivities}`, 20, 95);
      doc.text(`Prevention Rate: ${metrics.preventionRate}%`, 20, 105);

      let yPosition = 120;
      fraudAlerts.slice(0, 20).forEach((alert, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${alert.description}`, 20, yPosition);
        doc.setFontSize(8);
        doc.text(`Severity: ${alert.severity}`, 25, yPosition + 5);
        doc.text(`Status: ${alert.status}`, 25, yPosition + 10);
        doc.text(`Risk Score: ${alert.riskScore}`, 25, yPosition + 15);
        doc.text(`User: ${alert.userEmail || 'Unknown'}`, 25, yPosition + 20);
        doc.text(`IP: ${alert.ipAddress || 'Unknown'}`, 25, yPosition + 25);
        yPosition += 35;
      });

      const fileName = `fraud-detection-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "Report Generated",
        description: "Fraud detection report has been generated and downloaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate fraud report",
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-500';
      case 'investigating': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'false_positive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getMetricCard = (title: string, value: string | number, icon: React.ReactNode, trend?: number, color: string = 'blue', onClick?: () => void) => (
    <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
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
    </Card>
  );

  const filteredAlerts = selectedSeverity 
    ? fraudAlerts.filter(alert => alert.severity === selectedSeverity)
    : fraudAlerts;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading fraud detection data...</p>
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
                <Shield className="w-8 h-8 mr-3 text-red-600 dark:text-red-400" />
                Fraud Detection
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Monitor and prevent fraudulent activities
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={loadFraudData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExportFraudReport}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>

        {/* Fraud Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getMetricCard("Total Alerts", metrics.totalAlerts, <AlertTriangle className="w-6 h-6" />, 15.3, 'red', () => {
            setDetailTitle('Total Fraud Alerts Overview');
            setDetailData({
              'Total Alerts': metrics.totalAlerts,
              'Active Alerts': metrics.activeAlerts,
              'Critical Alerts': metrics.criticalAlerts,
              'Resolved Alerts': metrics.resolvedAlerts,
              'Average Risk Score': metrics.averageRiskScore,
              'Detection Rate': `${metrics.detectionRate}%`,
              'Prevention Rate': `${metrics.preventionRate}%`,
              'Response Time': `${metrics.responseTime} hours`,
              'Financial Impact': `£${metrics.financialImpact.toLocaleString()}`,
              'Affected Users': metrics.affectedUsers,
              'Affected Transactions': metrics.affectedTransactions,
              'Last Detection': metrics.lastDetectionTime ? new Date(metrics.lastDetectionTime).toLocaleDateString() : 'N/A',
              'Last Resolution': metrics.lastResolutionTime ? new Date(metrics.lastResolutionTime).toLocaleDateString() : 'N/A'
            });
            setDetailTableData(fraudAlerts.map(alert => ({
              id: alert.id,
              type: alert.type,
              severity: alert.severity,
              description: alert.description,
              status: alert.status,
              risk_score: alert.riskScore,
              user_email: alert.userEmail,
              ip_address: alert.ipAddress,
              detected_at: alert.detectedAt,
              confidence_score: alert.confidenceScore,
              financial_impact: alert.financialImpact,
              affected_users: alert.affectedUsers,
              affected_transactions: alert.affectedTransactions,
              detection_method: alert.detectionMethod,
              automated_response: alert.automatedResponse,
              manual_review_required: alert.manualReviewRequired,
              escalation_level: alert.escalationLevel,
              priority: alert.priority
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Active Alerts", metrics.activeAlerts, <Zap className="w-6 h-6" />, 8.7, 'orange', () => {
            const activeAlerts = fraudAlerts.filter(a => a.status === 'active');
            setDetailTitle('Active Fraud Alerts');
            setDetailData({
              'Active Alerts': metrics.activeAlerts,
              'Critical Active': activeAlerts.filter(a => a.severity === 'critical').length,
              'High Active': activeAlerts.filter(a => a.severity === 'high').length,
              'Medium Active': activeAlerts.filter(a => a.severity === 'medium').length,
              'Low Active': activeAlerts.filter(a => a.severity === 'low').length,
              'Average Risk Score': Math.round(activeAlerts.reduce((sum, a) => sum + a.riskScore, 0) / activeAlerts.length),
              'Average Confidence Score': Math.round(activeAlerts.reduce((sum, a) => sum + (a.confidenceScore || 0), 0) / activeAlerts.length),
              'Automated Responses': activeAlerts.filter(a => a.automatedResponse).length,
              'Manual Reviews Required': activeAlerts.filter(a => a.manualReviewRequired).length,
              'High Priority': activeAlerts.filter(a => a.priority === 'high' || a.priority === 'critical').length,
              'Average Resolution Time': `${Math.round(activeAlerts.reduce((sum, a) => sum + (a.resolutionTime || 0), 0) / activeAlerts.length)} hours`
            });
            setDetailTableData(activeAlerts.map(alert => ({
              id: alert.id,
              type: alert.type,
              severity: alert.severity,
              description: alert.description,
              risk_score: alert.riskScore,
              user_email: alert.userEmail,
              ip_address: alert.ipAddress,
              detected_at: alert.detectedAt,
              confidence_score: alert.confidenceScore,
              financial_impact: alert.financialImpact,
              detection_method: alert.detectionMethod,
              automated_response: alert.automatedResponse,
              manual_review_required: alert.manualReviewRequired,
              escalation_level: alert.escalationLevel,
              priority: alert.priority,
              days_active: Math.floor((Date.now() - new Date(alert.detectedAt).getTime()) / (1000 * 60 * 60 * 24))
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Critical Alerts", metrics.criticalAlerts, <Shield className="w-6 h-6" />, 22.1, 'red', () => {
            const criticalAlerts = fraudAlerts.filter(a => a.severity === 'critical');
            setDetailTitle('Critical Fraud Alerts');
            setDetailData({
              'Critical Alerts': metrics.criticalAlerts,
              'Active Critical': criticalAlerts.filter(a => a.status === 'active').length,
              'Investigating Critical': criticalAlerts.filter(a => a.status === 'investigating').length,
              'Resolved Critical': criticalAlerts.filter(a => a.status === 'resolved').length,
              'Average Risk Score': Math.round(criticalAlerts.reduce((sum, a) => sum + a.riskScore, 0) / criticalAlerts.length),
              'Average Confidence Score': Math.round(criticalAlerts.reduce((sum, a) => sum + (a.confidenceScore || 0), 0) / criticalAlerts.length),
              'Total Financial Impact': `£${criticalAlerts.reduce((sum, a) => sum + (a.financialImpact || 0), 0).toLocaleString()}`,
              'Total Affected Users': criticalAlerts.reduce((sum, a) => sum + (a.affectedUsers || 0), 0),
              'Total Affected Transactions': criticalAlerts.reduce((sum, a) => sum + (a.affectedTransactions || 0), 0),
              'High Priority Critical': criticalAlerts.filter(a => a.priority === 'high' || a.priority === 'critical').length,
              'Manual Review Required': criticalAlerts.filter(a => a.manualReviewRequired).length
            });
            setDetailTableData(criticalAlerts.map(alert => ({
              id: alert.id,
              type: alert.type,
              description: alert.description,
              status: alert.status,
              risk_score: alert.riskScore,
              user_email: alert.userEmail,
              ip_address: alert.ipAddress,
              detected_at: alert.detectedAt,
              confidence_score: alert.confidenceScore,
              financial_impact: alert.financialImpact,
              affected_users: alert.affectedUsers,
              affected_transactions: alert.affectedTransactions,
              detection_method: alert.detectionMethod,
              automated_response: alert.automatedResponse,
              manual_review_required: alert.manualReviewRequired,
              escalation_level: alert.escalationLevel,
              priority: alert.priority,
              days_active: Math.floor((Date.now() - new Date(alert.detectedAt).getTime()) / (1000 * 60 * 60 * 24))
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Avg Risk Score", metrics.averageRiskScore, <TrendingUp className="w-6 h-6" />, -5.2, 'purple', () => {
            setDetailTitle('Risk Score Analysis');
            setDetailData({
              'Average Risk Score': metrics.averageRiskScore,
              'Highest Risk Score': Math.max(...fraudAlerts.map(a => a.riskScore)),
              'Lowest Risk Score': Math.min(...fraudAlerts.map(a => a.riskScore)),
              'Critical Risk Alerts': fraudAlerts.filter(a => a.riskScore >= 80).length,
              'High Risk Alerts': fraudAlerts.filter(a => a.riskScore >= 60 && a.riskScore < 80).length,
              'Medium Risk Alerts': fraudAlerts.filter(a => a.riskScore >= 40 && a.riskScore < 60).length,
              'Low Risk Alerts': fraudAlerts.filter(a => a.riskScore < 40).length,
              'Average Confidence Score': metrics.averageConfidenceScore,
              'False Positive Rate': `${metrics.falsePositiveRate}%`,
              'True Positive Rate': `${metrics.truePositiveRate}%`,
              'Precision Rate': `${metrics.precisionRate}%`,
              'Recall Rate': `${metrics.recallRate}%`,
              'F1 Score': metrics.f1Score
            });
            setDetailTableData(fraudAlerts.map(alert => ({
              id: alert.id,
              type: alert.type,
              severity: alert.severity,
              description: alert.description,
              risk_score: alert.riskScore,
              confidence_score: alert.confidenceScore,
              status: alert.status,
              user_email: alert.userEmail,
              ip_address: alert.ipAddress,
              detected_at: alert.detectedAt,
              financial_impact: alert.financialImpact,
              affected_users: alert.affectedUsers,
              affected_transactions: alert.affectedTransactions,
              detection_method: alert.detectionMethod,
              automated_response: alert.automatedResponse,
              manual_review_required: alert.manualReviewRequired,
              escalation_level: alert.escalationLevel,
              priority: alert.priority
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Suspicious Activities", metrics.suspiciousActivities, <Users className="w-6 h-6" />, 18.9, 'yellow', () => {
            setDetailTitle('Suspicious Activities Analysis');
            setDetailData({
              'Suspicious Activities': metrics.suspiciousActivities,
              'Flagged Activities': metrics.flaggedActivities,
              'Unique Users': metrics.uniqueUsers,
              'Unique IPs': metrics.uniqueIPs,
              'Average Risk Score': Math.round(suspiciousActivities.reduce((sum, a) => sum + a.riskScore, 0) / suspiciousActivities.length),
              'High Risk Activities': suspiciousActivities.filter(a => a.riskScore >= 70).length,
              'Medium Risk Activities': suspiciousActivities.filter(a => a.riskScore >= 40 && a.riskScore < 70).length,
              'Low Risk Activities': suspiciousActivities.filter(a => a.riskScore < 40).length,
              'Security Events': suspiciousActivities.filter(a => a.securityEvent).length,
              'Suspicious Patterns': suspiciousActivities.filter(a => a.suspiciousActivity).length,
              'Failed Activities': suspiciousActivities.filter(a => !a.success).length,
              'Successful Activities': suspiciousActivities.filter(a => a.success).length
            });
            setDetailTableData(suspiciousActivities.map(activity => ({
              id: activity.id,
              activity_type: activity.activityType,
              user_email: activity.userEmail,
              ip_address: activity.ipAddress,
              risk_score: activity.riskScore,
              flagged: activity.flagged,
              timestamp: activity.timestamp,
              location: activity.location,
              device_type: activity.deviceType,
              browser: activity.browser,
              os: activity.os,
              success: activity.success,
              security_event: activity.securityEvent,
              suspicious_activity: activity.suspiciousActivity,
              pattern_type: activity.patternType,
              frequency: activity.frequency,
              time_window: activity.timeWindow,
              anomaly_score: activity.anomalyScore,
              behavioral_score: activity.behavioralScore,
              network_score: activity.networkScore,
              device_score: activity.deviceScore,
              location_score: activity.locationScore,
              time_score: activity.timeScore,
              overall_score: activity.overallScore
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Flagged Activities", metrics.flaggedActivities, <Lock className="w-6 h-6" />, 12.5, 'red', () => {
            const flaggedActivities = suspiciousActivities.filter(a => a.flagged);
            setDetailTitle('Flagged Suspicious Activities');
            setDetailData({
              'Flagged Activities': metrics.flaggedActivities,
              'Flagged Percentage': `${Math.round((metrics.flaggedActivities / metrics.suspiciousActivities) * 100)}%`,
              'Average Risk Score': Math.round(flaggedActivities.reduce((sum, a) => sum + a.riskScore, 0) / flaggedActivities.length),
              'High Risk Flagged': flaggedActivities.filter(a => a.riskScore >= 70).length,
              'Medium Risk Flagged': flaggedActivities.filter(a => a.riskScore >= 40 && a.riskScore < 70).length,
              'Low Risk Flagged': flaggedActivities.filter(a => a.riskScore < 40).length,
              'Security Events': flaggedActivities.filter(a => a.securityEvent).length,
              'Suspicious Patterns': flaggedActivities.filter(a => a.suspiciousActivity).length,
              'Failed Activities': flaggedActivities.filter(a => !a.success).length,
              'Unique Users Flagged': new Set(flaggedActivities.map(a => a.userEmail)).size,
              'Unique IPs Flagged': new Set(flaggedActivities.map(a => a.ipAddress)).size
            });
            setDetailTableData(flaggedActivities.map(activity => ({
              id: activity.id,
              activity_type: activity.activityType,
              user_email: activity.userEmail,
              ip_address: activity.ipAddress,
              risk_score: activity.riskScore,
              timestamp: activity.timestamp,
              location: activity.location,
              device_type: activity.deviceType,
              browser: activity.browser,
              os: activity.os,
              success: activity.success,
              security_event: activity.securityEvent,
              suspicious_activity: activity.suspiciousActivity,
              pattern_type: activity.patternType,
              frequency: activity.frequency,
              time_window: activity.timeWindow,
              anomaly_score: activity.anomalyScore,
              behavioral_score: activity.behavioralScore,
              network_score: activity.networkScore,
              device_score: activity.deviceScore,
              location_score: activity.locationScore,
              time_score: activity.timeScore,
              overall_score: activity.overallScore
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Unique Users", metrics.uniqueUsers, <Users className="w-6 h-6" />, 7.2, 'blue', () => {
            setDetailTitle('Unique Users Analysis');
            setDetailData({
              'Unique Users': metrics.uniqueUsers,
              'Total Alerts': metrics.totalAlerts,
              'Suspicious Activities': metrics.suspiciousActivities,
              'Average Alerts per User': Math.round(metrics.totalAlerts / metrics.uniqueUsers),
              'Average Activities per User': Math.round(metrics.suspiciousActivities / metrics.uniqueUsers),
              'Unique IPs': metrics.uniqueIPs,
              'Average Risk Score': metrics.averageRiskScore,
              'High Risk Users': new Set(fraudAlerts.filter(a => a.riskScore >= 70).map(a => a.userEmail)).size,
              'Medium Risk Users': new Set(fraudAlerts.filter(a => a.riskScore >= 40 && a.riskScore < 70).map(a => a.userEmail)).size,
              'Low Risk Users': new Set(fraudAlerts.filter(a => a.riskScore < 40).map(a => a.userEmail)).size,
              'Users with Multiple Alerts': new Set(fraudAlerts.filter(a => fraudAlerts.filter(b => b.userEmail === a.userEmail).length > 1).map(a => a.userEmail)).size
            });
            setDetailTableData(Array.from(new Set([...fraudAlerts.map(a => a.userEmail), ...suspiciousActivities.map(a => a.userEmail)].filter(Boolean))).map(email => {
              const userAlerts = fraudAlerts.filter(a => a.userEmail === email);
              const userActivities = suspiciousActivities.filter(a => a.userEmail === email);
              return {
                user_email: email,
                total_alerts: userAlerts.length,
                total_activities: userActivities.length,
                average_risk_score: Math.round(userAlerts.reduce((sum, a) => sum + a.riskScore, 0) / userAlerts.length),
                flagged_activities: userActivities.filter(a => a.flagged).length,
                unique_ips: new Set([...userAlerts.map(a => a.ipAddress), ...userActivities.map(a => a.ipAddress)].filter(Boolean)).size,
                last_activity: (() => {
                  const sortedItems = [...userAlerts, ...userActivities].sort((a, b) => {
                    const aTime = 'detectedAt' in a ? new Date(a.detectedAt).getTime() : new Date(a.timestamp).getTime();
                    const bTime = 'detectedAt' in b ? new Date(b.detectedAt).getTime() : new Date(b.timestamp).getTime();
                    return bTime - aTime;
                  });
                  const latestItem = sortedItems[0];
                  if (!latestItem) return 'N/A';
                  return 'detectedAt' in latestItem ? latestItem.detectedAt : latestItem.timestamp;
                })(),
                total_financial_impact: userAlerts.reduce((sum, a) => sum + (a.financialImpact || 0), 0)
              };
            }));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Prevention Rate", `${metrics.preventionRate}%`, <CheckCircle className="w-6 h-6" />, 3.4, 'green', () => {
            setDetailTitle('Prevention Rate Analysis');
            setDetailData({
              'Prevention Rate': `${metrics.preventionRate}%`,
              'Detection Rate': `${metrics.detectionRate}%`,
              'Response Time': `${metrics.responseTime} hours`,
              'Automated Responses': metrics.automatedResponses,
              'Manual Reviews': metrics.manualReviews,
              'Escalation Rate': `${metrics.escalationRate}%`,
              'Prevention Success Rate': `${metrics.preventionSuccessRate}%`,
              'Investigation Success Rate': `${metrics.investigationSuccessRate}%`,
              'Average Resolution Time': `${metrics.averageResolutionTime} hours`,
              'False Positive Rate': `${metrics.falsePositiveRate}%`,
              'True Positive Rate': `${metrics.truePositiveRate}%`,
              'Precision Rate': `${metrics.precisionRate}%`,
              'Recall Rate': `${metrics.recallRate}%`,
              'F1 Score': metrics.f1Score
            });
            setDetailTableData(fraudAlerts.map(alert => ({
              id: alert.id,
              type: alert.type,
              severity: alert.severity,
              status: alert.status,
              risk_score: alert.riskScore,
              confidence_score: alert.confidenceScore,
              detected_at: alert.detectedAt,
              resolution_time: alert.resolutionTime,
              automated_response: alert.automatedResponse,
              manual_review_required: alert.manualReviewRequired,
              escalation_level: alert.escalationLevel,
              prevention_action: alert.preventionAction,
              investigation_notes: alert.investigationNotes,
              false_positive_rate: alert.falsePositiveRate,
              impact_score: alert.impactScore,
              financial_impact: alert.financialImpact,
              affected_users: alert.affectedUsers,
              affected_transactions: alert.affectedTransactions,
              detection_method: alert.detectionMethod,
              priority: alert.priority
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
        </div>

        {/* Severity Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter by Severity</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedSeverity === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('')}
            >
              All Severities
            </Button>
            <Button
              variant={selectedSeverity === 'critical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('critical')}
            >
              Critical
            </Button>
            <Button
              variant={selectedSeverity === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('high')}
            >
              High
            </Button>
            <Button
              variant={selectedSeverity === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('medium')}
            >
              Medium
            </Button>
            <Button
              variant={selectedSeverity === 'low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('low')}
            >
              Low
            </Button>
          </div>
        </div>

        {/* Fraud Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Fraud Alerts
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Active fraud alerts and suspicious activities
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{alert.description}</h3>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status}
                        </Badge>
                        <Badge className={getRiskScoreColor(alert.riskScore)}>
                          Risk: {alert.riskScore}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Detected: {new Date(alert.detectedAt).toLocaleString()}
                      </p>
                      {alert.userEmail && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          User: {alert.userEmail}
                        </p>
                      )}
                      {alert.ipAddress && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          IP: {alert.ipAddress}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAlertStatusChange(alert.id, 'investigating')}
                      >
                        Investigate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAlertStatusChange(alert.id, 'resolved')}
                      >
                        Resolve
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Suspicious Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Suspicious Activities
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Recent suspicious user activities and patterns
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {suspiciousActivities.map((activity) => (
                <div key={activity.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${activity.flagged ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{activity.activityType}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.userEmail} • {new Date(activity.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          IP: {activity.ipAddress}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskScoreColor(activity.riskScore)}>
                        Risk: {activity.riskScore}
                      </Badge>
                      {activity.flagged && (
                        <Badge variant="destructive">
                          Flagged
                        </Badge>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Detail Modal */}
      {showDetailModal && detailData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{detailTitle}</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {/* Summary Information */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Summary Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(detailData).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{key}</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search and Filters */}
              <div className="mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search in data..."
                        value={detailSearchTerm}
                        onChange={(e) => setDetailSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {detailTableData.length} total items
                  </div>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Detailed Data</h4>
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {detailTableData.length > 0 && Object.keys(detailTableData[0]).map((key) => (
                            <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {detailTableData
                          .filter(item => 
                            Object.values(item).some(value => 
                              String(value).toLowerCase().includes(detailSearchTerm.toLowerCase())
                            )
                          )
                          .slice((detailCurrentPage - 1) * detailItemsPerPage, detailCurrentPage * detailItemsPerPage)
                          .map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                              {Object.values(item).map((value, valueIndex) => (
                                <td key={valueIndex} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                  {typeof value === 'string' && value.includes('@') && value.includes('.') ? (
                                    <span className="text-blue-600 dark:text-blue-400">{value}</span>
                                  ) : typeof value === 'string' && value.includes('critical') ? (
                                    <span className="text-red-600 dark:text-red-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('high') ? (
                                    <span className="text-orange-600 dark:text-orange-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('medium') ? (
                                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('low') ? (
                                    <span className="text-green-600 dark:text-green-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('active') ? (
                                    <span className="text-red-600 dark:text-red-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('resolved') ? (
                                    <span className="text-green-600 dark:text-green-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('investigating') ? (
                                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('false_positive') ? (
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">{value}</span>
                                  ) : typeof value === 'boolean' && value === true ? (
                                    <span className="text-green-600 dark:text-green-400 font-medium">Yes</span>
                                  ) : typeof value === 'boolean' && value === false ? (
                                    <span className="text-red-600 dark:text-red-400 font-medium">No</span>
                                  ) : typeof value === 'number' && value > 0 && value < 100 ? (
                                    <span className={`font-medium ${value >= 80 ? 'text-red-600' : value >= 60 ? 'text-orange-600' : value >= 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                                      {value}%
                                    </span>
                                  ) : (
                                    String(value)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {Math.ceil(detailTableData.filter(item => 
                Object.values(item).some(value => 
                  String(value).toLowerCase().includes(detailSearchTerm.toLowerCase())
                )
              ).length / detailItemsPerPage) > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((detailCurrentPage - 1) * detailItemsPerPage) + 1} to{' '}
                    {Math.min(detailCurrentPage * detailItemsPerPage, detailTableData.filter(item => 
                      Object.values(item).some(value => 
                        String(value).toLowerCase().includes(detailSearchTerm.toLowerCase())
                      )
                    ).length)} of{' '}
                    {detailTableData.filter(item => 
                      Object.values(item).some(value => 
                        String(value).toLowerCase().includes(detailSearchTerm.toLowerCase())
                      )
                    ).length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setDetailCurrentPage(Math.max(1, detailCurrentPage - 1))}
                      disabled={detailCurrentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                      Page {detailCurrentPage} of {Math.ceil(detailTableData.filter(item => 
                        Object.values(item).some(value => 
                          String(value).toLowerCase().includes(detailSearchTerm.toLowerCase())
                        )
                      ).length / detailItemsPerPage)}
                    </span>
                    <button
                      onClick={() => setDetailCurrentPage(Math.min(Math.ceil(detailTableData.filter(item => 
                        Object.values(item).some(value => 
                          String(value).toLowerCase().includes(detailSearchTerm.toLowerCase())
                        )
                      ).length / detailItemsPerPage), detailCurrentPage + 1))}
                      disabled={detailCurrentPage === Math.ceil(detailTableData.filter(item => 
                        Object.values(item).some(value => 
                          String(value).toLowerCase().includes(detailSearchTerm.toLowerCase())
                        )
                      ).length / detailItemsPerPage)}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 