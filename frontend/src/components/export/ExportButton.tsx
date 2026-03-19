import { useState } from "react";
import { FaDownload, FaFileCsv, FaFilePdf, FaChevronDown } from "react-icons/fa";

// ── CSV export ────────────────────────────────────────────────────────────────
export const exportCSV = (filename: string, rows: Record<string, any>[]) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = String(v ?? "").replace(/"/g, '""');
    return /[,"\n]/.test(s) ? `"${s}"` : s;
  };
  const csv = [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};

// ── PDF export (print-based, no extra deps) ───────────────────────────────────
export const exportPDF = (title: string, rows: Record<string, any>[]) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const thStyle = `style="padding:8px 12px;background:#1e293b;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #334155;text-align:left"`;
  const tdStyle = `style="padding:8px 12px;font-size:12px;color:#e2e8f0;border-bottom:1px solid #1e293b"`;
  const html = `
    <html><head><title>${title}</title>
    <style>
      body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px}
      h2{color:#60a5fa;font-size:18px;margin-bottom:4px}
      p{color:#64748b;font-size:12px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse;background:#1e293b;border-radius:8px;overflow:hidden}
      @media print{body{background:#fff;color:#000}table{background:#fff}h2{color:#2563eb}}
    </style></head>
    <body>
      <h2>${title}</h2>
      <p>Exported on ${new Date().toLocaleDateString("en-PH", { dateStyle: "long" })}</p>
      <table>
        <thead><tr>${headers.map(h => `<th ${thStyle}>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(r => `<tr>${headers.map(h => `<td ${tdStyle}>${r[h] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </body></html>`;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 400);
};

// ── Full analytics report print ───────────────────────────────────────────────
export const printAnalyticsReport = (stats: any) => {
  if (!stats) return;

  const monthlyStats  = stats.monthlyStats      || [];
  const catBreakdown  = stats.categoryBreakdown  || [];
  const topReporters  = stats.topReporters       || [];
  const peakDays      = stats.peakReportingDays  || [];
  const unclaimedAge  = stats.unclaimedItemsAge  || {};
  const matchRate     = stats.lostFoundMatchRate  || {};
  const date = new Date().toLocaleDateString("en-PH", { dateStyle: "long" });

  const tableStyle = `width:100%;border-collapse:collapse;margin-bottom:24px;font-size:12px`;
  const thStyle    = `padding:8px 12px;background:#1e293b;color:#94a3b8;text-align:left;border-bottom:2px solid #334155;font-size:11px;text-transform:uppercase;letter-spacing:.05em`;
  const tdStyle    = `padding:8px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0`;
  const sectionHdr = (title: string) =>
    `<h3 style="color:#60a5fa;font-size:14px;font-weight:700;margin:28px 0 10px;border-bottom:1px solid #1e293b;padding-bottom:6px">${title}</h3>`;

  const statCards = [
    { label: "Total Found",        value: stats.foundItems   ?? 0, color: "#22d3ee" },
    { label: "Total Lost",         value: stats.lostItems    ?? 0, color: "#f87171" },
    { label: "Total Claims",       value: stats.totalClaims  ?? 0, color: "#facc15" },
    { label: "Claimed Items",      value: stats.claimedItems ?? 0, color: "#34d399" },
    { label: "Approved Claims",    value: stats.approvedClaims ?? 0, color: "#34d399" },
    { label: "Rejected Claims",    value: stats.rejectedClaims ?? 0, color: "#f87171" },
    { label: "Match Rate",         value: `${matchRate.matchRate ?? 0}%`, color: "#a78bfa" },
    { label: "Avg Resolution",     value: `${stats.avgClaimResolutionDays ?? "N/A"} days`, color: "#a78bfa" },
  ];

  const html = `
  <html><head><title>NBSC Analytics Report — ${date}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:32px;max-width:960px;margin:0 auto}
    h1{color:#fff;font-size:22px;font-weight:800;margin:0 0 4px}
    .subtitle{color:#64748b;font-size:13px;margin-bottom:28px}
    .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
    .stat-card{background:#1e293b;border-radius:10px;padding:14px 16px}
    .stat-val{font-size:26px;font-weight:800;line-height:1}
    .stat-lbl{font-size:11px;color:#64748b;margin-top:4px}
    table{${tableStyle}}
    th{${thStyle}}
    td{${tdStyle}}
    tr:last-child td{border-bottom:none}
    .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600}
    @media print{
      body{background:#fff;color:#000;padding:20px}
      h1,h3{color:#1e40af}
      .stat-card{background:#f1f5f9;border:1px solid #e2e8f0}
      .stat-val{color:#1e40af}
      table{font-size:11px}
      th{background:#e2e8f0;color:#475569}
      td{color:#1e293b;border-bottom:1px solid #e2e8f0}
    }
  </style></head>
  <body>
    <h1>NBSC Lost &amp; Found — Analytics Report</h1>
    <p class="subtitle">Generated on ${date} &nbsp;·&nbsp; NBSC Student Affairs Services</p>

    <!-- Summary Stats -->
    <div class="stat-grid">
      ${statCards.map(s => `
        <div class="stat-card">
          <div class="stat-val" style="color:${s.color}">${s.value}</div>
          <div class="stat-lbl">${s.label}</div>
        </div>`).join("")}
    </div>

    <!-- Monthly Trends -->
    ${sectionHdr("Monthly Trends")}
    ${monthlyStats.length === 0 ? "<p style='color:#64748b;font-size:12px'>No data yet</p>" : `
    <table>
      <thead><tr>
        <th>Month</th><th>Found</th><th>Lost</th><th>Claims</th><th>Resolved</th><th>Resolution Rate</th>
      </tr></thead>
      <tbody>
        ${monthlyStats.map((m: any) => `<tr>
          <td>${m.month}</td>
          <td style="color:#22d3ee">${m.found ?? 0}</td>
          <td style="color:#f87171">${m.lost ?? 0}</td>
          <td style="color:#facc15">${m.claims ?? 0}</td>
          <td style="color:#34d399">${m.resolved ?? 0}</td>
          <td>${m.resolutionRate ?? 0}%</td>
        </tr>`).join("")}
      </tbody>
    </table>`}

    <!-- Category Breakdown -->
    ${sectionHdr("Category Breakdown")}
    ${catBreakdown.length === 0 ? "<p style='color:#64748b;font-size:12px'>No data yet</p>" : `
    <table>
      <thead><tr><th>Category</th><th>Found</th><th>Lost</th><th>Total</th></tr></thead>
      <tbody>
        ${catBreakdown.map((c: any) => `<tr>
          <td>${c.name}</td>
          <td style="color:#22d3ee">${c.found ?? 0}</td>
          <td style="color:#f87171">${c.lost ?? 0}</td>
          <td style="font-weight:700">${c.total ?? 0}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}

    <!-- Peak Reporting Days -->
    ${sectionHdr("Peak Reporting Days")}
    ${peakDays.length === 0 ? "<p style='color:#64748b;font-size:12px'>No data yet</p>" : `
    <table>
      <thead><tr><th>Day</th><th>Found</th><th>Lost</th><th>Total</th></tr></thead>
      <tbody>
        ${peakDays.map((d: any) => `<tr>
          <td>${d.day}</td>
          <td style="color:#22d3ee">${d.found ?? 0}</td>
          <td style="color:#f87171">${d.lost ?? 0}</td>
          <td style="font-weight:700">${d.total ?? 0}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}

    <!-- Unclaimed Items Age -->
    ${sectionHdr("Unclaimed Items Age")}
    <table>
      <thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Items unclaimed 7+ days</td><td style="color:#facc15">${unclaimedAge.over7days ?? 0}</td></tr>
        <tr><td>Items unclaimed 30+ days</td><td style="color:#fb923c">${unclaimedAge.over30days ?? 0}</td></tr>
        <tr><td>Items unclaimed 90+ days</td><td style="color:#f87171">${unclaimedAge.over90days ?? 0}</td></tr>
        <tr><td>Average age of unclaimed items</td><td style="font-weight:700">${unclaimedAge.avgAgeDays ?? 0} days</td></tr>
      </tbody>
    </table>
    ${unclaimedAge.oldest?.length > 0 ? `
    <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Oldest Unclaimed Items</p>
    <table>
      <thead><tr><th>Item</th><th>Location</th><th>Days Unclaimed</th></tr></thead>
      <tbody>
        ${unclaimedAge.oldest.map((item: any) => `<tr>
          <td>${item.name}</td><td>${item.location}</td>
          <td style="color:${item.days >= 90 ? "#f87171" : item.days >= 30 ? "#fb923c" : "#facc15"};font-weight:700">${item.days}d</td>
        </tr>`).join("")}
      </tbody>
    </table>` : ""}

    <!-- Top Reporters -->
    ${sectionHdr("Top Reporters")}
    ${topReporters.length === 0 ? "<p style='color:#64748b;font-size:12px'>No data yet</p>" : `
    <table>
      <thead><tr><th>Rank</th><th>Name</th><th>Items Reported</th></tr></thead>
      <tbody>
        ${topReporters.map((r: any, i: number) => `<tr>
          <td>${i + 1}</td>
          <td>${r.name}</td>
          <td style="font-weight:700;color:#22d3ee">${r.count}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}

  </body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
};

// ── Reusable button component ─────────────────────────────────────────────────
interface ExportButtonProps {
  label?: string;
  getRows: () => Record<string, any>[];
  filename: string;
  pdfTitle?: string;
}

const ExportButton = ({ label = "Export", getRows, filename, pdfTitle }: ExportButtonProps) => {
  const [open, setOpen] = useState(false);

  const handleCSV = () => {
    exportCSV(filename, getRows());
    setOpen(false);
  };

  const handlePDF = () => {
    exportPDF(pdfTitle ?? label, getRows());
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-white/5 hover:border-white/10 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition-all duration-200"
      >
        <FaDownload size={10} />
        {label}
        <FaChevronDown size={8} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-36 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
            <button onClick={handleCSV}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors text-xs">
              <FaFileCsv size={12} className="text-emerald-400" /> Export CSV
            </button>
            <button onClick={handlePDF}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors text-xs border-t border-gray-800">
              <FaFilePdf size={12} className="text-red-400" /> Export PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
