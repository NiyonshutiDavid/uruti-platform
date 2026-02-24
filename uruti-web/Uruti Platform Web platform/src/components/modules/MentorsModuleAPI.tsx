/**
 * Mentors Module (API-Integrated)
 * Displays available mentors and manage mentorship relationships
 */

import React, { useState } from 'react';
import { useMentors, useMentorships } from '../../hooks/useApi';
import { GridTemplate, FormTemplate, FormField } from '../templates/ModuleTemplates';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Star, MapPin, DollarSign, MessageSquare } from 'lucide-react';

export function MentorsModuleAPI() {
  const { mentors, loading: mentorsLoading, error: mentorsError } = useMentors();
  const { mentees, mentors: myMentors, loading: relationshipLoading, requestMentorship } = useMentorships();
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  const handleRequestMentorship = async () => {
    if (!selectedMentor) return;
    try {
      await requestMentorship(selectedMentor.id);
      setIsRequestDialogOpen(false);
      setRequestMessage('');
      setSelectedMentor(null);
    } catch (err) {
      console.error('Error requesting mentorship:', err);
    }
  };

  const renderMentorCard = (mentor: any) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{mentor.expertise || 'Mentor'}</CardTitle>
            <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < 4 ? 'fill-[#76B947] text-[#76B947]' : 'text-muted-foreground'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mentor.bio && <p className="text-sm text-muted-foreground line-clamp-2">{mentor.bio}</p>}

        <div className="space-y-2 text-sm">
          {mentor.availability && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{mentor.availability}</span>
            </div>
          )}
          {mentor.hourly_rate && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>${mentor.hourly_rate}/hr</span>
            </div>
          )}
        </div>

        <Button
          onClick={() => {
            setSelectedMentor(mentor);
            setIsRequestDialogOpen(true);
          }}
          className="w-full bg-[#76B947] hover:bg-[#76B947]/90"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Request Mentorship
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Available Mentors */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Find Mentors</h2>
        <p className="text-sm text-muted-foreground mb-6">Connect with experienced mentors in your industry</p>

        {mentorsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading mentors...</div>
          </div>
        ) : mentorsError ? (
          <div className="text-red-600">Error loading mentors: {mentorsError.message}</div>
        ) : mentors && mentors.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {mentors.map((mentor) => (
              <div key={mentor.id}>{renderMentorCard(mentor)}</div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">No mentors available at the moment</div>
        )}
      </div>

      {/* My Mentors */}
      {myMentors && myMentors.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-2">My Mentors</h2>
          <p className="text-sm text-muted-foreground mb-6">Your active mentorship relationships</p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {myMentors.map((relationship) => (
              <Card key={relationship.id}>
                <CardHeader>
                  <CardTitle>Mentor Relationship</CardTitle>
                  <Badge className="w-fit mt-2">{relationship.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Started: {new Date(relationship.started_at).toLocaleDateString()}
                  </p>
                  <Button variant="outline" className="w-full">
                    Message Mentor
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Request Mentorship Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Mentorship</DialogTitle>
          </DialogHeader>
          {selectedMentor && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">{selectedMentor.expertise}</p>
                <p className="text-sm text-muted-foreground">${selectedMentor.hourly_rate}/hr</p>
              </div>

              <div>
                <label className="text-sm font-medium">Message (Optional)</label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Tell them why you'd like to work with them..."
                  className="w-full px-3 py-2 border rounded-md mt-2 text-sm"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleRequestMentorship}
                  className="flex-1 bg-[#76B947] hover:bg-[#76B947]/90"
                  disabled={relationshipLoading}
                >
                  Send Request
                </Button>
                <Button
                  onClick={() => {
                    setIsRequestDialogOpen(false);
                    setRequestMessage('');
                    setSelectedMentor(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
