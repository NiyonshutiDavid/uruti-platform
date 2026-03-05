import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Video, Save, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';


interface PitchMetrics {
  pacing: number;
  clarity: number;
  confidence: number;
  engagement: number;
  structure: number;
}

interface Venture {
  id: number | string;
  name: string;
}

interface SaveRecordingDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (notes: string, selectedVentureId: string | number) => Promise<void>;
  onPracticeAgain: () => void;
  duration: number;
  pitchType: string;
  ventures: Venture[];
  selectedVentureId: string | number;
  onVentureChange: (id: string | number) => void;
  pitchMetrics: PitchMetrics;
  videoBlob: Blob | null;
}

export function SaveRecordingDialog({
  open,
  onClose,
  onSave,
  onPracticeAgain,
  duration,
  pitchType,
  ventures,
  selectedVentureId,
  onVentureChange,
  pitchMetrics,
  videoBlob
}: SaveRecordingDialogProps) {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(notes, selectedVentureId);
      toast.success('Recording saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error('Failed to save recording. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePracticeAgain = () => {
    setNotes('');
    onPracticeAgain();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-2xl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>
            Save Pitch Recording
          </DialogTitle>
          <DialogDescription style={{ fontFamily: 'var(--font-body)' }}>
            Your pitch practice session has been completed. Save it to your venture or practice again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Session Summary */}
          <div className="glass-card rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Video className="h-5 w-5 text-[#76B947]" />
                <span className="font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
                  Session Summary
                </span>
              </div>
              <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                {formatTime(duration)}
              </span>
            </div>

            {/* Venture Selection */}
            <div className="grid grid-cols-2 gap-3 text-sm items-center">
              <div>
                <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Venture</p>
                <select
                  className="glass-input w-full p-1 rounded border"
                  value={selectedVentureId}
                  onChange={e => onVentureChange(e.target.value)}
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {ventures.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Pitch Type</p>
                <p className="font-medium" style={{ fontFamily: 'var(--font-heading)' }}>{pitchType}</p>
              </div>
            </div>

            {/* AI Feedback Metrics */}
            <div className="grid grid-cols-2 gap-3 text-sm mt-2">
              {Object.entries(pitchMetrics).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="capitalize text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{key}</span>
                  <span className="font-medium" style={{ fontFamily: 'var(--font-heading)' }}>{Math.round(value)}</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded">
                    <div className="h-2 rounded bg-[#76B947]" style={{ width: `${Math.round(value)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {videoBlob && (
              <div className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                Video size: {(videoBlob.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" style={{ fontFamily: 'var(--font-heading)' }}>
              Session Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this practice session..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] glass-input"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handlePracticeAgain}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Practice Again
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !videoBlob}
            className="bg-[#76B947] hover:bg-[#5a8f35] text-white w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save to Venture
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
