import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ServerCrash, Trash2 } from "lucide-react";

const EP_BASE = "https://eov213rrft8rpja.m.pipedream.net";
const EP_G = `${EP_BASE}/`;
const EP_O = `${EP_BASE}/orders`;
const EP_OB = `${EP_BASE}/orders/batch`;
const EP_T = `${EP_BASE}/tests`;
const EP_H = `${EP_BASE}/health`;

export default function Diagnostics() {
  const [log, setLog] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(null);

  const push = (m) => setLog((x) => [`[${new Date().toLocaleTimeString()}] ${m}`, ...x].slice(0, 100));

  const runTest = async (testName, testFn) => {
    setLoading(testName);
    setResults(prev => ({...prev, [testName]: null})); // Clear previous result for this test
    await testFn();
    setLoading(null);
  };
  
  const clearAll = () => {
    setLog([]);
    setResults({});
    push("Logs and results cleared.");
  }

  async function runGrocer() {
    push(`Grocers → POST ${EP_G}`);
    try {
      const r = await fetch(EP_G, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store: "iceland", listUrl: "https://www.iceland.co.uk/c/frozen-chips" }),
      });
      const t = await r.text();
      if (!r.ok) throw new Error(`${r.status} ${t}`);
      const j = JSON.parse(t);
      setResults(prev => ({...prev, grocer: j}));
      push(`✅ Grocers: ${r.status} zyteStatus=${j?.audit?.zyteStatus} reqId=${j?.audit?.zyteRequestId} time=${j?.audit?.responseTime}ms`);
    } catch (e) {
      push(`❌ Grocers error: ${e.message}`);
      setResults(prev => ({...prev, grocer: { error: e.message }}));
    }
  }

  async function runOrders() {
    push(`Orders → POST ${EP_O}`);
    try {
      const r = await fetch(EP_O, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "tesco", alias: "main" }),
      });
      const t = await r.text();
      if (!r.ok) throw new Error(`${r.status} ${t}`);
      const j = JSON.parse(t);
      setResults(prev => ({...prev, orders: j}));
      push(`✅ Orders: ${r.status} engine=${j?.audit?.engine} count=${j?.orders?.length||0} reqId=${j?.audit?.zyteRequestId} time=${j?.audit?.responseTime}ms`);
    } catch (e) {
      push(`❌ Orders error: ${e.message}`);
      setResults(prev => ({...prev, orders: { error: e.message }}));
    }
  }

  async function runOrdersBatch() {
    push(`Orders Batch → POST ${EP_OB}`);
    try {
      const r = await fetch(EP_OB, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { provider: "tesco", alias: "main" },
          { provider: "asda", alias: "main" }
        ]),
      });
      const t = await r.text();
      if (!r.ok) throw new Error(`${r.status} ${t}`);
      const j = JSON.parse(t);
      setResults(prev => ({...prev, batch: j}));
      push(`✅ Orders Batch: ${r.status} jobs=${j?.jobs?.length} success=${j?.successRate * 100}%`);
    } catch (e) {
      push(`❌ Orders Batch error: ${e.message}`);
      setResults(prev => ({...prev, batch: { error: e.message }}));
    }
  }

  async function runTests() {
    push(`Tests → POST ${EP_T}`);
    try {
      const r = await fetch(EP_T, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const t = await r.text();
      if (!r.ok) throw new Error(`${r.status} ${t}`);
      const j = JSON.parse(t);
      setResults(prev => ({...prev, tests: j}));
      push(`✅ Tests: ${r.status} stores=${j?.totals?.stores} products=${j?.totals?.products} success=${j?.totals?.successRate * 100}%`);
    } catch (e) {
      push(`❌ Tests error: ${e.message}`);
      setResults(prev => ({...prev, tests: { error: e.message }}));
    }
  }

  async function runHealth() {
    push(`Health → GET ${EP_H}`);
    try {
      const r = await fetch(EP_H, { method: "GET" });
      const t = await r.text();
      if (!r.ok) throw new Error(`${r.status} ${t}`);
      const j = JSON.parse(t);
      setResults(prev => ({...prev, health: j}));
      push(`✅ Health: ${r.status} ok=${j.ok}`);
    } catch (e) {
      push(`❌ Health error: ${e.message}`);
      setResults(prev => ({...prev, health: { error: e.message }}));
    }
  }

  const renderResult = (title, data) => (
    data && (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-green-300 p-3 rounded max-h-[60vh] overflow-auto text-sm font-mono">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    )
  );
  
  const testButtons = [
    { name: 'health', label: 'Run Health Check', fn: runHealth, color: 'bg-green-600 hover:bg-green-700' },
    { name: 'grocer', label: 'Run Grocers (single URL)', fn: runGrocer, color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'orders', label: 'Run Orders (single)', fn: runOrders, color: 'bg-indigo-600 hover:bg-indigo-700' },
    { name: 'batch', label: 'Run Orders (batch)', fn: runOrdersBatch, color: 'bg-purple-600 hover:bg-purple-700' },
    { name: 'tests', label: 'Run Multi-store Tests', fn: runTests, color: 'bg-emerald-600 hover:bg-emerald-700' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Workflow Diagnostics</h1>
            <p className="text-gray-600 mt-1">A single interface to test all endpoints of the Pipedream workflow.</p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Test Control Panel</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 items-center">
                {testButtons.map(btn => (
                    <Button key={btn.name} onClick={() => runTest(btn.name, btn.fn)} disabled={!!loading} className={`${btn.color}`}>
                        {loading === btn.name && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {btn.label}
                    </Button>
                ))}
                 <Button onClick={clearAll} variant="outline" disabled={!!loading}>
                    <Trash2 className="mr-2 h-4 w-4"/>
                    Clear All
                </Button>
            </CardContent>
        </Card>
        
        {results?.health?.error?.includes("400") && (
            <Card className="bg-amber-50 border-amber-200">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                    <ServerCrash className="w-6 h-6 text-amber-600"/>
                    <CardTitle className="text-amber-800">Debugging "400 Error in workflow"</CardTitle>
                </CardHeader>
                <CardContent className="text-amber-700 space-y-2 text-sm">
                    <p>A <code className="bg-amber-200/50 px-1 py-0.5 rounded">400</code> error often indicates an issue with the Pipedream workflow's trigger or initial steps, rather than the test request itself.</p>
                    <p><strong>Common Causes:</strong></p>
                    <ul className="list-disc pl-5">
                        <li><strong>Incorrect Trigger Configuration:</strong> Ensure the HTTP trigger is set up correctly and doesn't have strict validation that's failing.</li>
                        <li><strong>Missing Environment Variables:</strong> The workflow might be failing immediately if it's trying to access an environment variable that isn't set.</li>
                        <li><strong>Early Code Error:</strong> An error in the first few lines of your Pipedream code can cause the entire workflow to return a 400 status.</li>
                    </ul>
                    <p>Please check the Pipedream logs for this workflow for more specific details.</p>
                </CardContent>
            </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderResult("Health Result", results.health)}
            {renderResult("Grocers Result", results.grocer)}
            {renderResult("Orders Result", results.orders)}
            {renderResult("Orders Batch Result", results.batch)}
            {renderResult("Tests Result (3 per store)", results.tests)}
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Event Log</CardTitle>
            </Header>
            <CardContent>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg h-64 overflow-auto text-sm font-mono">{log.join("\n")}</pre>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}