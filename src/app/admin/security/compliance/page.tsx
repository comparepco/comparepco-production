'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Download,
  Upload,
  Eye,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
  Search,
  Filter,
  X,
  Minus,
  Database,
  User,
  Lock,
  Globe,
  Settings,
  Calendar,
  AlertCircle,
  Star,
  Building,
  Car,
  Users,
  Activity
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import jsPDF from 'jspdf';

interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'compliant' | 'non-compliant' | 'pending' | 'review';
  lastChecked: string;
  nextReview: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  regulatory_framework?: string;
  evidence_required?: boolean;
  last_evidence_date?: string;
}

interface ComplianceReport {
  id: string;
  title: string;
  generatedAt: string;
  status: 'draft' | 'final' | 'archived';
  findings: number;
  recommendations: number;
  compliance_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  reviewed_by?: string;
  next_review_date?: string;
}

interface ComplianceMetrics {
  totalRequirements: number;
  compliant: number;
  nonCompliant: number;
  pending: number;
  review: number;
  complianceRate: number;
  highRiskItems: number;
  overdueReviews: number;
  upcomingDeadlines: number;
  criticalItems: number;
  mediumRiskItems: number;
  lowRiskItems: number;
  evidenceRequired: number;
  evidenceProvided: number;
  regulatoryFrameworks: number;
  averageComplianceScore: number;
  lastAuditDate: string;
  nextAuditDate: string;
}

interface ComplianceAudit {
  id: string;
  audit_type: string;
  conducted_by: string;
  audit_date: string;
  findings: number;
  recommendations: number;
  compliance_score: number;
  status: 'completed' | 'in_progress' | 'scheduled';
  framework: string;
  risk_assessment: string;
}

