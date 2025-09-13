
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Square, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Activity,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Wrench,
  AlertTriangle,
  Zap,
  HelpCircle
} from "lucide-react";

// ---------- Config - Live Crawler System ----------
const BASE = "https://eov213rrft8rpja.m.pipedream.net";
const EP_CRAWL_START = `${BASE}/crawl/start`;
const EP_DISCOVER = `${BASE}/crawl/discover`;
const EP_STATUS = `${BASE}/crawl/status`;
const EP_RESULTS = `${BASE}/crawl/results`;
const EP_ORDERS = `${BASE}/orders`;
const EP_HEALTH = `${BASE}/health`;
const EP_CRAWLER_UI = `${BASE}/?ui=1`;

const GROCERS = [
  { id: "tesco", label: "Tesco", status: "✅ Live", heavy: true },
  { id: "iceland", label: "Iceland", status: "✅ Live", heavy: false },
  { id: "asda", label: "ASDA", status: "🚧 Pending", heavy: true },
  { id: "sainsburys", label: "Sainsbury's", status: "🚧 Pending", heavy: true },
  { id: "morrisons", label: "Morrisons", status: "🚧 Pending", heavy: false },
  { id: "waitrose", label: "Waitrose", status: "🚧 Pending", heavy: false },
  { id: "lidl", label: "Lidl", status: "🚧 Pending", heavy: false },
  { id: "aldi", label: "Aldi", status: "🚧 Pending", heavy: false },
  { id: "coop", label: "Co-op", status: "🚧 Pending", heavy: false },
  { id: "ocado", label: "Ocado", status: "🚧 Pending", heavy: false }
];

// ---------- Utilities ----------
function now() { return new Date().toLocaleTimeString(); }

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

async function fetchPreviewNDJSON(url, maxLines = 50) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const lines = text.split('\n').filter(Boolean).slice(0, maxLines);
    return lines.map(line => {
      try { return JSON.parse(line); }
      catch { return { raw: line }; }
    });
  } catch (e) {
    return [{ error: e.message }];
  }
}

