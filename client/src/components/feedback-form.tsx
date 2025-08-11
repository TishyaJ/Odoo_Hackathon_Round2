import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bug, Lightbulb, AlertTriangle, HelpCircle, MessageSquare } from 'lucide-react';

interface FeedbackFormProps {
  onSubmit: (feedback: FeedbackData) => void;
  isSubmitting?: boolean;
  recentFeedback?: any[];
}

interface FeedbackData {
  category: string;
  subject: string;
  message: string;
  priority: string;
}

export default function FeedbackForm({ onSubmit, isSubmitting = false, recentFeedback = [] }: FeedbackFormProps) {
  const [formData, setFormData] = useState<FeedbackData>({
    category: '',
    subject: '',
    message: '',
    priority: 'medium'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.subject || !formData.message) {
      return;
    }
    onSubmit(formData);
    setFormData({ category: '', subject: '', message: '', priority: 'medium' });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug': return <Bug className="w-4 h-4" />;
      case 'feature': return <Lightbulb className="w-4 h-4" />;
      case 'complaint': return <AlertTriangle className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Submit Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Brief description of your feedback"
              />
            </div>
            
            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Please provide detailed information..."
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button type="submit" disabled={isSubmitting} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentFeedback.length > 0 ? (
              recentFeedback.slice(0, 5).map((feedback: any) => (
                <div key={feedback.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      {getCategoryIcon(feedback.type)}
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {feedback.subject}
                      </span>
                    </div>
                    <Badge className={getStatusColor(feedback.status)}>
                      {feedback.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    #{feedback.id} • {new Date(feedback.createdAt).toLocaleDateString()}
                  </p>
                  {feedback.adminReply && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                      <strong>Admin Reply:</strong> {feedback.adminReply}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No feedback submitted yet</p>
                <p className="text-sm">Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
