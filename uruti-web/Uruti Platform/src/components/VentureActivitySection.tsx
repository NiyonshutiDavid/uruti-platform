import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Award,
  Calendar,
  MessageSquare,
  Plus,
  Send
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Activity {
  id: string;
  type: 'milestone' | 'funding' | 'growth' | 'achievement' | 'update';
  title: string;
  description: string;
  date: string;
  icon?: any;
  color?: string;
}

interface VentureActivitySectionProps {
  ventureId: string;
  activities?: Activity[];
  isOwner: boolean;
  onAddActivity?: (activity: Omit<Activity, 'id' | 'date'>) => void;
}

export function VentureActivitySection({ 
  ventureId, 
  activities: initialActivities = [], 
  isOwner,
  onAddActivity 
}: VentureActivitySectionProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [updateType, setUpdateType] = useState<Activity['type']>('update');

  const activityTypeConfig = {
    milestone: { icon: Award, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30', label: 'Milestone' },
    funding: { icon: DollarSign, color: 'text-[#76B947] bg-[#76B947]/10', label: 'Funding' },
    growth: { icon: TrendingUp, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', label: 'Growth' },
    achievement: { icon: Award, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30', label: 'Achievement' },
    update: { icon: MessageSquare, color: 'text-gray-600 bg-gray-100 dark:bg-gray-800', label: 'Update' }
  };

  const handleAddUpdate = () => {
    if (!updateText.trim()) {
      toast.error('Please enter an update');
      return;
    }

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: updateType,
      title: getUpdateTitle(updateType),
      description: updateText,
      date: new Date().toISOString()
    };

    setActivities([newActivity, ...activities]);
    if (onAddActivity) {
      onAddActivity(newActivity);
    }

    setUpdateText('');
    setIsAddingUpdate(false);
    toast.success('Activity update posted successfully!');
  };

  const getUpdateTitle = (type: Activity['type']) => {
    const titles = {
      milestone: 'Milestone Achieved',
      funding: 'Funding Update',
      growth: 'Growth Metrics',
      achievement: 'New Achievement',
      update: 'General Update'
    };
    return titles[type];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Activity & Updates
          </h2>
          <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
            {isOwner ? 'Share progress updates with potential investors' : 'Latest updates from the team'}
          </p>
        </div>
        {isOwner && !isAddingUpdate && (
          <Button
            onClick={() => setIsAddingUpdate(true)}
            className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Update
          </Button>
        )}
      </div>

      {/* Add Update Form */}
      {isAddingUpdate && (
        <Card className="glass-card border-[#76B947]/30 border-2">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                Update Type
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(activityTypeConfig).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setUpdateType(type as Activity['type'])}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        updateType === type
                          ? 'border-[#76B947] bg-[#76B947]/10'
                          : 'border-black/10 dark:border-white/10 hover:border-[#76B947]/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                Update Details
              </label>
              <Textarea
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                placeholder="Share your progress, achievements, or important updates..."
                rows={4}
                className="glass-card border-black/10 dark:border-white/10 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingUpdate(false);
                  setUpdateText('');
                }}
                className="border-black/10 dark:border-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUpdate}
                className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Post Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <div className="space-y-4">
        {activities.length === 0 ? (
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                No updates yet
              </h3>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                {isOwner 
                  ? 'Start sharing your progress with potential investors'
                  : 'Check back later for updates from the team'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#76B947] to-transparent" />
            
            <div className="space-y-6">
              {activities.map((activity) => {
                const config = activityTypeConfig[activity.type];
                const Icon = config.icon;
                
                return (
                  <div key={activity.id} className="relative pl-16">
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-3 w-12 h-12 rounded-full ${config.color} flex items-center justify-center`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    {/* Activity card */}
                    <Card className="glass-card border-black/5 dark:border-white/10 hover:border-[#76B947]/30 transition-all">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={config.color}>
                              {config.label}
                            </Badge>
                            <h3 className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                              {activity.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(activity.date)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          {activity.description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
