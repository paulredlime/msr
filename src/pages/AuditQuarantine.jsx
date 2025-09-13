import { QuarantinedItem } from "@/api/entities";

export default function AuditQuarantine() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Quarantine Audit API</h1>
      <div className="bg-blue-50 p-4 rounded">
        <p>Returns quarantine statistics from real database.</p>
        <p>GET request returns totals and breakdown by reason.</p>
      </div>
    </div>
  );
}

export async function getServerSideProps({ req, res }) {
  if (req.method !== 'GET') {
    return { props: {} };
  }

  try {
    // Get all quarantined items
    const quarantinedItems = await QuarantinedItem.list();
    
    // Calculate stats
    const total = quarantinedItems.length;
    const reasons = {};
    
    quarantinedItems.forEach(item => {
      const reason = item.reason || 'unknown';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      total,
      reasons,
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    console.error('[API] Quarantine audit error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      total: 0,
      reasons: {},
      error: error.message || 'Failed to load quarantine audit data' 
    }));
  }

  return { props: {} };
}