import React from 'react';
import { 
  FaTools, 
  FaWrench, 
  FaShieldAlt, 
  FaEye, 
  FaCalendarAlt,
  FaCheckCircle,
  FaTimes,
  FaExclamationTriangle,
  FaClock,
  FaDollarSign
} from 'react-icons/fa';

interface MaintenanceRecord {
  id: string;
  partner_id: string;
  car_id: string;
  car_name: string;
  car_plate: string;
  type: 'service' | 'repair' | 'mot' | 'insurance' | 'inspection' | 'other';
  title: string;
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date: string;
  completed_date?: string;
  cost: number;
  estimated_cost?: number;
  mileage: number;
  next_service_mileage?: number;
  provider: {
    name: string;
    contact: string;
    address: string;
    rating?: number;
  };
  parts: Array<{
    name: string;
    quantity: number;
    cost: number;
    part_number?: string;
  }>;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface MaintenanceDashboardProps {
  records: MaintenanceRecord[];
  onStatusClick?: (status: string) => void;
}

interface StatusCard {
  title: string;
  count: number;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  status: string;
}

export default function MaintenanceDashboard({ records, onStatusClick }: MaintenanceDashboardProps) {
  
  const getStatusCards = (): StatusCard[] => {
    const total = records.length;
    const scheduled = records.filter(r => r.status === 'scheduled').length;
    const inProgress = records.filter(r => r.status === 'in_progress').length;
    const completed = records.filter(r => r.status === 'completed').length;
    const overdue = records.filter(r => r.status === 'overdue').length;
    const cancelled = records.filter(r => r.status === 'cancelled').length;

    return [
      {
        title: 'Total Maintenance',
        count: total,
        description: 'All maintenance records',
        color: 'text-gray-700',
        bgColor: 'bg-blue-500',
        icon: <FaTools className="w-6 h-6" />,
        status: 'all'
      },
      {
        title: 'Scheduled',
        count: scheduled,
        description: 'Upcoming maintenance',
        color: 'text-blue-600',
        bgColor: 'bg-blue-500',
        icon: <FaCalendarAlt className="w-6 h-6" />,
        status: 'scheduled'
      },
      {
        title: 'In Progress',
        count: inProgress,
        description: 'Currently being serviced',
        color: 'text-purple-600',
        bgColor: 'bg-purple-500',
        icon: <FaWrench className="w-6 h-6" />,
        status: 'in_progress'
      },
      {
        title: 'Completed',
        count: completed,
        description: 'Successfully finished',
        color: 'text-green-600',
        bgColor: 'bg-green-500',
        icon: <FaCheckCircle className="w-6 h-6" />,
        status: 'completed'
      },
      {
        title: 'Overdue',
        count: overdue,
        description: 'Past due date',
        color: 'text-red-600',
        bgColor: 'bg-red-500',
        icon: <FaExclamationTriangle className="w-6 h-6" />,
        status: 'overdue'
      },
      {
        title: 'Cancelled',
        count: cancelled,
        description: 'Cancelled maintenance',
        color: 'text-gray-600',
        bgColor: 'bg-gray-500',
        icon: <FaTimes className="w-6 h-6" />,
        status: 'cancelled'
      }
    ];
  };

  const statusCards = getStatusCards();

  const handleCardClick = (status: string) => {
    if (onStatusClick) {
      onStatusClick(status);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Maintenance Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statusCards.map((card, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(card.status)}
            className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
              onStatusClick ? 'hover:bg-gray-50' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                {card.icon}
              </div>
              <span className={`text-2xl font-bold ${card.color}`}>
                {card.count}
              </span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {card.title}
            </h3>
            
            <p className={`text-sm ${card.color}`}>
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Total Cost</h3>
              <p className="text-2xl font-bold text-green-600">
                £{records.reduce((sum, record) => sum + (record.cost || 0), 0).toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FaDollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Upcoming</h3>
              <p className="text-2xl font-bold text-blue-600">
                {records.filter(r => 
                  r.status === 'scheduled' && 
                  new Date(r.scheduled_date) > new Date()
                ).length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaClock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">This Month</h3>
              <p className="text-2xl font-bold text-purple-600">
                {records.filter(r => {
                  const recordDate = new Date(r.scheduled_date);
                  const now = new Date();
                  return recordDate.getMonth() === now.getMonth() && 
                         recordDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FaCalendarAlt className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 