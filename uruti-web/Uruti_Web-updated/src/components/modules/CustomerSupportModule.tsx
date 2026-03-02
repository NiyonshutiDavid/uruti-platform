import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { useSupport } from '../../lib/support-context';
import { MessageSquare, Send, CheckCircle, XCircle, Clock, Search, Mail, User } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

export function CustomerSupportModule() {
  const { messages, unreadCount, respondToMessage, closeMessage, refreshMessages } = useSupport();
  const [selectedThreadEmail, setSelectedThreadEmail] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const threads = useMemo(() => {
    const byVisitor = new Map<string, {
      visitor_email: string;
      visitor_name: string;
      messages: typeof messages;
      pendingCount: number;
      latestAt: string;
      status: 'pending' | 'responded' | 'closed';
    }>();

    const sortedDesc = [...messages].sort((a, b) => {
      const bTime = new Date(b.created_at || 0).getTime();
      const aTime = new Date(a.created_at || 0).getTime();
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    });

    for (const msg of sortedDesc) {
      const normalizedEmail = (msg.visitor_email || '').trim();
      const key = (normalizedEmail || `unknown-${msg.id}`).toLowerCase();
      if (!byVisitor.has(key)) {
        byVisitor.set(key, {
          visitor_email: normalizedEmail || 'Unknown',
          visitor_name: (msg.visitor_name || '').trim() || 'Unknown',
          messages: [],
          pendingCount: 0,
          latestAt: msg.created_at || new Date(0).toISOString(),
          status: 'closed',
        });
      }

      const thread = byVisitor.get(key)!;
      thread.messages.push(msg);
      if (msg.status === 'pending') thread.pendingCount += 1;
      const msgTime = new Date(msg.created_at || 0).getTime();
      const latestTime = new Date(thread.latestAt || 0).getTime();
      if ((Number.isFinite(msgTime) ? msgTime : 0) > (Number.isFinite(latestTime) ? latestTime : 0)) {
        thread.latestAt = msg.created_at || thread.latestAt;
      }
    }

    const built = Array.from(byVisitor.values()).map((thread) => {
      const ordered = [...thread.messages].sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return (Number.isFinite(aTime) ? aTime : 0) - (Number.isFinite(bTime) ? bTime : 0);
      });

      const status: 'pending' | 'responded' | 'closed' =
        thread.pendingCount > 0
          ? 'pending'
          : ordered.some((m) => m.status === 'responded')
            ? 'responded'
            : 'closed';

      return {
        ...thread,
        messages: ordered,
        status,
      };
    });

    return built.sort((a, b) => {
      const bTime = new Date(b.latestAt || 0).getTime();
      const aTime = new Date(a.latestAt || 0).getTime();
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    });
  }, [messages]);

  useEffect(() => {
    // Refresh messages every 10 seconds
    const interval = setInterval(refreshMessages, 10000);
    return () => clearInterval(interval);
  }, [refreshMessages]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = () => {
      refreshMessages();
    };
    window.addEventListener('new-support-message', handleNewMessage);
    return () => window.removeEventListener('new-support-message', handleNewMessage);
  }, [refreshMessages]);

  const filteredThreads = threads.filter((thread) => {
    const matchesFilter = filter === 'all' || thread.status === filter;
    const matchesSearch =
      searchQuery === '' ||
      (thread.visitor_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (thread.visitor_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.messages.some((m) => (m.message || '').toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const selectedThread = threads.find((t) => (t.visitor_email || '').toLowerCase() === (selectedThreadEmail || '').toLowerCase());

  const handleSendResponse = async () => {
    if (!selectedThread || !responseText.trim()) return;

    const oldestPending = selectedThread.messages.find((m) => m.status === 'pending');
    const targetMessage = oldestPending || selectedThread.messages[selectedThread.messages.length - 1];
    if (!targetMessage) return;

    await respondToMessage(targetMessage.id, responseText);
    setResponseText('');
    await refreshMessages();
  };

  useEffect(() => {
    if (!selectedThreadEmail && filteredThreads.length > 0) {
      setSelectedThreadEmail(filteredThreads[0].visitor_email);
    }
  }, [filteredThreads, selectedThreadEmail]);

  useEffect(() => {
    if (selectedThread) {
      const pending = selectedThread.messages.find((m) => m.status === 'pending');
      if (pending) {
        setResponseText('');
      } else {
        const lastRespondedWithText = [...selectedThread.messages]
          .reverse()
          .find((m) => m.response);
        setResponseText(lastRespondedWithText?.response || '');
      }
    } else {
      setResponseText('');
    }
  }, [selectedThreadEmail, messages]);

  const handleCloseThread = async () => {
    if (!selectedThread) return;
    const closable = selectedThread.messages.filter((m) => m.status !== 'closed');
    await Promise.all(closable.map((m) => closeMessage(m.id)));
    await refreshMessages();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'responded': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'closed': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'responded': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Customer Support
          </h1>
          <p className="text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-body)' }}>
            Manage visitor inquiries and support requests
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-[#76B947] text-white px-4 py-2">
            {unreadCount} Pending
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMessages}
            className="border-[#76B947] text-[#76B947] hover:bg-[#76B947]/10"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Total Messages
                </p>
                <p className="text-2xl font-bold dark:text-white mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {messages.length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-[#76B947]" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Pending
                </p>
                <p className="text-2xl font-bold text-orange-600 mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {messages.filter(m => m.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Responded
                </p>
                <p className="text-2xl font-bold text-green-600 mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {messages.filter(m => m.status === 'responded').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Closed
                </p>
                <p className="text-2xl font-bold text-gray-600 mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {messages.filter(m => m.status === 'closed').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card border-black/5 dark:border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, or conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-card border-black/10 dark:border-white/10"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-[#76B947] text-white' : ''}
              >
                All
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
                className={filter === 'pending' ? 'bg-orange-500 text-white' : ''}
              >
                Pending
              </Button>
              <Button
                variant={filter === 'responded' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('responded')}
                className={filter === 'responded' ? 'bg-green-500 text-white' : ''}
              >
                Responded
              </Button>
              <Button
                variant={filter === 'closed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('closed')}
                className={filter === 'closed' ? 'bg-gray-500 text-white' : ''}
              >
                Closed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Message List */}
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>
              Conversations ({filteredThreads.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                    No conversations found
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {filteredThreads.map((thread) => {
                    const latest = thread.messages[thread.messages.length - 1];
                    return (
                    <div
                      key={thread.visitor_email}
                      onClick={() => setSelectedThreadEmail(thread.visitor_email)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedThreadEmail?.toLowerCase() === thread.visitor_email.toLowerCase()
                          ? 'border-[#76B947] bg-[#76B947]/5'
                          : 'border-black/5 dark:border-white/10 hover:border-[#76B947]/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 rounded-full bg-[#76B947]/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-[#76B947]" />
                          </div>
                          <div>
                            <p className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                              {thread.visitor_name}
                            </p>
                            <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                              {thread.visitor_email}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(thread.status)} flex items-center space-x-1`}>
                          {getStatusIcon(thread.status)}
                          <span className="capitalize">{thread.status}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2" style={{ fontFamily: 'var(--font-body)' }}>
                        {latest?.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                          {latest ? new Date(latest.created_at).toLocaleString() : ''}
                        </p>
                        {thread.pendingCount > 0 && (
                          <Badge className="bg-orange-500 text-white">{thread.pendingCount} pending</Badge>
                        )}
                      </div>
                    </div>
                  );})}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Message Details & Response */}
        <Card className="glass-card border-black/5 dark:border-white/10">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>
              {selectedThread ? 'Conversation' : 'Select a Conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedThread ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Select a conversation to view messages and respond
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visitor Info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-[#76B947]" />
                    <div>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Visitor Name
                      </p>
                      <p className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        {selectedThread.visitor_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-[#76B947]" />
                    <div>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Email Address
                      </p>
                      <p className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        {selectedThread.visitor_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-[#76B947]" />
                    <div>
                      <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                        Last Message
                      </p>
                      <p className="font-semibold dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        {new Date(selectedThread.latestAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conversation Timeline */}
                <div>
                  <p className="text-sm font-semibold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                    Conversation
                  </p>
                  <ScrollArea className="h-64 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-black/5 dark:border-white/10">
                    <div className="space-y-3">
                      {selectedThread.messages.map((msg) => (
                        <div key={msg.id} className="space-y-2">
                          <div className="flex justify-start">
                            <div className="max-w-[85%] rounded-lg p-3 bg-gray-100 dark:bg-gray-800 border border-black/5 dark:border-white/10">
                              <p className="text-sm dark:text-white whitespace-pre-wrap" style={{ fontFamily: 'var(--font-body)' }}>{msg.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">Visitor • {new Date(msg.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          {msg.response && (
                            <div className="flex justify-end">
                              <div className="max-w-[85%] rounded-lg p-3 bg-[#76B947]/10 border border-[#76B947]/20">
                                <p className="text-sm dark:text-white whitespace-pre-wrap" style={{ fontFamily: 'var(--font-body)' }}>{msg.response}</p>
                                <p className="text-xs text-muted-foreground mt-1">Admin • {msg.responded_at ? new Date(msg.responded_at).toLocaleString() : ''}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Response Form */}
                {selectedThread.status !== 'closed' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                        Reply to Visitor
                      </label>
                      <Textarea
                        placeholder="Type your response here..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={6}
                        className="glass-card border-black/10 dark:border-white/10 resize-none"
                        style={{ fontFamily: 'var(--font-body)' }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSendResponse}
                        disabled={!responseText.trim()}
                        className="flex-1 bg-[#76B947] text-white hover:bg-[#76B947]/90"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send Response
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedThreadEmail(null)}
                        className="border-gray-500 text-gray-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Close Thread */}
                {selectedThread.status !== 'closed' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCloseThread}
                      className="flex-1 bg-gray-500 text-white hover:bg-gray-600"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Close Conversation
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
