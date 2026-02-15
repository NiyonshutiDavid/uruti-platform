import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { TrendingUp, Download, Play, Eye, Award, Target, X, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

interface PitchSession {
  id: string;
  date: string;
  venture: string;
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

const mockSessions: PitchSession[] = [
  {
    id: '1',
    date: '2026-02-03',
    venture: 'AgriConnect',
    duration: '5:23',
    overallScore: 85,
    pacing: 82,
    clarity: 88,
    confidence: 84,
    structure: 90,
    engagement: 80,
    videoUrl: '#',
    transcriptUrl: '#',
    feedback: ['Excellent market data presentation', 'Consider slowing down in problem section', 'Strong closing']
  },
  {
    id: '2',
    date: '2026-02-01',
    venture: 'FinTrack',
    duration: '4:45',
    overallScore: 90,
    pacing: 88,
    clarity: 92,
    confidence: 89,
    structure: 91,
    engagement: 90,
    videoUrl: '#',
    transcriptUrl: '#',
    feedback: ['Perfect pacing', 'Clear value proposition', 'Engaging storytelling']
  },
  {
    id: '3',
    date: '2026-01-28',
    venture: 'HealthBridge',
    duration: '6:10',
    overallScore: 72,
    pacing: 68,
    clarity: 75,
    confidence: 70,
    structure: 78,
    engagement: 69,
    videoUrl: '#',
    transcriptUrl: '#',
    feedback: ['Too fast in opening', 'Need more confidence in delivery', 'Good technical details']
  },
  {
    id: '4',
    date: '2026-01-25',
    venture: 'EduLearn Rwanda',
    duration: '5:00',
    overallScore: 78,
    pacing: 76,
    clarity: 80,
    confidence: 75,
    structure: 82,
    engagement: 77,
    videoUrl: '#',
    transcriptUrl: '#',
    feedback: ['Good structure', 'Improve vocal variety', 'Strong problem statement']
  }
];

const progressData = [
  { session: 'Session 1', score: 72 },
  { session: 'Session 2', score: 78 },
  { session: 'Session 3', score: 85 },
  { session: 'Session 4', score: 90 },
];

export function PitchPerformanceModule() {
  const [sessions] = useState<PitchSession[]>(mockSessions);
  const [selectedSession, setSelectedSession] = useState<PitchSession>(sessions[0]);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [videoSession, setVideoSession] = useState<PitchSession | null>(null);

  const handleViewVideo = (session: PitchSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoSession(session);
    setIsVideoDialogOpen(true);
  };

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

  const handleNewPracticeSession = () => {
    window.dispatchEvent(new CustomEvent('navigate-to-pitch-coach'));
  };

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
                          {new Date(session.date).toLocaleDateString()}
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
                          <Button variant="ghost" size="sm" className="hover:bg-[#76B947]/10" onClick={(e) => handleViewVideo(session, e)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="hover:bg-[#76B947]/10">
                            <Download className="h-4 w-4" />
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
                {selectedSession.venture} - {new Date(selectedSession.date).toLocaleDateString()}
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
                <Button variant="outline" className="w-full hover:bg-[#76B947]/10">
                  <Download className="mr-2 h-4 w-4" />
                  Download Video
                </Button>
                <Button variant="outline" className="w-full hover:bg-[#76B947]/10">
                  <Download className="mr-2 h-4 w-4" />
                  Download Transcript
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Video Dialog with AI Feedback */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pr-12">
            <DialogTitle className="text-2xl dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              {videoSession?.venture} - Pitch Recording
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Recorded on {videoSession && new Date(videoSession.date).toLocaleDateString()} • Duration: {videoSession?.duration}
            </DialogDescription>
            <Button
              className="absolute top-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2"
              onClick={() => setIsVideoDialogOpen(false)}
            >
              Close
            </Button>
          </DialogHeader>

          {videoSession && (
            <div className="space-y-4 mt-4">
              {/* Video and AI Feedback Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Video Section */}
                <div className="glass-card rounded-xl overflow-hidden border border-black/5 dark:border-white/10">
                  <div className="aspect-video bg-black flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <Play className="h-16 w-16 text-white/60 mx-auto" />
                      <p className="text-white/60 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                        Video player would display here
                      </p>
                      <p className="text-white/40 text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                        Recording: {videoSession.venture} • {videoSession.duration}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Feedback Section */}
                <Card className="glass-card border-black/5 dark:border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                      <Sparkles className="h-5 w-5 text-[#76B947]" />
                      AI Feedback
                    </CardTitle>
                    <CardDescription className="text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                      Detailed analysis and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[280px] overflow-y-auto">
                    {videoSession.feedback.map((feedback, index) => (
                      <div 
                        key={index} 
                        className="p-3 rounded-lg bg-[#76B947]/10 border border-[#76B947]/20"
                      >
                        <div className="flex items-start gap-2">
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
                  <CardTitle className="text-base dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          Overall Score
                        </span>
                        <Badge className={`${videoSession.overallScore >= 85 ? 'bg-[#76B947]' : videoSession.overallScore >= 70 ? 'bg-yellow-600' : 'bg-orange-600'} text-white text-sm px-2 py-0.5`}>
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="glass-card border-black/5 dark:border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      Key Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-[#76B947]">
                      <Award className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--font-body)' }}>
                        {videoSession.structure >= 85 && 'Excellent structure'}
                        {videoSession.clarity >= 85 && videoSession.structure < 85 && 'Clear communication'}
                        {videoSession.clarity < 85 && videoSession.structure < 85 && 'Good overall delivery'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#76B947]">
                      <Award className="h-4 w-4" />
                      <span style={{ fontFamily: 'var(--font-body)' }}>
                        {videoSession.confidence >= 80 ? 'Strong confidence' : 'Steady presence'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-black/5 dark:border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      Areas to Improve
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {videoSession.pacing < 80 && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <Target className="h-4 w-4" />
                        <span style={{ fontFamily: 'var(--font-body)' }}>Work on pacing</span>
                      </div>
                    )}
                    {videoSession.engagement < 80 && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <Target className="h-4 w-4" />
                        <span style={{ fontFamily: 'var(--font-body)' }}>Enhance engagement</span>
                      </div>
                    )}
                    {videoSession.confidence < 80 && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <Target className="h-4 w-4" />
                        <span style={{ fontFamily: 'var(--font-body)' }}>Build confidence</span>
                      </div>
                    )}
                    {videoSession.pacing >= 80 && videoSession.engagement >= 80 && videoSession.confidence >= 80 && (
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Great work! Keep practicing.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card border-black/5 dark:border-white/10">
                  <CardHeader>
                    <CardTitle className="text-sm dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                      Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full bg-[#76B947] text-white hover:bg-[#76B947]/90 text-sm py-2">
                      <Download className="mr-2 h-4 w-4" />
                      Download Video
                    </Button>
                    <Button variant="outline" className="w-full hover:bg-[#76B947]/10 dark:border-white/20 text-sm py-2">
                      <Download className="mr-2 h-4 w-4" />
                      Download Transcript
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}