
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";

// Uses the same Pipedream root endpoint you already configured
const EP = "https://eov213rrft8rpja.m.pipedream.net".replace(/\/$/, "");

function dl(filename, text) {
  const blob = new Blob([text], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function BulkCategoryRunner() {
  const [urlsText, setUrlsText] = useState(
`https://www.iceland.co.uk/c/frozen-chips
https://www.tesco.com/groceries/en-GB/shop/frozen-food/all
https://www.ocado.com/browse/frozen-59877011`
  );
  const [concurrency, setConcurrency] = useState(4);
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState([]);
  const [log, setLog] = useState([]);

  const urls = useMemo(() =>
    urlsText.split(/\r?\n/).map(s=>s.trim()).filter(Boolean), [urlsText]);

  const push = (m) => setLog(x => [`[${new Date().toLocaleTimeString()}] ${m}`, ...x].slice(0,300));

  async function run() {
    setRunning(true); setRows([]); push(`Starting bulk fetch of ${urls.length} URLs @ ${concurrency}x`);
    const q = [...urls];
    let inFlight = 0;
    const results = [];

    async function worker() {
      while (q.length) {
        const url = q.shift();
        inFlight++;
        try {
          push(`→ ${url}`);
          const r = await fetch(EP, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
          const t = await r.text();
          let j; try { j = JSON.parse(t); } catch { j = { ok:false, error:"Non-JSON", raw:t.slice(0,200) }; }
          const audit = j.audit || {};
          const count = Array.isArray(j.products) ? j.products.length : (j.count ?? 0);
          results.push({
            url, ok: !!j.ok, count,
            zyteStatus: audit.zyteStatus ?? null,
            contentType: audit.contentType ?? null,
            htmlLen: audit.htmlLen ?? null,
            sha256: audit.sha256 ?? null,
            error: j.error || audit.error || null,
          });
          push(`✓ ${url} — ok=${j.ok} count=${count} zyte=${audit.zyteStatus ?? "?"}`);
        } catch (e) {
          results.push({ url, ok:false, count:0, error:String(e.message || e) });
          push(`✗ ${url} — ${String(e.message || e)}`);
        } finally {
          inFlight--;
          setRows([...results]); // incremental update
        }
      }
    }

    const workers = Array.from({ length: Math.max(1, Number(concurrency)||1) }, worker);
    await Promise.all(workers);
    setRunning(false);
    push("Done.");
  }

  function exportCSV() {
    const headers = ["url","ok","count","zyteStatus","contentType","htmlLen","sha256","error"];
    const lines = [headers.join(",")].concat(
      rows.map(r => headers.map(h => {
        const v = r[h]; const s = (v==null?"":String(v)).replace(/"/g,'""');
        return `"${s}"`;
      }).join(","))
    );
    dl(`bulk-results-${Date.now()}.csv`, lines.join("\n"));
  }

  function exportNDJSON() {
    dl(`bulk-results-${Date.now()}.ndjson`, rows.map(r=>JSON.stringify(r)).join("\n"));
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Bulk Category Runner (via Pipedream)</h1>
        <p className="text-gray-600 mt-2">
          Paste category/list URLs (one per line). This calls your Pipedream endpoint (server-side Zyte) and shows parsed products & audits.
        </p>

        <Card className="mt-8 p-6 shadow-lg border-0">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category URLs (one per line)</label>
                <textarea
                  className="w-full border rounded-lg p-2 h-48 font-mono text-sm shadow-inner bg-gray-50"
                  value={urlsText}
                  onChange={e=>setUrlsText(e.target.value)}
                  placeholder="https://www.tesco.com/groceries/en-GB/shop/fresh-food/all"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Concurrency</label>
                  <input type="number" min={1} max={10}
                    className="w-full border rounded-lg px-3 py-2 shadow-inner"
                    value={concurrency}
                    onChange={e=>setConcurrency(e.target.value)} />
                </div>
                <button
                  disabled={running || urls.length===0}
                  onClick={run}
                  className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  {running ? "Running…" : `Run ${urls.length} URLs`}
                </button>

                <div className="flex gap-3">
                  <button onClick={exportCSV} className="w-full px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-emerald-700 transition-colors" disabled={!rows.length}>
                    Export CSV
                  </button>
                  <button onClick={exportNDJSON} className="w-full px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-amber-700 transition-colors" disabled={!rows.length}>
                    Export NDJSON
                  </button>
                </div>
              </div>
            </div>
        </Card>

        <section className="space-y-4 mt-8">
          <h2 className="text-xl font-semibold">Results ({rows.length})</h2>
          <div className="overflow-auto border rounded-lg shadow-md bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left border-b font-medium text-gray-600">URL</th>
                  <th className="px-3 py-2 text-left border-b font-medium text-gray-600">OK</th>
                  <th className="px-3 py-2 text-left border-b font-medium text-gray-600">Count</th>
                  <th className="px-3 py-2 text-left border-b font-medium text-gray-600">Zyte</th>
                  <th className="px-3 py-2 text-left border-b font-medium text-gray-600">Content-Type</th>
                  <th className="px-3 py-2 text-left border-b font-medium text-gray-600">HTML Len</th>
                  <th className="px-3 py-2 text-left border-b font-medium text-gray-600">SHA256</th>
                  <th className="px-3 py-2 text-left border-b font-medium text-gray-600">Error</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r,i)=>(
                  <tr key={i} className="odd:bg-white even:bg-gray-50/50">
                    <td className="px-3 py-1.5 border-b max-w-[26rem] truncate" title={r.url}>{r.url}</td>
                    <td className="px-3 py-1.5 border-b">{String(r.ok)}</td>
                    <td className="px-3 py-1.5 border-b">{r.count}</td>
                    <td className="px-3 py-1.5 border-b">{r.zyteStatus ?? ""}</td>
                    <td className="px-3 py-1.5 border-b">{r.contentType ?? ""}</td>
                    <td className="px-3 py-1.5 border-b">{r.htmlLen ?? ""}</td>
                    <td className="px-3 py-1.5 border-b font-mono text-xs">{r.sha256 ? r.sha256.slice(0,10)+'...' : ''}</td>
                    <td className="px-3 py-1.5 border-b text-red-600">{r.error ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Log</h2>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg h-48 overflow-auto text-sm">
  {log.join("\n")}
          </pre>
        </section>
      </div>
    </div>
  );
}
