import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Edit, Trash2, BookOpen, Video, FileText, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';

interface Material {
  id?: number;
  name: string;
  type: string;
  url: string;
  description: string;
  content: string;
}

interface AdvisoryTrack {
  id?: number;
  title: string;
  description: string;
  category: 'financial' | 'legal' | 'market' | 'pitch';
  modules: number;
  duration: string;
  objectives: string[];
  materials: Material[];
}

export function AdminAdvisoryTracksModule() {
  const [tracks, setTracks] = useState<AdvisoryTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<AdvisoryTrack | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<AdvisoryTrack>({
    title: '',
    description: '',
    category: 'financial',
    modules: 0,
    duration: '',
    objectives: [''],
    materials: []
  });

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAdminAdvisoryTracks();
      setTracks(data);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      toast.error('Failed to load advisory tracks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrack = async () => {
    try {
      // Filter out empty objectives
      const cleanedData = {
        ...formData,
        objectives: formData.objectives.filter(obj => obj.trim() !== '')
      };

      await apiClient.createAdvisoryTrack(cleanedData);
      toast.success('Advisory track created successfully!');
      setIsAddDialogOpen(false);
      resetForm();
      fetchTracks();
    } catch (error) {
      console.error('Error creating track:', error);
      toast.error('Failed to create advisory track');
    }
  };

  const handleUpdateTrack = async () => {
    if (!selectedTrack?.id) return;

    try {
      const cleanedData = {
        ...formData,
        objectives: formData.objectives.filter(obj => obj.trim() !== '')
      };

      await apiClient.updateAdvisoryTrack(Number(selectedTrack.id), cleanedData);
      toast.success('Advisory track updated successfully!');
      setIsEditDialogOpen(false);
      resetForm();
      fetchTracks();
    } catch (error) {
      console.error('Error updating track:', error);
      toast.error('Failed to update advisory track');
    }
  };

  const handleDeleteTrack = async (trackId: number) => {
    if (!confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.deleteAdvisoryTrack(trackId);
      toast.success('Advisory track deleted successfully');
      fetchTracks();
    } catch (error) {
      console.error('Error deleting track:', error);
      toast.error('Failed to delete advisory track');
    }
  };

  const handleEdit = (track: AdvisoryTrack) => {
    setSelectedTrack(track);
    setFormData({
      title: track.title,
      description: track.description,
      category: track.category,
      modules: track.modules,
      duration: track.duration,
      objectives: track.objectives.length > 0 ? track.objectives : [''],
      materials: track.materials || []
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'financial',
      modules: 0,
      duration: '',
      objectives: [''],
      materials: []
    });
    setSelectedTrack(null);
  };

  const addObjective = () => {
    setFormData({
      ...formData,
      objectives: [...formData.objectives, '']
    });
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    setFormData({ ...formData, objectives: newObjectives });
  };

  const removeObjective = (index: number) => {
    const newObjectives = formData.objectives.filter((_, i) => i !== index);
    setFormData({ ...formData, objectives: newObjectives });
  };

  const addMaterial = () => {
    setFormData({
      ...formData,
      materials: [
        ...formData.materials,
        { name: '', type: 'PDF', url: '', description: '', content: '' }
      ]
    });
  };

  const updateMaterial = (index: number, field: keyof Material, value: string) => {
    const newMaterials = [...formData.materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setFormData({ ...formData, materials: newMaterials });
  };

  const removeMaterial = (index: number) => {
    const newMaterials = formData.materials.filter((_, i) => i !== index);
    setFormData({ ...formData, materials: newMaterials });
  };

  const filteredTracks = tracks.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    const colors = {
      financial: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      legal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      market: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      pitch: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    };
    return colors[category as keyof typeof colors] || colors.financial;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Advisory Tracks Management
          </h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            Manage educational content and learning tracks for founders
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#76B947] hover:bg-[#5a8f35] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Track
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>
                Create New Advisory Track
              </DialogTitle>
              <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
                Add a new learning track with materials for founders
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label>Track Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Financial Projection Validation"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what founders will learn in this track"
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="market">Market</SelectItem>
                        <SelectItem value="pitch">Pitch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Number of Modules</Label>
                    <Input
                      type="number"
                      value={formData.modules}
                      onChange={(e) => setFormData({ ...formData, modules: parseInt(e.target.value) || 0 })}
                      placeholder="8"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Duration</Label>
                    <Input
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="4 weeks"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Learning Objectives */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Learning Objectives</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addObjective}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Objective
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.objectives.map((objective, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={objective}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        placeholder={`Objective ${index + 1}`}
                      />
                      {formData.objectives.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeObjective(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Course Materials</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addMaterial}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Material
                  </Button>
                </div>
                <div className="space-y-4">
                  {formData.materials.map((material, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Material {index + 1}</Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeMaterial(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={material.name}
                              onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                              placeholder="Material name"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={material.type}
                              onValueChange={(value) => updateMaterial(index, 'type', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PDF">PDF</SelectItem>
                                <SelectItem value="Video">Video</SelectItem>
                                <SelectItem value="Excel">Excel</SelectItem>
                                <SelectItem value="Word">Word</SelectItem>
                                <SelectItem value="PowerPoint">PowerPoint</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">
                            URL {material.type === 'Video' && '(YouTube Link)'}
                          </Label>
                          <Input
                            value={material.url}
                            onChange={(e) => updateMaterial(index, 'url', e.target.value)}
                            placeholder={material.type === 'Video' ? 'https://youtu.be/...' : 'https://...'}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={material.description}
                            onChange={(e) => updateMaterial(index, 'description', e.target.value)}
                            placeholder="Brief description of this material"
                            rows={2}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Content (Markdown supported)</Label>
                          <Textarea
                            value={material.content}
                            onChange={(e) => updateMaterial(index, 'content', e.target.value)}
                            placeholder="Full content of the material..."
                            rows={6}
                            className="mt-1 font-mono text-xs"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                  {formData.materials.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No materials added yet. Click "Add Material" to get started.
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                  onClick={handleCreateTrack}
                  disabled={!formData.title || !formData.description}
                >
                  Create Track
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="glass-card border-black/5 dark:border-white/10">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search advisory tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                {tracks.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                Total Tracks
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                {tracks.filter(t => t.category === 'financial').length}
              </p>
              <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                Financial
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                {tracks.filter(t => t.category === 'pitch').length}
              </p>
              <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                Pitch
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                {tracks.reduce((sum, t) => sum + (t.materials?.length || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
                Total Materials
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tracks List */}
      {loading ? (
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      ) : filteredTracks.length === 0 ? (
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2 dark:text-white">No advisory tracks found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Create your first advisory track to get started'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTracks.map((track) => (
            <Card key={track.id} className="glass-card border-black/5 dark:border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>
                        {track.title}
                      </CardTitle>
                      <Badge className={getCategoryColor(track.category)}>
                        {track.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                      {track.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(track)}
                      className="hover:bg-[#76B947]/10 hover:border-[#76B947]"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => track.id && handleDeleteTrack(Number(track.id))}
                      className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Track Info */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{track.modules} modules</span>
                    <span>•</span>
                    <span>{track.duration}</span>
                    <span>•</span>
                    <span>{track.materials?.length || 0} materials</span>
                  </div>

                  {/* Objectives */}
                  {track.objectives && track.objectives.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Learning Objectives:</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {track.objectives.slice(0, 3).map((objective, index) => (
                          <li key={index}>{objective}</li>
                        ))}
                        {track.objectives.length > 3 && (
                          <li className="text-[#76B947]">+{track.objectives.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Materials Preview */}
                  {track.materials && track.materials.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Materials:</p>
                      <div className="flex flex-wrap gap-2">
                        {track.materials.map((material, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {material.type === 'Video' ? <Video className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                            {material.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog - Similar to Add Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>
              Edit Advisory Track
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
              Update the learning track details
            </DialogDescription>
          </DialogHeader>
          
          {/* Same form as create, but with update handler */}
          <div className="space-y-4 mt-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label>Track Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Financial Projection Validation"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what founders will learn in this track"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="market">Market</SelectItem>
                      <SelectItem value="pitch">Pitch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Number of Modules</Label>
                  <Input
                    type="number"
                    value={formData.modules}
                    onChange={(e) => setFormData({ ...formData, modules: parseInt(e.target.value) || 0 })}
                    placeholder="8"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Duration</Label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="4 weeks"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Learning Objectives */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Learning Objectives</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addObjective}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Objective
                </Button>
              </div>
              <div className="space-y-2">
                {formData.objectives.map((objective, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={objective}
                      onChange={(e) => updateObjective(index, e.target.value)}
                      placeholder={`Objective ${index + 1}`}
                    />
                    {formData.objectives.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeObjective(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Materials */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Course Materials</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addMaterial}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Material
                </Button>
              </div>
              <div className="space-y-4">
                {formData.materials.map((material, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Material {index + 1}</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeMaterial(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Name</Label>
                          <Input
                            value={material.name}
                            onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                            placeholder="Material name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={material.type}
                            onValueChange={(value) => updateMaterial(index, 'type', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PDF">PDF</SelectItem>
                              <SelectItem value="Video">Video</SelectItem>
                              <SelectItem value="Excel">Excel</SelectItem>
                              <SelectItem value="Word">Word</SelectItem>
                              <SelectItem value="PowerPoint">PowerPoint</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">
                          URL {material.type === 'Video' && '(YouTube Link)'}
                        </Label>
                        <Input
                          value={material.url}
                          onChange={(e) => updateMaterial(index, 'url', e.target.value)}
                          placeholder={material.type === 'Video' ? 'https://youtu.be/...' : 'https://...'}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={material.description}
                          onChange={(e) => updateMaterial(index, 'description', e.target.value)}
                          placeholder="Brief description of this material"
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Content (Markdown supported)</Label>
                        <Textarea
                          value={material.content}
                          onChange={(e) => updateMaterial(index, 'content', e.target.value)}
                          placeholder="Full content of the material..."
                          rows={6}
                          className="mt-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
                {formData.materials.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No materials added yet. Click "Add Material" to get started.
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#76B947] hover:bg-[#5a8f35] text-white"
                onClick={handleUpdateTrack}
                disabled={!formData.title || !formData.description}
              >
                Update Track
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
