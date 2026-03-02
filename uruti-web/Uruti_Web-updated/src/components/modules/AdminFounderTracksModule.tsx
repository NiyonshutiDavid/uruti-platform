import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Search, BookOpen, Plus, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';

interface Track {
  id: number;
  title: string;
  description: string;
  category: string;
  modules: number;
  duration: string;
}

interface Founder {
  id: number;
  full_name: string;
  email: string;
}

export function AdminFounderTracksModule() {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFounder, setSelectedFounder] = useState<Founder | null>(null);
  const [founderTracks, setFounderTracks] = useState<Track[]>([]);
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);
  const [selectedTrackToAdd, setSelectedTrackToAdd] = useState<Track | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const pageSize = 10;

  // Load all founders and tracks
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [tracksData, usersData] = await Promise.all([
        apiClient.getAllAvailableTracks(),
        apiClient.getUsers(0, 100),
      ]);
      setAllTracks(tracksData);
      const foundersList = usersData.filter((u: any) => u.role === 'founder');
      setFounders(foundersList);
    } catch (error: any) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Load founder tracks when founder is selected
  useEffect(() => {
    if (selectedFounder) {
      loadFounderTracks();
    }
  }, [selectedFounder]);

  const loadFounderTracks = async () => {
    if (!selectedFounder) return;
    try {
      const tracks = await apiClient.getFounderTracks(selectedFounder.id);
      setFounderTracks(tracks);
    } catch (error: any) {
      toast.error('Failed to load founder tracks');
      console.error(error);
    }
  };

  const filteredFounders = useMemo(() => {
    if (!searchTerm) return founders;
    return founders.filter(
      (f) =>
        f.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [founders, searchTerm]);

  const availableTracks = useMemo(() => {
    const assignedIds = new Set(founderTracks.map((t) => t.id));
    return allTracks.filter((t) => !assignedIds.has(t.id));
  }, [allTracks, founderTracks]);

  const handleAssignTrack = async () => {
    if (!selectedFounder || !selectedTrackToAdd) return;

    setIsAssigning(true);
    try {
      await apiClient.assignTrackToFounder(selectedFounder.id, selectedTrackToAdd.id);
      toast.success(`Track "${selectedTrackToAdd.title}" assigned to ${selectedFounder.full_name}`);
      setIsAddTrackOpen(false);
      setSelectedTrackToAdd(null);
      await loadFounderTracks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign track');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveTrack = async (track: Track) => {
    if (!selectedFounder) return;

    setIsRemoving(true);
    try {
      await apiClient.removeTrackFromFounder(selectedFounder.id, track.id);
      toast.success(`Track "${track.title}" removed from ${selectedFounder.full_name}`);
      await loadFounderTracks();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove track');
    } finally {
      setIsRemoving(false);
    }
  };

  const categoryColors: Record<string, string> = {
    financial: 'bg-green-100 text-green-800',
    legal: 'bg-blue-100 text-blue-800',
    market: 'bg-purple-100 text-purple-800',
    pitch: 'bg-orange-100 text-orange-800',
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Founder Advisory Tracks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Founder Advisory Tracks
          </CardTitle>
          <CardDescription>
            Manage and assign advisory tracks to founders for their professional development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Founders List */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Select Founder
                </div>
              </Label>
              <div className="relative mb-3">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search founders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <ScrollArea className="h-96 border rounded-lg p-3">
                <div className="space-y-2">
                  {filteredFounders.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-8">
                      No founders found
                    </div>
                  ) : (
                    filteredFounders.map((founder) => (
                      <button
                        key={founder.id}
                        onClick={() => setSelectedFounder(founder)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedFounder?.id === founder.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-sm">{founder.full_name}</div>
                        <div className="text-xs text-gray-500">{founder.email}</div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Current Tracks */}
            <div className="lg:col-span-2">
              {selectedFounder ? (
                <>
                  <Label className="text-base font-semibold mb-3 block">
                    {selectedFounder.full_name}'s Tracks ({founderTracks.length})
                  </Label>
                  <Button
                    onClick={() => setIsAddTrackOpen(true)}
                    disabled={availableTracks.length === 0}
                    className="mb-3 w-full sm:w-auto"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Track
                  </Button>

                  {founderTracks.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-8 text-center text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No tracks assigned yet</p>
                      {availableTracks.length > 0 && (
                        <p className="text-sm mt-1">Click "Assign Track" to add one</p>
                      )}
                    </div>
                  ) : (
                    <ScrollArea className="h-96 border rounded-lg p-3">
                      <div className="space-y-3">
                        {founderTracks.map((track) => (
                          <div
                            key={track.id}
                            className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm">{track.title}</h4>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {track.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge
                                    className={`text-xs ${categoryColors[track.category] || 'bg-gray-100 text-gray-800'}`}
                                  >
                                    {track.category}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {track.modules} modules • {track.duration}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveTrack(track)}
                                disabled={isRemoving}
                                className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors flex-shrink-0"
                                title="Remove track"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </>
              ) : (
                <div className="border border-dashed rounded-lg p-12 text-center text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Select a founder to view and manage their tracks</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assign Track Dialog */}
      <Dialog open={isAddTrackOpen} onOpenChange={setIsAddTrackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Track to {selectedFounder?.full_name}</DialogTitle>
            <DialogDescription>
              Select a track to assign to this founder
            </DialogDescription>
          </DialogHeader>

          {availableTracks.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>All available tracks are already assigned to this founder</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Available Tracks</Label>
              <Select
                value={selectedTrackToAdd?.id.toString() || ''}
                onValueChange={(value: string) => {
                  const track = availableTracks.find((t) => t.id.toString() === value);
                  setSelectedTrackToAdd(track || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a track..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTracks.map((track) => (
                    <SelectItem key={track.id} value={track.id.toString()}>
                      {track.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTrackToAdd && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">{selectedTrackToAdd.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{selectedTrackToAdd.description}</p>
                  <div className="flex gap-2">
                    <Badge className={categoryColors[selectedTrackToAdd.category]}>
                      {selectedTrackToAdd.category}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {selectedTrackToAdd.modules} modules • {selectedTrackToAdd.duration}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddTrackOpen(false)}
                  disabled={isAssigning}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignTrack}
                  disabled={!selectedTrackToAdd || isAssigning}
                >
                  {isAssigning ? 'Assigning...' : 'Assign Track'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
