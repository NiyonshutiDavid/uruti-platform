import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';
import config from '../../lib/config';

export function AdminModelPerformanceModule() {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('uruti-ai');
  const [prompt, setPrompt] = useState('Explain one practical GTM strategy for a Kigali fintech startup in 5 lines.');
  const [result, setResult] = useState<any | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<any | null>(null);
  const [rankerMetrics, setRankerMetrics] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [modelsResult, statusResult, metricsResult] = await Promise.allSettled([
      apiClient.getAiModels(),
      apiClient.getAdminAiRuntimeStatus(),
      apiClient.getAdminModelPerformance(),
    ]);

    const availableModels = modelsResult.status === 'fulfilled' ? (modelsResult.value || []) : [];
    const status = statusResult.status === 'fulfilled'
      ? statusResult.value
      : {
          chatbot_model_id: 'uruti-ai',
          chatbot_engine: { loaded: false, load_error: statusResult.reason?.message || 'Runtime endpoint unreachable' },
          pitch_coach_engine: { loaded: false, backend: 'offline' },
          core_service: {
            status: 'unknown',
            configured_url: config.apiUrl,
            health_url: `${config.apiUrl.replace(/\/+$/, '')}/health`,
          },
          chatbot_service: {
            reachable: false,
            configured_url: config.chatbotApiUrl,
            health_url: `${config.chatbotApiUrl.replace(/\/+$/, '')}/health`,
            status_code: null,
            latency_ms: null,
            error: statusResult.reason?.message || 'Unable to reach Uruti AI Modules service',
          },
        };

    const metrics = metricsResult.status === 'fulfilled' ? metricsResult.value : null;

    setModels(availableModels);
    setRuntimeStatus(status || null);
    setRankerMetrics(metrics || null);

    const defaultModel = (availableModels || []).find((m: any) => m?.id === 'uruti-ai')?.id
      || (availableModels || [])[0]?.id
      || 'uruti-ai';
    setSelectedModel(defaultModel);

    if (modelsResult.status === 'rejected' || statusResult.status === 'rejected' || metricsResult.status === 'rejected') {
      toast.warning('Some diagnostics could not be loaded. Showing partial status.');
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const runModelTest = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a test prompt');
      return;
    }

    setTesting(true);
    try {
      const response = await apiClient.sendAiChat({
        model: selectedModel,
        message: prompt.trim(),
      });

      setResult(response);
      if (response?.fallback_used) {
        toast.warning('Fallback response detected. Check GGUF runtime status below.');
      } else {
        toast.success('Model inference completed without fallback.');
      }
      const status = await apiClient.getAdminAiRuntimeStatus();
      setRuntimeStatus(status || null);
    } catch (error: any) {
      toast.error(error?.message || 'Model test failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading model diagnostics...</div>;
  }

  const engine = runtimeStatus?.chatbot_engine;
  const pitchEngine = runtimeStatus?.pitch_coach_engine;
  const coreService = runtimeStatus?.core_service;
  const chatbotService = runtimeStatus?.chatbot_service;
  const perf = rankerMetrics?.performance;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          Model Performance
        </h1>
        <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
          Validate Uruti AI Modules runtime, run live prompts, and inspect ranker metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
          <CardHeader>
            <CardTitle>Uruti AI Modules Status</CardTitle>
            <CardDescription>Dedicated AI backend readiness for chatbot, analysis, and pitch coach</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Model ID:</span>
              <Badge variant="outline">{runtimeStatus?.chatbot_model_id || 'unknown'}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Engine Loaded:</span>
              <Badge className={engine?.loaded ? 'bg-green-600 text-white' : 'bg-amber-600 text-white'}>
                {engine?.loaded ? 'yes' : 'no'}
              </Badge>
            </div>
            {engine?.inference_mode && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Inference Mode:</span>
                <Badge className={engine.inference_mode === 'gemini' ? 'bg-blue-600 text-white' : engine.inference_mode === 'gguf-service' ? 'bg-purple-600 text-white' : 'bg-gray-500 text-white'}>
                  {engine.inference_mode}
                </Badge>
              </div>
            )}
            <div>Repo: <span className="text-muted-foreground">{engine?.repo_id || 'n/a'}</span></div>
            <div>File: <span className="text-muted-foreground">{engine?.filename || 'n/a'}</span></div>
            <div>Local Path Exists: <span className="text-muted-foreground">{String(engine?.local_path_exists ?? false)}</span></div>
            <div>HF Token Configured: <span className="text-muted-foreground">{String(engine?.hf_token_configured ?? false)}</span></div>
            {engine?.load_error && (
              <div className="text-red-600 dark:text-red-400">Load Error: {engine.load_error}</div>
            )}
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
          <CardHeader>
            <CardTitle>Service Split Health</CardTitle>
            <CardDescription>Core backend and dedicated chatbot service reachability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Core Backend:</span>
              <Badge className={coreService?.status === 'healthy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                {coreService?.status || 'unknown'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Dedicated Chatbot:</span>
              <Badge className={chatbotService?.reachable ? 'bg-green-600 text-white' : engine?.gemini_available ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}>
                {chatbotService?.reachable ? 'reachable' : engine?.gemini_available ? 'gemini (co-located)' : 'unreachable'}
              </Badge>
            </div>
            <div>Configured URL: <span className="text-muted-foreground">{chatbotService?.configured_url || 'n/a'}</span></div>
            <div>Health URL: <span className="text-muted-foreground">{chatbotService?.health_url || 'n/a'}</span></div>
            <div>Status Code: <span className="text-muted-foreground">{chatbotService?.status_code ?? 'n/a'}</span></div>
            <div>Latency: <span className="text-muted-foreground">{chatbotService?.latency_ms ?? 'n/a'} ms</span></div>
            {chatbotService?.error && (
              <div className="text-red-600 dark:text-red-400">Chatbot service error: {chatbotService.error}</div>
            )}
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
          <CardHeader>
            <CardTitle>Venture Ranker Metrics</CardTitle>
            <CardDescription>Scoring and source distribution for venture analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Total Ventures: <span className="text-muted-foreground">{perf?.total_ventures ?? 0}</span></div>
            <div>Scored Ventures: <span className="text-muted-foreground">{perf?.scored_ventures ?? 0}</span></div>
            <div>Average Score: <span className="text-muted-foreground">{perf?.average_score ?? 0}</span></div>
            <div>Score Range: <span className="text-muted-foreground">{perf?.min_score ?? 0} - {perf?.max_score ?? 0}</span></div>
            <div>Root Bundle: <span className="text-muted-foreground">{perf?.source_distribution?.root_models_bundle ?? 0}</span></div>
            <div>Heuristic Fallback: <span className="text-muted-foreground">{perf?.source_distribution?.heuristic_fallback ?? 0}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
        <CardHeader>
          <CardTitle>Model Registry</CardTitle>
          <CardDescription>All AI models currently exposed by backend</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">Total models: {models.length}</div>
          <div className="flex flex-wrap gap-2">
            {models.map((model: any) => (
              <Badge key={model.id} variant="outline">
                {model.name || model.id}
              </Badge>
            ))}
          </div>
          <div className="pt-2 text-sm">
            <div>Pitch backend: <span className="text-muted-foreground">{pitchEngine?.backend || 'n/a'}</span></div>
            <div>Pitch loaded: <span className="text-muted-foreground">{String(pitchEngine?.loaded ?? false)}</span></div>
            {pitchEngine?.load_error && pitchEngine?.backend !== 'fallback' && (
              <div className="text-red-600 dark:text-red-400">Pitch load error: {pitchEngine.load_error}</div>
            )}
            {pitchEngine?.backend === 'fallback' && (
              <div className="text-amber-700 dark:text-amber-300">
                Pitch coach is running in fallback mode. Set `PITCH_COACH_MODEL_ID` or enable local RL with `PITCH_COACH_ENABLE_LOCAL_RL=true`.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-sm bg-[#76B947]/5 dark:bg-black/20 border-[#76B947]/30">
        <CardHeader>
          <CardTitle>Run Live Model Test</CardTitle>
          <CardDescription>Use this to prove whether the response is model-backed or fallback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model: any) => (
                    <SelectItem key={model.id} value={model.id}>{model.name || model.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={runModelTest} disabled={testing} className="bg-[#76B947] text-white hover:bg-[#76B947]/90">
                {testing ? 'Running...' : 'Run Test'}
              </Button>
            </div>
          </div>

          <div>
            <Label>Prompt</Label>
            <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter test prompt" />
          </div>

          {result && (
            <div className="space-y-2 rounded-lg border border-black/10 dark:border-white/20 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">model: {result.model}</Badge>
                <Badge className={result.fallback_used ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}>
                  {result.fallback_used ? 'fallback used' : 'model inference'}
                </Badge>
                <Badge variant="outline">backend: {result.inference_backend || 'unknown'}</Badge>
              </div>
              {result.inference_error && (
                <div className="text-sm text-red-600 dark:text-red-400">Inference error: {result.inference_error}</div>
              )}
              <div className="text-sm whitespace-pre-wrap text-black/80 dark:text-white/80">{result.message}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
