import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, User, Calendar } from "lucide-react";

interface AdminTimelineProps {
  bookings: any[];
  onUpdateStatus: (bookingId: string, status: string) => void;
}

export default function AdminTimeline({ bookings, onUpdateStatus }: AdminTimelineProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reserved':
        return 'bg-status-reserved text-white';
      case 'confirmed':
        return 'bg-status-available text-white';
      case 'active':
        return 'bg-status-rented text-white';
      case 'returned':
        return 'bg-status-returned text-white';
      case 'late':
        return 'bg-status-late text-white';
      case 'cancelled':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reserved':
        return '⏰';
      case 'confirmed':
        return '✅';
      case 'active':
        return '🤝';
      case 'returned':
        return '↻';
      case 'late':
        return '⚠️';
      case 'cancelled':
        return '❌';
      default:
        return '📦';
    }
  };

  // Generate week days for the timeline header
  const getWeekDays = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay()); // Start from Sunday
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push({
        date: day,
        name: day.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: day.getDate(),
      });
    }
    return days;
  };

  // Filter bookings for the current view
  const getVisibleBookings = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return bookings.filter(booking => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      
      // Check if booking overlaps with the current week
      return (bookingStart <= endOfWeek && bookingEnd >= startOfWeek);
    });
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setSelectedDate(newDate);
  };

  const weekDays = getWeekDays();
  const visibleBookings = getVisibleBookings();

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigateWeek(-1)}>
            ←
          </Button>
          <h3 className="font-medium text-gray-900">
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <Button variant="outline" onClick={() => navigateWeek(1)}>
            →
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant={viewMode === 'day' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Day
          </Button>
          <Button 
            variant={viewMode === 'week' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
          <Button 
            variant={viewMode === 'month' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Week Header */}
      <div className="grid grid-cols-7 gap-4 mb-4">
        {weekDays.map((day, index) => (
          <div key={index} className="text-center p-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{day.name}</p>
            <p className="text-sm text-gray-500">{day.dayNumber}</p>
          </div>
        ))}
      </div>

      {/* Timeline Content */}
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {visibleBookings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Calendar className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-600">No bookings for this week</p>
              <p className="text-sm text-gray-500">Bookings will appear here when scheduled</p>
            </CardContent>
          </Card>
        ) : (
          visibleBookings.map((booking, index) => (
            <TimelineBookingCard
              key={booking.id}
              booking={booking}
              onUpdateStatus={onUpdateStatus}
              weekDays={weekDays}
            />
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-status-reserved"></div>
          <span className="text-xs text-gray-600">Reserved</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-status-available"></div>
          <span className="text-xs text-gray-600">Confirmed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-status-rented"></div>
          <span className="text-xs text-gray-600">Active</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-status-returned"></div>
          <span className="text-xs text-gray-600">Returned</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-status-late"></div>
          <span className="text-xs text-gray-600">Late</span>
        </div>
      </div>
    </div>
  );
}

interface TimelineBookingCardProps {
  booking: any;
  onUpdateStatus: (bookingId: string, status: string) => void;
  weekDays: any[];
}

function TimelineBookingCard({ booking, onUpdateStatus, weekDays }: TimelineBookingCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reserved':
        return 'bg-status-reserved';
      case 'confirmed':
        return 'bg-status-available';
      case 'active':
        return 'bg-status-rented';
      case 'returned':
        return 'bg-status-returned';
      case 'late':
        return 'bg-status-late';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reserved':
        return '⏰';
      case 'confirmed':
        return '✅';
      case 'active':
        return '🤝';
      case 'returned':
        return '↻';
      case 'late':
        return '⚠️';
      case 'cancelled':
        return '❌';
      default:
        return '📦';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 cursor-move">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(booking.status)}`}></div>
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  Booking #{booking.id.slice(-8)}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  <span>Customer: {booking.customerId.slice(-8)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
              </p>
              <Badge className={`${getStatusColor(booking.status)} text-white text-xs`}>
                <span className="mr-1">{getStatusIcon(booking.status)}</span>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
            
            {/* Quick Actions */}
            <div className="flex space-x-1">
              {booking.status === 'confirmed' && (
                <Button 
                  size="sm" 
                  onClick={() => onUpdateStatus(booking.id, 'active')}
                  className="bg-status-rented hover:bg-blue-700 text-white text-xs px-2 py-1"
                >
                  Pickup
                </Button>
              )}
              {booking.status === 'active' && (
                <Button 
                  size="sm" 
                  onClick={() => onUpdateStatus(booking.id, 'returned')}
                  className="bg-status-returned hover:bg-purple-700 text-white text-xs px-2 py-1"
                >
                  Return
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="mt-2 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>Duration: {booking.durationType}</span>
            <span>Amount: ${booking.totalAmount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