// ---------- Components ----------
function MetricCard({ title, value, subtitle, icon: Icon, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    red: "bg-red-50 border-red-200 text-red-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600",
    gray: "bg-gray-50 border-gray-200 text-gray-600"
  };

  return (
    <Card className={`border-2 ${colorClasses[color]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value ?? "—"}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          {Icon && <Icon className="w-8 h-8 opacity-60" />}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminCrawlDashboard() {
  const [log, setLog] = useState([`[${now()}] Live Crawler Dashboard Ready`]);
  const push = (m) => setLog(x => [`[${now()}] ${m}`, ...x].slice(0, 100));

  // System state
  const [health, setHealth] = useState(null);
  const [discoveryResult, setDiscoveryResult] = useState(null);
  const [discoveryFetching, setDiscoveryFetching] = useState(false);
  const [ordersFetching, setOrdersFetching] = useState(false);
  const [ordersResult, setOrdersResult] = useState(null);
  const [show400ErrorGuide, setShow400ErrorGuide] = useState(false); // NEW STATE

  // Crawl configuration
  const [selGrocers, setSelGrocers] = useState(["tesco", "iceland"]);
  const [concurrency, setConcurrency] = useState(2);
  const [maxDepth, setMaxDepth] = useState(4);
  
  // Monitoring
  const [activeJob, setActiveJob] = useState("");
  const [status, setStatus] = useState(null);
  const [poll, setPoll] = useState(false);
  const [preview, setPreview] = useState([]);

  // Polling effect (8s interval as recommended)
  useEffect(() => {
    if (!poll || !activeJob) return;
    const interval = setInterval(() => fetchStatus(activeJob, true), 8000);
    return () => clearInterval(interval);
  }, [poll, activeJob]);

  // --- Core API Functions with Enhanced Error Handling ---
  async function pingHealth() {
    try {
      push("🔍 Checking system health...");
      const response = await fetch(EP_HEALTH, { 
        method: "GET",
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const j = await response.json();
      setHealth({ ok: true, ...j }); // Add 'ok: true' to health status
      push("✅ System health check passed");
    } catch (e) {
      if (String(e.message).includes('400')) setShow400ErrorGuide(true); // Show guide on 400
      setHealth({ error: e.message });
      push(`❌ Health check failed: ${e.message}`);
      
      // Try alternative health check methods
      push("🔄 Trying alternative health check...");
      try {
        // Test the root endpoint instead
        const rootResponse = await fetch(BASE, { 
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });
        
        if (rootResponse.ok) {
          setHealth({ ok: true, alternative: true });
          push("✅ Alternative health check passed (root endpoint responsive)");
        } else {
          const altErrorText = await rootResponse.text();
          const errorMessage = `HTTP ${rootResponse.status}: ${altErrorText || 'Error in workflow'}`;
          if (errorMessage.includes('400')) setShow400ErrorGuide(true); // Show guide on 400
          push(`❌ Alternative health check also failed: ${errorMessage}`);
        }
      } catch (altError) {
        if (String(altError.message).includes('400')) setShow400ErrorGuide(true); // Show guide on 400
        push(`❌ Alternative health check also failed: ${altError.message}`);
      }
    }
  }

  async function runDiscoveryTest() {
    setDiscoveryFetching(true);
    push("🔍 Testing URL discovery (Tesco & Iceland)...");
    try {
      const res = await postJSON(EP_DISCOVER, {});
      setDiscoveryResult(res);
      push(`✅ Discovery test successful: Found ${res.urls?.length || 0} URLs from ${res.providers?.length || 0} providers`);
    } catch (e) {
      if (String(e.message).includes('400')) setShow400ErrorGuide(true); // Show guide on 400
      setDiscoveryResult({ error: e.message });
      push(`❌ Discovery test failed: ${e.message}`);
    } finally {
      setDiscoveryFetching(false);
    }
  }

  async function startProductCrawl() {
    if (!selGrocers.length) {
      push("❌ No grocers selected for crawl");
      return;
    }
    try {
      const body = { providers: selGrocers, concurrency, maxDepth };
      push(`🚀 Starting product crawl: ${selGrocers.join(', ')} (concurrency: ${concurrency}, depth: ${maxDepth})`);
      const j = await postJSON(EP_CRAWL_START, body);
      const id = j.jobId || "";
      setActiveJob(id);
      push(`✅ Crawl job started successfully: ${id}`);
      setPoll(true);
    } catch (e) {
      if (String(e.message).includes('400')) setShow400ErrorGuide(true); // Show guide on 400
      push(`❌ Failed to start crawl: ${e.message}`);
    }
  }

  async function testOrdersFetch() {
    if (ordersFetching) return;
    setOrdersFetching(true);
    push("🔐 Testing auto-login and orders fetch (Tesco)...");
    try {
      const result = await postJSON(EP_ORDERS, { provider: "tesco", alias: "main", test: true });
      setOrdersResult(result);
      push(`✅ Orders fetch test successful: ${result.orders?.length || 0} orders retrieved`);
    } catch (e) {
      if (String(e.message).includes('400')) setShow400ErrorGuide(true); // Show guide on 400
      setOrdersResult({ error: e.message });
      push(`❌ Orders fetch test failed: ${e.message}`);
    } finally {
      setOrdersFetching(false);
    }
  }

  async function fetchStatus(jobId, silent = false) {
    if (!jobId) {
      if (!silent) push("❌ No Job ID provided for status check");
      return;
    }
    try {
      const j = await getJSON(`${EP_STATUS}?jobId=${encodeURIComponent(jobId)}&deep=1`);
      setStatus(j);
      if (!silent) push(`📊 Status retrieved for job ${jobId}`);
    } catch (e) {
      if (String(e.message).includes('400')) setShow400ErrorGuide(true); // Show guide on 400
      if (!silent) push(`❌ Status fetch failed: ${e.message}`);
    }
  }

  async function loadResultsPreview() {
    if (!activeJob) {
      push("❌ No active job selected for preview");
      return;
    }
    try {
      const url = `${EP_RESULTS}?jobId=${encodeURIComponent(activeJob)}&format=ndjson`;
      const data = await fetchPreviewNDJSON(url, 50);
      setPreview(data);
      push(`📋 Results preview loaded: ${data.length} rows (first 50)`);
    } catch (e) {
      if (String(e.message).includes('400')) setShow400ErrorGuide(true); // Show guide on 400
      push(`❌ Preview load failed: ${e.message}`);
    }
  }

  // --- UI State Calculations ---
  const statusMetrics = useMemo(() => {
    if (!status?.stats) return {};
    const stats = status.stats;
    return {
      queued: stats.queued || 0,
      processing: stats.processing || 0,
      completed: stats.completed || 0,
      failed: stats.failed || 0,
      total: stats.total || 0,
      progress: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    };
  }, [status]);

  const exportLinks = activeJob ? {
    ndjson: `${EP_RESULTS}?jobId=${encodeURIComponent(activeJob)}&format=ndjson`,
    csv: `${EP_RESULTS}?jobId=${encodeURIComponent(activeJob)}&format=csv`
  } : {};

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🚀 Live Grocery Crawler Control</h1>
          <p className="text-gray-600 mt-2">
            Zyte-powered crawler system. Test endpoints and monitor crawl progress.
          </p>
          
          {/* Show different alerts based on health status */}
          {health?.error ? (
            <Alert className="mt-4 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Health Check Issue:</strong> {health.error}. Try testing other endpoints below.
              </AlertDescription>
            </Alert>
          ) : health?.alternative ? (
            <Alert className="mt-4 border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>System Responsive:</strong> Root endpoint working. Health endpoint may need configuration.
              </AlertDescription>
            </Alert>
          ) : health?.ok ? (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>System Status:</strong> All endpoints operational and ready for production crawls.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mt-4 border-gray-200 bg-gray-50">
              <Clock className="h-4 w-4 text-gray-600" />
              <AlertDescription className="text-gray-800">
                <strong>Status:</strong> Click "Check Health" to verify system status.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* NEW: Debugging Guide for 400 Errors */}
        {show400ErrorGuide && (
          <Card className="mb-8 border-2 border-amber-300 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-amber-800">
                <HelpCircle className="w-6 h-6" />
                Debugging Guide: "400 Error in workflow"
              </CardTitle>
            </CardHeader>
            <CardContent className="text-amber-900 space-y-3 text-sm">
              <p>A persistent <code className="font-semibold bg-amber-200/50 px-1 py-0.5 rounded">400 Error</code> indicates a problem with the Pipedream workflow's initial setup, not the request itself. Please check the following in your Pipedream account:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Workflow Trigger:</strong> Ensure the HTTP trigger for your workflow is correctly configured and doesn't have validation that is failing.</li>
                <li><strong>Environment Variables:</strong> Verify that all required environment variables (like API keys or Data Store names) are set correctly and are accessible by the workflow.</li>
                <li><strong>Pipedream Credits:</strong> Check if you have available Pipedream credits. Workflows may fail to start if you've run out.</li>
                <li><strong>Early Code Errors:</strong> Look at the first few steps of your workflow code in Pipedream. An error in the initial lines can cause the entire workflow to fail with a 400 status.</li>
                <li><strong>Pipedream Logs:</strong> The most detailed information will be in the Pipedream workflow's own logs. Check there for the specific error message.</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* System Health & Quick Tests */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={pingHealth} variant="outline" className="w-full mb-3">
                Check Health
              </Button>
              {health && (
                <div className={`text-sm p-2 rounded ${
                  health.error 
                    ? 'bg-red-50 text-red-700' 
                    : health.alternative 
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-green-50 text-green-700'
                }`}>
                  {health.error 
                    ? `❌ ${health.error}`
                    : health.alternative 
                      ? '🔄 Root endpoint OK'
                      : '✅ Operational'
                  }
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Search className="w-4 h-4" />
                URL Discovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runDiscoveryTest} 
                disabled={discoveryFetching} 
                variant="outline" 
                className="w-full mb-3"
              >
                {discoveryFetching ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Test Discovery
              </Button>
              {discoveryResult && (
                <div className={`text-sm p-2 rounded ${discoveryResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {discoveryResult.error || `Found ${discoveryResult.urls?.length || 0} URLs`}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="w-4 h-4" />
                Orders Auto-Login
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testOrdersFetch} 
                disabled={ordersFetching} 
                variant="outline" 
                className="w-full mb-3"
              >
                {ordersFetching ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                Test Orders
              </Button>
              {ordersResult && (
                <div className={`text-sm p-2 rounded ${ordersResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {ordersResult.error || `${ordersResult.orders?.length || 0} orders found`}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wrench className="w-4 h-4" />
                Advanced UI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <a href={EP_CRAWLER_UI} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Pipedream UI
                </a>
              </Button>
              <p className="text-xs text-gray-500 mt-2">Full crawler management interface</p>
            </CardContent>
          </Card>
        </div>

        {/* Crawl Configuration & Start */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Production Crawl Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">
                Select Providers ({selGrocers.length}/{GROCERS.length} selected)
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {GROCERS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelGrocers(p => p.includes(item.id) ? p.filter(x => x !== item.id) : [...p, item.id])}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border ${
                      selGrocers.includes(item.id)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {item.label}
                    <span className="ml-1 text-xs opacity-75">{item.status}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="concurrency" className="text-sm">Concurrency</Label>
                <Input 
                  id="concurrency" 
                  type="number" 
                  min="1" 
                  max="5" 
                  value={concurrency} 
                  onChange={e => setConcurrency(parseInt(e.target.value) || 1)} 
                />
                <p className="text-xs text-gray-500 mt-1">2-3 recommended for heavy providers</p>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="maxDepth" className="text-sm">Max Depth</Label>
                <Input 
                  id="maxDepth" 
                  type="number" 
                  min="1" 
                  max="10" 
                  value={maxDepth} 
                  onChange={e => setMaxDepth(parseInt(e.target.value) || 4)} 
                />
                <p className="text-xs text-gray-500 mt-1">4 = initial crawl, 1 = price updates</p>
              </div>
              <div className="md:col-span-2 flex items-end">
                <Button 
                  onClick={startProductCrawl} 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  disabled={!selGrocers.length}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Production Crawl
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Monitoring */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Real-time Job Monitoring
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Job ID to monitor" 
                  value={activeJob} 
                  onChange={e => setActiveJob(e.target.value)} 
                  className="w-auto sm:w-64" 
                />
                <Button onClick={() => fetchStatus(activeJob)} variant="outline" size="icon">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={() => setPoll(!poll)} 
                  variant={poll ? "destructive" : "default"} 
                  className="w-28"
                >
                  {poll ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Auto-Poll
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {status ? (
              <div className="space-y-6">
                <div className="grid md:grid-cols-4 gap-4">
                  <MetricCard 
                    title="Queued" 
                    value={statusMetrics.queued} 
                    icon={Clock} 
                    color="gray" 
                  />
                  <MetricCard 
                    title="Processing" 
                    value={statusMetrics.processing} 
                    icon={Activity} 
                    color="blue" 
                  />
                  <MetricCard 
                    title="Completed" 
                    value={statusMetrics.completed} 
                    icon={CheckCircle} 
                    color="green" 
                  />
                  <MetricCard 
                    title="Failed" 
                    value={statusMetrics.failed} 
                    icon={XCircle} 
                    color="red" 
                  />
                </div>
                
                {statusMetrics.total > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Progress</span>
                      <span>{statusMetrics.progress}% ({statusMetrics.completed}/{statusMetrics.total})</span>
                    </div>
                    <Progress value={statusMetrics.progress} className="h-3" />
                  </div>
                )}
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Raw Status Response</h4>
                  <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-40">
                    {JSON.stringify(status, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Enter a Job ID and start polling to see live progress updates.</p>
                <p className="text-sm mt-2">Polling interval: 8 seconds (recommended)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export & Preview Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-600" />
              Export & Preview Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button onClick={loadResultsPreview} variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Load Preview (50 rows)
              </Button>
              {activeJob && (
                <>
                  <Button asChild variant="outline">
                    <a href={exportLinks.ndjson} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download NDJSON
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={exportLinks.csv} download>
                      <Download className="w-4 h-4 mr-2" />
                      Download CSV
                    </a>
                  </Button>
                </>
              )}
            </div>
            
            {preview.length > 0 && (
              <div className="border rounded-lg overflow-auto max-h-96">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Title</th>
                      <th className="px-4 py-2 text-left font-medium">Price</th>
                      <th className="px-4 py-2 text-left font-medium">Store</th>
                      <th className="px-4 py-2 text-left font-medium">Category</th>
                      <th className="px-4 py-2 text-left font-medium">Loyalty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2 font-medium">{item.title || "—"}</td>
                        <td className="px-4 py-2">£{item.price || "—"}</td>
                        <td className="px-4 py-2">{item.store || "—"}</td>
                        <td className="px-4 py-2">{item.category || "—"}</td>
                        <td className="px-4 py-2">{item.loyalty_price ? `£${item.loyalty_price}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded h-48 overflow-auto">
              {log.join('\n')}
            </pre>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