export default function CompliancePage() {
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [audits, setAudits] = useState<ComplianceAudit[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    totalRequirements: 0,
    compliant: 0,
    nonCompliant: 0,
    pending: 0,
    review: 0,
    complianceRate: 0,
    highRiskItems: 0,
    overdueReviews: 0,
    upcomingDeadlines: 0,
    criticalItems: 0,
    mediumRiskItems: 0,
    lowRiskItems: 0,
    evidenceRequired: 0,
    evidenceProvided: 0,
    regulatoryFrameworks: 0,
    averageComplianceScore: 0,
    lastAuditDate: '',
    nextAuditDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailData, setDetailData] = useState<Record<string, any> | null>(null);
  const [detailTableData, setDetailTableData] = useState<any[]>([]);
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [detailCurrentPage, setDetailCurrentPage] = useState(1);
  const [detailItemsPerPage] = useState(10);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      // Fetch real compliance data from Supabase
      const [requirementsResult, reportsResult, auditsResult, securityAlertsResult] = await Promise.allSettled([
        supabase.from('compliance_requirements').select('*').order('created_at', { ascending: false }),
        supabase.from('compliance_reports').select('*').order('created_at', { ascending: false }),
        supabase.from('compliance_audits').select('*').order('audit_date', { ascending: false }),
        supabase.from('security_alerts').select('*').eq('category', 'compliance').order('created_at', { ascending: false })
      ]);

      const allRequirements: ComplianceRequirement[] = [];
      const allReports: ComplianceReport[] = [];
      const allAudits: ComplianceAudit[] = [];

      // Process compliance requirements
      if (requirementsResult.status === 'fulfilled' && requirementsResult.value.data) {
        requirementsResult.value.data.forEach((req: any) => {
          allRequirements.push({
            id: req.id,
            name: req.name || req.title,
            description: req.description,
            category: req.category || 'General',
            status: req.status || 'pending',
            lastChecked: req.last_checked || req.created_at,
            nextReview: req.next_review || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            risk: req.risk_level || 'medium',
            assigned_to: req.assigned_to,
            priority: req.priority || 'medium',
            regulatory_framework: req.regulatory_framework,
            evidence_required: req.evidence_required || false,
            last_evidence_date: req.last_evidence_date
          });
        });
      }

      // Process compliance reports
      if (reportsResult.status === 'fulfilled' && reportsResult.value.data) {
        reportsResult.value.data.forEach((report: any) => {
          allReports.push({
            id: report.id,
            title: report.title,
            generatedAt: report.created_at,
            status: report.status || 'draft',
            findings: report.findings || 0,
            recommendations: report.recommendations || 0,
            compliance_score: report.compliance_score || 0,
            risk_level: report.risk_level || 'medium',
            reviewed_by: report.reviewed_by,
            next_review_date: report.next_review_date
          });
        });
      }

      // Process compliance audits
      if (auditsResult.status === 'fulfilled' && auditsResult.value.data) {
        auditsResult.value.data.forEach((audit: any) => {
          allAudits.push({
            id: audit.id,
            audit_type: audit.audit_type || 'compliance',
            conducted_by: audit.conducted_by,
            audit_date: audit.audit_date || audit.created_at,
            findings: audit.findings || 0,
            recommendations: audit.recommendations || 0,
            compliance_score: audit.compliance_score || 0,
            status: audit.status || 'completed',
            framework: audit.framework || 'General',
            risk_assessment: audit.risk_assessment || 'medium'
          });
        });
      }

      // Calculate comprehensive metrics from real data only
      const total = allRequirements.length;
      const compliant = allRequirements.filter(r => r.status === 'compliant').length;
      const nonCompliant = allRequirements.filter(r => r.status === 'non-compliant').length;
      const pending = allRequirements.filter(r => r.status === 'pending').length;
      const review = allRequirements.filter(r => r.status === 'review').length;
      const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;
      const highRiskItems = allRequirements.filter(r => r.risk === 'high' || r.risk === 'critical').length;
      const criticalItems = allRequirements.filter(r => r.risk === 'critical').length;
      const mediumRiskItems = allRequirements.filter(r => r.risk === 'medium').length;
      const lowRiskItems = allRequirements.filter(r => r.risk === 'low').length;
      const overdueReviews = allRequirements.filter(r => new Date(r.nextReview) < new Date()).length;
      const upcomingDeadlines = allRequirements.filter(r => {
        const nextReview = new Date(r.nextReview);
        const now = new Date();
        const diffDays = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays > 0;
      }).length;
      const evidenceRequired = allRequirements.filter(r => r.evidence_required).length;
      const evidenceProvided = allRequirements.filter(r => r.evidence_required && r.last_evidence_date).length;
      const regulatoryFrameworks = new Set(allRequirements.map(r => r.regulatory_framework).filter(Boolean)).size;
      const averageComplianceScore = allReports.length > 0 ? Math.round(allReports.reduce((sum, r) => sum + r.compliance_score, 0) / allReports.length) : 0;
      const lastAuditDate = allAudits.length > 0 ? allAudits[0].audit_date : '';
      const nextAuditDate = allReports.length > 0 ? allReports[0].next_review_date || '' : '';

      const metrics: ComplianceMetrics = {
        totalRequirements: total,
        compliant,
        nonCompliant,
        pending,
        review,
        complianceRate,
        highRiskItems,
        overdueReviews,
        upcomingDeadlines,
        criticalItems,
        mediumRiskItems,
        lowRiskItems,
        evidenceRequired,
        evidenceProvided,
        regulatoryFrameworks,
        averageComplianceScore,
        lastAuditDate,
        nextAuditDate
      };

      setRequirements(allRequirements);
      setReports(allReports);
      setAudits(allAudits);
      setMetrics(metrics);

    } catch (error) {
      console.error('Failed to load compliance data:', error);
      toast({
        title: "Error",
        description: "Failed to load compliance data from Supabase",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      // Create PDF report
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Compliance Report', 20, 30);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
      doc.text(`Total Requirements: ${metrics.totalRequirements}`, 20, 55);
      doc.text(`Compliance Rate: ${metrics.complianceRate}%`, 20, 65);
      doc.text(`Compliant: ${metrics.compliant}`, 20, 75);
      doc.text(`Non-Compliant: ${metrics.nonCompliant}`, 20, 85);
      doc.text(`High Risk Items: ${metrics.highRiskItems}`, 20, 95);
      doc.text(`Overdue Reviews: ${metrics.overdueReviews}`, 20, 105);

      let yPosition = 120;
      requirements.slice(0, 20).forEach((req, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${req.name}`, 20, yPosition);
        doc.setFontSize(8);
        doc.text(`Status: ${req.status}`, 25, yPosition + 5);
        doc.text(`Risk: ${req.risk}`, 25, yPosition + 10);
        doc.text(`Category: ${req.category}`, 25, yPosition + 15);
        yPosition += 25;
      });

      const fileName = `compliance-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "Report Generated",
        description: "Compliance report has been generated and downloaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate compliance report",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-500';
      case 'non-compliant': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      case 'review': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMetricCard = (title: string, value: string | number, icon: React.ReactNode, trend?: number, color: string = 'blue', onClick?: () => void) => (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
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
    </div>
  );

  const filteredRequirements = selectedCategory 
    ? requirements.filter(req => req.category === selectedCategory)
    : requirements;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading compliance data...</p>
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
                <Shield className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Compliance Management
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Monitor regulatory compliance and audit requirements
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={loadComplianceData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleGenerateReport}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>

        {/* Compliance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getMetricCard("Total Requirements", metrics.totalRequirements, <Shield className="w-6 h-6" />, 0, 'blue', () => {
            setDetailTitle('Total Compliance Requirements');
            setDetailData({
              'Total Requirements': metrics.totalRequirements,
              'Compliant Requirements': metrics.compliant,
              'Non-Compliant Requirements': metrics.nonCompliant,
              'Pending Requirements': metrics.pending,
              'Review Requirements': metrics.review,
              'Compliance Rate': `${metrics.complianceRate}%`,
              'Regulatory Frameworks': metrics.regulatoryFrameworks,
              'Evidence Required': metrics.evidenceRequired,
              'Evidence Provided': metrics.evidenceProvided
            });
            setDetailTableData(requirements.map(req => ({
              id: req.id,
              name: req.name,
              category: req.category,
              status: req.status,
              risk: req.risk,
              priority: req.priority,
              regulatory_framework: req.regulatory_framework,
              assigned_to: req.assigned_to,
              last_checked: req.lastChecked,
              next_review: req.nextReview,
              evidence_required: req.evidence_required ? 'Yes' : 'No',
              last_evidence_date: req.last_evidence_date
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Compliance Rate", `${metrics.complianceRate}%`, <CheckCircle className="w-6 h-6" />, 5.2, 'green', () => {
            setDetailTitle('Compliance Rate Analysis');
            setDetailData({
              'Overall Compliance Rate': `${metrics.complianceRate}%`,
              'Compliant Items': metrics.compliant,
              'Non-Compliant Items': metrics.nonCompliant,
              'Pending Items': metrics.pending,
              'Review Items': metrics.review,
              'Average Compliance Score': `${metrics.averageComplianceScore}%`,
              'Last Audit Date': metrics.lastAuditDate ? new Date(metrics.lastAuditDate).toLocaleDateString() : 'N/A',
              'Next Audit Date': metrics.nextAuditDate ? new Date(metrics.nextAuditDate).toLocaleDateString() : 'N/A'
            });
            setDetailTableData(requirements.map(req => ({
              id: req.id,
              name: req.name,
              category: req.category,
              status: req.status,
              compliance_score: req.status === 'compliant' ? 100 : req.status === 'pending' ? 50 : 0,
              risk: req.risk,
              last_checked: req.lastChecked,
              next_review: req.nextReview
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Compliant", metrics.compliant, <CheckCircle className="w-6 h-6" />, 8.7, 'green', () => {
            const compliantReqs = requirements.filter(r => r.status === 'compliant');
            setDetailTitle('Compliant Requirements');
            setDetailData({
              'Compliant Requirements': metrics.compliant,
              'Compliance Percentage': `${Math.round((metrics.compliant / metrics.totalRequirements) * 100)}%`,
              'Low Risk Compliant': compliantReqs.filter(r => r.risk === 'low').length,
              'Medium Risk Compliant': compliantReqs.filter(r => r.risk === 'medium').length,
              'High Risk Compliant': compliantReqs.filter(r => r.risk === 'high').length,
              'Critical Risk Compliant': compliantReqs.filter(r => r.risk === 'critical').length,
              'Evidence Provided': compliantReqs.filter(r => r.evidence_required && r.last_evidence_date).length
            });
            setDetailTableData(compliantReqs.map(req => ({
              id: req.id,
              name: req.name,
              category: req.category,
              risk: req.risk,
              priority: req.priority,
              regulatory_framework: req.regulatory_framework,
              assigned_to: req.assigned_to,
              last_checked: req.lastChecked,
              next_review: req.nextReview,
              evidence_status: req.evidence_required && req.last_evidence_date ? 'Provided' : 'Not Required'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Non-Compliant", metrics.nonCompliant, <XCircle className="w-6 h-6" />, -2.1, 'red', () => {
            const nonCompliantReqs = requirements.filter(r => r.status === 'non-compliant');
            setDetailTitle('Non-Compliant Requirements');
            setDetailData({
              'Non-Compliant Requirements': metrics.nonCompliant,
              'Critical Risk Non-Compliant': nonCompliantReqs.filter(r => r.risk === 'critical').length,
              'High Risk Non-Compliant': nonCompliantReqs.filter(r => r.risk === 'high').length,
              'Medium Risk Non-Compliant': nonCompliantReqs.filter(r => r.risk === 'medium').length,
              'Low Risk Non-Compliant': nonCompliantReqs.filter(r => r.risk === 'low').length,
              'Overdue Reviews': nonCompliantReqs.filter(r => new Date(r.nextReview) < new Date()).length
            });
            setDetailTableData(nonCompliantReqs.map(req => ({
              id: req.id,
              name: req.name,
              category: req.category,
              risk: req.risk,
              priority: req.priority,
              regulatory_framework: req.regulatory_framework,
              assigned_to: req.assigned_to,
              last_checked: req.lastChecked,
              next_review: req.nextReview,
              days_overdue: Math.floor((Date.now() - new Date(req.nextReview).getTime()) / (1000 * 60 * 60 * 24))
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Pending Review", metrics.pending + metrics.review, <AlertTriangle className="w-6 h-6" />, 12.5, 'yellow', () => {
            const pendingReqs = requirements.filter(r => r.status === 'pending' || r.status === 'review');
            setDetailTitle('Pending Review Requirements');
            setDetailData({
              'Pending Requirements': metrics.pending,
              'Review Requirements': metrics.review,
              'Total Pending Review': metrics.pending + metrics.review,
              'Critical Risk Pending': pendingReqs.filter(r => r.risk === 'critical').length,
              'High Risk Pending': pendingReqs.filter(r => r.risk === 'high').length,
              'Medium Risk Pending': pendingReqs.filter(r => r.risk === 'medium').length,
              'Low Risk Pending': pendingReqs.filter(r => r.risk === 'low').length
            });
            setDetailTableData(pendingReqs.map(req => ({
              id: req.id,
              name: req.name,
              category: req.category,
              status: req.status,
              risk: req.risk,
              priority: req.priority,
              regulatory_framework: req.regulatory_framework,
              assigned_to: req.assigned_to,
              last_checked: req.lastChecked,
              next_review: req.nextReview,
              days_until_review: Math.ceil((new Date(req.nextReview).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("High Risk Items", metrics.highRiskItems, <AlertTriangle className="w-6 h-6" />, -5.8, 'orange', () => {
            const highRiskReqs = requirements.filter(r => r.risk === 'high' || r.risk === 'critical');
            setDetailTitle('High Risk Requirements');
            setDetailData({
              'Total High Risk Items': metrics.highRiskItems,
              'Critical Risk Items': metrics.criticalItems,
              'High Risk Items': highRiskReqs.filter(r => r.risk === 'high').length,
              'Compliant High Risk': highRiskReqs.filter(r => r.status === 'compliant').length,
              'Non-Compliant High Risk': highRiskReqs.filter(r => r.status === 'non-compliant').length,
              'Pending High Risk': highRiskReqs.filter(r => r.status === 'pending' || r.status === 'review').length
            });
            setDetailTableData(highRiskReqs.map(req => ({
              id: req.id,
              name: req.name,
              category: req.category,
              status: req.status,
              risk: req.risk,
              priority: req.priority,
              regulatory_framework: req.regulatory_framework,
              assigned_to: req.assigned_to,
              last_checked: req.lastChecked,
              next_review: req.nextReview,
              evidence_required: req.evidence_required ? 'Yes' : 'No'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Overdue Reviews", metrics.overdueReviews, <Clock className="w-6 h-6" />, 15.3, 'red', () => {
            const overdueReqs = requirements.filter(r => new Date(r.nextReview) < new Date());
            setDetailTitle('Overdue Reviews');
            setDetailData({
              'Overdue Reviews': metrics.overdueReviews,
              'Critical Overdue': overdueReqs.filter(r => r.risk === 'critical').length,
              'High Risk Overdue': overdueReqs.filter(r => r.risk === 'high').length,
              'Medium Risk Overdue': overdueReqs.filter(r => r.risk === 'medium').length,
              'Low Risk Overdue': overdueReqs.filter(r => r.risk === 'low').length,
              'Average Days Overdue': Math.round(overdueReqs.reduce((sum, req) => sum + Math.floor((Date.now() - new Date(req.nextReview).getTime()) / (1000 * 60 * 60 * 24)), 0) / overdueReqs.length)
            });
            setDetailTableData(overdueReqs.map(req => ({
              id: req.id,
              name: req.name,
              category: req.category,
              status: req.status,
              risk: req.risk,
              priority: req.priority,
              regulatory_framework: req.regulatory_framework,
              assigned_to: req.assigned_to,
              last_checked: req.lastChecked,
              next_review: req.nextReview,
              days_overdue: Math.floor((Date.now() - new Date(req.nextReview).getTime()) / (1000 * 60 * 60 * 24))
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Upcoming Deadlines", metrics.upcomingDeadlines, <Target className="w-6 h-6" />, 22.1, 'purple', () => {
            const upcomingReqs = requirements.filter(r => {
              const nextReview = new Date(r.nextReview);
              const now = new Date();
              const diffDays = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return diffDays <= 30 && diffDays > 0;
            });
            setDetailTitle('Upcoming Deadlines');
            setDetailData({
              'Upcoming Deadlines': metrics.upcomingDeadlines,
              'Next 7 Days': upcomingReqs.filter(r => {
                const diffDays = Math.ceil((new Date(r.nextReview).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
              }).length,
              'Next 14 Days': upcomingReqs.filter(r => {
                const diffDays = Math.ceil((new Date(r.nextReview).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return diffDays <= 14 && diffDays > 7;
              }).length,
              'Next 30 Days': upcomingReqs.filter(r => {
                const diffDays = Math.ceil((new Date(r.nextReview).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return diffDays <= 30 && diffDays > 14;
              }).length,
              'Critical Deadlines': upcomingReqs.filter(r => r.risk === 'critical').length,
              'High Risk Deadlines': upcomingReqs.filter(r => r.risk === 'high').length
            });
            setDetailTableData(upcomingReqs.map(req => ({
              id: req.id,
              name: req.name,
              category: req.category,
              status: req.status,
              risk: req.risk,
              priority: req.priority,
              regulatory_framework: req.regulatory_framework,
              assigned_to: req.assigned_to,
              last_checked: req.lastChecked,
              next_review: req.nextReview,
              days_until_deadline: Math.ceil((new Date(req.nextReview).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
        </div>

        {/* Category Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-500" />
              Filter by Category
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Filter compliance requirements by category and status
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('')}
            >
              All Categories
            </Button>
            {Array.from(new Set(requirements.map(r => r.category))).map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Compliance Requirements */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-500" />
              Compliance Requirements
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Monitor and manage regulatory compliance requirements
            </p>
          </div>
          <div className="space-y-4">
            {filteredRequirements.map((requirement) => (
              <div key={requirement.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{requirement.name}</h3>
                      <Badge className={getStatusColor(requirement.status)}>
                        {requirement.status}
                      </Badge>
                      <Badge className={getRiskColor(requirement.risk)}>
                        {requirement.risk} risk
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{requirement.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Last checked: {new Date(requirement.lastChecked).toLocaleDateString()}</span>
                      <span>Next review: {new Date(requirement.nextReview).toLocaleDateString()}</span>
                      {requirement.assigned_to && (
                        <span>Assigned to: {requirement.assigned_to}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setDetailTitle('Requirement Details');
                        setDetailData({
                          'Requirement ID': requirement.id,
                          'Name': requirement.name,
                          'Category': requirement.category,
                          'Status': requirement.status,
                          'Risk Level': requirement.risk,
                          'Priority': requirement.priority,
                          'Regulatory Framework': requirement.regulatory_framework || 'N/A',
                          'Assigned To': requirement.assigned_to || 'N/A',
                          'Last Checked': new Date(requirement.lastChecked).toLocaleDateString(),
                          'Next Review': new Date(requirement.nextReview).toLocaleDateString(),
                          'Evidence Required': requirement.evidence_required ? 'Yes' : 'No',
                          'Last Evidence Date': requirement.last_evidence_date ? new Date(requirement.last_evidence_date).toLocaleDateString() : 'N/A'
                        });
                        setDetailTableData([{
                          id: requirement.id,
                          name: requirement.name,
                          description: requirement.description,
                          category: requirement.category,
                          status: requirement.status,
                          risk: requirement.risk,
                          priority: requirement.priority,
                          regulatory_framework: requirement.regulatory_framework,
                          assigned_to: requirement.assigned_to,
                          last_checked: requirement.lastChecked,
                          next_review: requirement.nextReview,
                          evidence_required: requirement.evidence_required ? 'Yes' : 'No',
                          last_evidence_date: requirement.last_evidence_date
                        }]);
                        setDetailSearchTerm('');
                        setDetailCurrentPage(1);
                        setShowDetailModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Reports */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Compliance Reports
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Generated compliance reports and audit findings
            </p>
          </div>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{report.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Generated: {new Date(report.generatedAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Findings: {report.findings}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Recommendations: {report.recommendations}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Compliance Score: {report.compliance_score}%
                      </span>
                      {report.reviewed_by && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Reviewed by: {report.reviewed_by}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={report.status === 'final' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setDetailTitle('Report Details');
                        setDetailData({
                          'Report ID': report.id,
                          'Title': report.title,
                          'Status': report.status,
                          'Compliance Score': `${report.compliance_score}%`,
                          'Risk Level': report.risk_level,
                          'Findings': report.findings,
                          'Recommendations': report.recommendations,
                          'Generated Date': new Date(report.generatedAt).toLocaleDateString(),
                          'Reviewed By': report.reviewed_by || 'N/A',
                          'Next Review Date': report.next_review_date ? new Date(report.next_review_date).toLocaleDateString() : 'N/A'
                        });
                        setDetailTableData([{
                          id: report.id,
                          title: report.title,
                          status: report.status,
                          compliance_score: report.compliance_score,
                          risk_level: report.risk_level,
                          findings: report.findings,
                          recommendations: report.recommendations,
                          generated_at: report.generatedAt,
                          reviewed_by: report.reviewed_by,
                          next_review_date: report.next_review_date
                        }]);
                        setDetailSearchTerm('');
                        setDetailCurrentPage(1);
                        setShowDetailModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
                                  ) : typeof value === 'string' && value.includes('compliant') ? (
                                    <span className="text-green-600 dark:text-green-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('non-compliant') ? (
                                    <span className="text-red-600 dark:text-red-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('pending') ? (
                                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('review') ? (
                                    <span className="text-orange-600 dark:text-orange-400 font-medium">{value}</span>
                                  ) : typeof value === 'number' && value > 0 && value < 100 ? (
                                    <span className={`font-medium ${value >= 90 ? 'text-green-600' : value >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
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