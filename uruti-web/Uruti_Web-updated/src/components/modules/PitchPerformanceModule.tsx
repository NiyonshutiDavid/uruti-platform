import { useState, useEffect, type MouseEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { TrendingUp, Download, Play, Eye, Award, Target, X, Sparkles, ArrowLeft, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';
import { formatLocalDate, parseServerDate, toEpochMs } from '../../lib/datetime';
import config from '../../lib/config';

interface PitchSession {
  id: string;
  date: string;
  venture: string;
  pitchType?: string;
  duration: string;
  overallScore: number;
  pacing: number;
  clarity: number;
  confidence: number;
  structure: number;
  engagement: number;
  videoUrl: string;
  transcriptUrl: string;
  feedback: string[];
}

export function PitchPerformanceModule() {
  const [sessions, setSessions] = useState<PitchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<PitchSession | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'video'>('list');
  const [videoSession, setVideoSession] = useState<PitchSession | null>(null);

  const handleNewPracticeSession = () => {
    window.dispatchEvent(new CustomEvent('navigate-to-pitch-coach'));
  };

  useEffect(() => {
    fetchPitchSessions();
  }, []);

  const fetchPitchSessions = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getPitchAnalyses();
      setSessions(data);
      if (data.length > 0) {
        setSelectedSession(data[0]);
      }
    } catch (error) {
      console.log('Pitch sessions not yet available from backend');
      // Don't show error toast, just use empty state
    } finally {
      setLoading(false);
    }
  };

  const handleViewVideo = (session: PitchSession, e: MouseEvent) => {
    e.stopPropagation();
    setVideoSession(session);
    setViewMode('video');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setVideoSession(null);
  };

  const handleDeleteSession = async (session: PitchSession, e: MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Delete recording for ${session.venture} from ${formatLocalDate(session.date)}?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingSessionId(session.id);
      await apiClient.deletePitchAnalysis(session.id);

      const updatedSessions = sessions.filter((item) => item.id !== session.id);
      setSessions(updatedSessions);

      if (selectedSession?.id === session.id) {
        setSelectedSession(updatedSessions[0] || null);
      }
      if (videoSession?.id === session.id) {
        setVideoSession(null);
        setViewMode('list');
      }

      toast.success('Recording deleted successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete recording');
    } finally {
      setDeletingSessionId(null);
    }
  };

  const toAbsoluteUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${config.apiUrl.replace(/\/+$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const sanitizeFilenamePart = (value: string, fallback: string) => {
    const cleaned = (value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return cleaned || fallback;
  };

  const buildSessionVideoFilename = (session: PitchSession) => {
    const sessionType = sanitizeFilenamePart(session.pitchType || 'pitch-session', 'pitch-session');
    const ventureName = sanitizeFilenamePart(session.venture || 'venture', 'venture');
    const parsedDate = parseServerDate(session.date);
    const dateValue = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const datePart = [
      dateValue.getFullYear(),
      String(dateValue.getMonth() + 1).padStart(2, '0'),
      String(dateValue.getDate()).padStart(2, '0'),
    ].join('-');
    return `${sessionType}-${ventureName}-${datePart}.mp4`;
  };

  const downloadFromUrl = async (url: string, filename: string) => {
    if (!url) {
      toast.error('No file available for download');
      return;
    }
    try {
      const response = await fetch(toAbsoluteUrl(url));
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Failed to download file:', error);
      toast.error('Unable to download file right now. Please try again.');
    }
  };

  // Show video view as full page
  if (viewMode === 'video' && videoSession) {
    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="glass-card rounded-2xl p-6 border border-black/5 dark:border-white/10">
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="mb-4 hover:bg-[#76B947]/10 hover:border-[#76B947]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
          <div>
            <h1 className="text-3xl sm:text-4xl mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              {videoSession.venture} - Pitch Recording
            </h1>
            <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Recorded on {formatLocalDate(videoSession.date)} • Duration: {videoSession.duration}
            </p>
          </div>
        </div>

        {/* Video and AI Feedback Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Section */}
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardContent className="p-0">
              <div className="aspect-video bg-black rounded-lg flex items-center justify-center overflow-hidden">
                {videoSession.videoUrl ? (
                  <video
                    src={toAbsoluteUrl(videoSession.videoUrl)}
                    controls
                    preload="metadata"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center space-y-3 p-6">
                    <Play className="h-20 w-20 text-white/60 mx-auto" />
                    <p className="text-white/60" style={{ fontFamily: 'var(--font-body)' }}>
                      No recording available for this session
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Feedback Section */}
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                <Sparkles className="h-5 w-5 text-[#76B947]" />
                AI Feedback
              </CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                Detailed analysis and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {videoSession.feedback.map((feedback, index) => (
                <div 
                  key={index} 
                  className="p-4 rounded-lg bg-[#76B947]/10 border border-[#76B947]/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-[#76B947]"></div>
                    </div>
                    <p className="text-sm flex-1 dark:text-white" style={{ fontFamily: 'var(--font-body)' }}>
                      {feedback}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardHeader>
            <CardTitle className="dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Performance Metrics
            </CardTitle>
            <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
              Detailed breakdown of your pitch performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Overall
                  </span>
                  <Badge className={`${videoSession.overallScore >= 85 ? 'bg-[#76B947]' : videoSession.overallScore >= 70 ? 'bg-yellow-600' : 'bg-orange-600'} text-white`}>
                    {videoSession.overallScore}%
                  </Badge>
                </div>
                <Progress value={videoSession.overallScore} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Pacing
                  </span>
                  <span className="text-sm font-medium dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {videoSession.pacing}%
                  </span>
                </div>
                <Progress value={videoSession.pacing} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Clarity
                  </span>
                  <span className="text-sm font-medium dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {videoSession.clarity}%
                  </span>
                </div>
                <Progress value={videoSession.clarity} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Confidence
                  </span>
                  <span className="text-sm font-medium dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {videoSession.confidence}%
                  </span>
                </div>
                <Progress value={videoSession.confidence} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Structure
                  </span>
                  <span className="text-sm font-medium dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {videoSession.structure}%
                  </span>
                </div>
                <Progress value={videoSession.structure} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    Engagement
                  </span>
                  <span className="text-sm font-medium dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    {videoSession.engagement}%
                  </span>
                </div>
                <Progress value={videoSession.engagement} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strengths, Improvements, and Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle className="dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-[#76B947]">
                <Award className="h-5 w-5" />
                <span style={{ fontFamily: 'var(--font-body)' }}>
                  {videoSession.structure >= 85 && 'Excellent structure'}
                  {videoSession.clarity >= 85 && videoSession.structure < 85 && 'Clear communication'}
                  {videoSession.clarity < 85 && videoSession.structure < 85 && 'Good overall delivery'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[#76B947]">
                <Award className="h-5 w-5" />
                <span style={{ fontFamily: 'var(--font-body)' }}>
                  {videoSession.confidence >= 80 ? 'Strong confidence' : 'Steady presence'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle className="dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Areas to Improve
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {videoSession.pacing < 80 && (
                <div className="flex items-center gap-3 text-orange-600">
                  <Target className="h-5 w-5" />
                  <span style={{ fontFamily: 'var(--font-body)' }}>Work on pacing</span>
                </div>
              )}
              {videoSession.engagement < 80 && (
                <div className="flex items-center gap-3 text-orange-600">
                  <Target className="h-5 w-5" />
                  <span style={{ fontFamily: 'var(--font-body)' }}>Enhance engagement</span>
                </div>
              )}
              {videoSession.confidence < 80 && (
                <div className="flex items-center gap-3 text-orange-600">
                  <Target className="h-5 w-5" />
                  <span style={{ fontFamily: 'var(--font-body)' }}>Build confidence</span>
                </div>
              )}
              {videoSession.pacing >= 80 && videoSession.engagement >= 80 && videoSession.confidence >= 80 && (
                <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Great work! Keep practicing.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-black/5 dark:border-white/10">
            <CardHeader>
              <CardTitle className="dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-[#76B947] text-white hover:bg-[#76B947]/90"
                onClick={() => downloadFromUrl(videoSession.videoUrl, buildSessionVideoFilename(videoSession))}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Video
              </Button>
              <Button
                variant="outline"
                className="w-full hover:bg-[#76B947]/10 dark:border-white/20"
                onClick={() => downloadFromUrl(videoSession.transcriptUrl, `${videoSession.venture}-transcript.txt`)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Transcript
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show empty state if no sessions
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Pitch Performance Hub</h1>
            <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Track and analyze your pitch presentation progress
            </p>
          </div>
        </div>
        <Card className="glass-card border-black/5">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">Loading pitch sessions...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Pitch Performance Hub</h1>
            <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Track and analyze your pitch presentation progress
            </p>
          </div>
          <Button 
            className="bg-[#76B947] text-white hover:bg-[#76B947]/90"
            onClick={handleNewPracticeSession}
          >
            <Play className="mr-2 h-4 w-4" />
            New Practice Session
          </Button>
        </div>
        <Card className="glass-card border-black/5">
          <CardContent className="py-12">
            <div className="text-center">
              <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                No Pitch Sessions Yet
              </h3>
              <p className="text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-body)' }}>
                Start your first practice session to get AI-powered feedback on your pitch delivery
              </p>
              <Button 
                className="bg-[#76B947] text-white hover:bg-[#76B947]/90"
                onClick={handleNewPracticeSession}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Your First Session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedSession) {
    return null;
  }

  const radarData = [
    { category: 'Pacing', value: selectedSession.pacing },
    { category: 'Clarity', value: selectedSession.clarity },
    { category: 'Confidence', value: selectedSession.confidence },
    { category: 'Structure', value: selectedSession.structure },
    { category: 'Engagement', value: selectedSession.engagement }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-[#76B947]';
    if (score >= 70) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const avgScore = Math.round(sessions.reduce((acc, s) => acc + s.overallScore, 0) / sessions.length);

  // Generate progress data from actual sessions
  const progressData = sessions.map((session, index) => ({
    session: `Session ${index + 1}`,
    score: session.overallScore,
    date: session.date
  })).sort((a, b) => toEpochMs(a.date) - toEpochMs(b.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Pitch Performance Hub</h1>
          <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
            Track and analyze your pitch presentation progress
          </p>
        </div>
        <Button 
          className="bg-[#76B947] text-white hover:bg-[#76B947]/90"
          onClick={handleNewPracticeSession}
        >
          <Play className="mr-2 h-4 w-4" />
          New Practice Session
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-black/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Total Sessions</p>
                <p className="text-3xl mt-1" style={{ fontFamily: 'var(--font-heading)' }}>{sessions.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Average Score</p>
              <p className={`text-3xl mt-1 ${getScoreColor(avgScore)}`} style={{ fontFamily: 'var(--font-heading)' }}>
                {avgScore}%
              </p>
              <Progress value={avgScore} className="mt-2 h-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Best Score</p>
                <p className="text-3xl mt-1 text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>
                  {Math.max(...sessions.map(s => s.overallScore))}%
                </p>
              </div>
              <Award className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-black/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>Improvement</p>
                <p className="text-3xl mt-1 text-[#76B947]" style={{ fontFamily: 'var(--font-heading)' }}>+18%</p>
              </div>
              <Target className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart */}
      <Card className="glass-card border-black/5">
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Performance Progression</CardTitle>
          <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
            Your pitch scores are improving over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="session" style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
              <YAxis style={{ fontFamily: 'var(--font-body)', fontSize: '12px' }} />
              <Tooltip contentStyle={{ fontFamily: 'var(--font-body)' }} />
              <Line type="monotone" dataKey="score" stroke="#76B947" strokeWidth={3} dot={{ fill: '#76B947', r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detailed Analysis */}
        <div className="lg:col-span-2">
          <Card className="glass-card border-black/5">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Session Archive</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                All your recorded pitch sessions with AI feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Date</TableHead>
                    <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Venture</TableHead>
                    <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Duration</TableHead>
                    <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Score</TableHead>
                    <TableHead style={{ fontFamily: 'var(--font-heading)' }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow
                      key={session.id}
                      className={`cursor-pointer hover:bg-[#76B947]/5 ${selectedSession.id === session.id ? 'bg-[#76B947]/10' : ''}`}
                      onClick={() => setSelectedSession(session)}
                    >
                      <TableCell>
                        <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                          {formatLocalDate(session.date)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium" style={{ fontFamily: 'var(--font-heading)' }}>{session.venture}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-black/5">{session.duration}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className={`text-lg ${getScoreColor(session.overallScore)}`} style={{ fontFamily: 'var(--font-heading)' }}>
                            {session.overallScore}%
                          </span>
                          <Progress value={session.overallScore} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="hover:bg-[#76B947]/10" onClick={(e: MouseEvent) => handleViewVideo(session, e)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-[#76B947]/10"
                            onClick={(e: MouseEvent) => {
                              e.stopPropagation();
                              downloadFromUrl(session.videoUrl, buildSessionVideoFilename(session));
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-red-100 hover:text-red-600"
                            disabled={deletingSessionId === session.id}
                            onClick={(e: MouseEvent) => handleDeleteSession(session, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Radar Chart & Feedback */}
        <div className="space-y-6">
          <Card className="glass-card border-black/5">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Performance Breakdown</CardTitle>
              <CardDescription style={{ fontFamily: 'var(--font-body)' }}>
                {selectedSession.venture} - {formatLocalDate(selectedSession.date)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e5e5" />
                  <PolarAngleAxis dataKey="category" style={{ fontFamily: 'var(--font-body)', fontSize: '11px' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} style={{ fontFamily: 'var(--font-body)', fontSize: '10px' }} />
                  <Radar name="Score" dataKey="value" stroke="#76B947" fill="#76B947" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ fontFamily: 'var(--font-body)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card border-black/5">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>AI Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedSession.feedback.map((feedback, index) => (
                  <div key={index} className="p-3 rounded-lg bg-[#76B947]/10">
                    <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>{feedback}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full hover:bg-[#76B947]/10"
                  onClick={() => downloadFromUrl(selectedSession.videoUrl, buildSessionVideoFilename(selectedSession))}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Video
                </Button>
                <Button
                  variant="outline"
                  className="w-full hover:bg-[#76B947]/10"
                  onClick={() => downloadFromUrl(selectedSession.transcriptUrl, `${selectedSession.venture}-transcript.txt`)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Transcript
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}