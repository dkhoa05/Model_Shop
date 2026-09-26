import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { api } from "../../services/api.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

const PERIODS = [
  { id: "day", label: "Ngày" },
  { id: "week", label: "Tuần" },
  { id: "month", label: "Tháng" },
  { id: "year", label: "Năm" }
];

export default function AdminReportsPage() {
  const { theme } = useTheme();
  const [period, setPeriod] = useState("day");
  const [status, setStatus] = useState("delivered");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [error, setError] = useState("");

  const cardClass =
    theme === "dark"
      ? "rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5"
      : "rounded-2xl border border-rose-200 bg-white p-4 sm:p-5 shadow-sm";

  const inputClass =
    theme === "dark"
      ? "px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm focus:outline-none focus:border-cyan-400"
      : "px-3 py-2 rounded-xl bg-white border border-rose-200 text-slate-900 text-sm focus:outline-none focus:border-rose-400 shadow-sm";

  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      const [rev, profit] = await Promise.all([
        api.get("/admin/reports/revenue", {
          params: {
            period,
            status,
            ...(from ? { from } : {}),
            ...(to ? { to } : {})
          }
        }),
        api.get("/admin/reports/profit", {
          params: {
            period,
            status,
            ...(from ? { from } : {}),
            ...(to ? { to } : {})
          }
        })
      ]);
      setData(rev.data);
      setProfitData(profit.data);
    } catch (e) {
      console.error(e);
      setData(null);
      setProfitData(null);
      setError(e.response?.data?.message || "Không tải được báo cáo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, status]);

  /** Một nguồn cho biểu đồ thu–chi–LN: tránh lệch chỉ số giữa API revenue và profit */
  const comboSeries = useMemo(() => profitData?.series || [], [profitData]);
  const labels = useMemo(() => comboSeries.map((x) => x.label), [comboSeries]);
  const revenueSeries = useMemo(() => comboSeries.map((x) => Number(x.revenue) || 0), [comboSeries]);
  const expenseSeries = useMemo(() => comboSeries.map((x) => Number(x.expense) || 0), [comboSeries]);
  const profitSeries = useMemo(
    () => revenueSeries.map((rev, i) => rev - (expenseSeries[i] || 0)),
    [revenueSeries, expenseSeries]
  );
  const ordersSeries = useMemo(() => comboSeries.map((x) => Number(x.orders) || 0), [comboSeries]);

  const chartText = theme === "dark" ? "#e2e8f0" : "#0f172a";
  const grid = theme === "dark" ? "rgba(148,163,184,0.15)" : "rgba(15,23,42,0.08)";

  const commonOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: chartText } },
      tooltip: { enabled: true }
    },
    scales: {
      x: { ticks: { color: chartText }, grid: { color: grid } },
      y: { ticks: { color: chartText }, grid: { color: grid } }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Báo cáo doanh thu
        </h1>
        <button
          onClick={fetchReport}
          className={
            "px-3 py-2 rounded-xl text-xs font-semibold border transition " +
            (theme === "dark"
              ? "border-slate-700 text-slate-200 hover:border-cyan-400"
              : "border-rose-300 text-slate-700 hover:border-rose-500")
          }
        >
          Tải lại
        </button>
      </div>

      <div className={cardClass + " space-y-3"}>
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Theo</p>
            <select className={inputClass + " w-full"} value={period} onChange={(e) => setPeriod(e.target.value)}>
              {PERIODS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Trạng thái đơn</p>
            <select className={inputClass + " w-full"} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="delivered">Đã giao</option>
              <option value="processing">Đang xử lý</option>
              <option value="pending">Chờ xử lý</option>
              <option value="shipped">Đang giao</option>
              <option value="cancelled">Đã hủy</option>
              <option value="all">Tất cả</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Từ ngày</p>
            <input className={inputClass + " w-full"} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Đến ngày</p>
            <input className={inputClass + " w-full"} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={fetchReport}
            className={
              "px-4 py-2 rounded-xl text-sm font-semibold transition " +
              (theme === "dark" ? "bg-cyan-600 text-on-accent hover:bg-cyan-500" : "bg-rose-600 text-on-accent hover:bg-rose-700")
            }
          >
            Áp dụng
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm rounded-xl px-3 py-2 border border-amber-500/30 bg-amber-500/10 text-amber-200">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-300">Đang tải báo cáo...</p>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className={cardClass + " lg:col-span-1"}>
            <p className="text-xs text-slate-500 dark:text-slate-400">Tổng thu (doanh thu)</p>
            <p className="text-2xl font-semibold text-rose-600 dark:text-cyan-400 mt-1">
              {(profitData?.totals?.revenue ?? data?.totals?.revenue ?? 0).toLocaleString("vi-VN")} ₫
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Tổng chi</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
              {(profitData?.totals?.expense ?? 0).toLocaleString("vi-VN")} ₫
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Lợi nhuận (Thu − Chi)</p>
            <p className={"text-lg font-semibold mt-1 " + ((profitData?.totals?.profit || 0) >= 0 ? "text-emerald-400" : "text-red-300")}>
              {(profitData?.totals?.profit || 0).toLocaleString("vi-VN")} ₫
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Tổng số đơn:{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {profitData?.totals?.orders ?? data?.totals?.orders ?? 0}
              </span>
            </p>
          </div>

          <div className={cardClass + " lg:col-span-2"}>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
              Thu–Chi–Lợi nhuận theo {PERIODS.find((p) => p.id === period)?.label?.toLowerCase()}
            </p>
            {labels.length ? (
              <Line
                options={commonOptions}
                data={{
                  labels,
                  datasets: [
                    {
                      label: "Doanh thu (₫)",
                      data: revenueSeries,
                      borderColor: theme === "dark" ? "#22d3ee" : "#e11d48",
                      backgroundColor: theme === "dark" ? "rgba(34,211,238,0.2)" : "rgba(225,29,72,0.15)",
                      tension: 0.25
                    },
                    {
                      label: "Chi (₫)",
                      data: expenseSeries,
                      borderColor: theme === "dark" ? "#94a3b8" : "#334155",
                      backgroundColor: theme === "dark" ? "rgba(148,163,184,0.12)" : "rgba(51,65,85,0.10)",
                      tension: 0.25
                    },
                    {
                      label: "Lợi nhuận (₫)",
                      data: profitSeries,
                      borderColor: theme === "dark" ? "#34d399" : "#16a34a",
                      backgroundColor: theme === "dark" ? "rgba(52,211,153,0.12)" : "rgba(22,163,74,0.10)",
                      tension: 0.25
                    }
                  ]
                }}
              />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Không có dữ liệu trong khoảng này.</p>
            )}
          </div>

          <div className={cardClass + " lg:col-span-3"}>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
              Số đơn theo kỳ
            </p>
            {labels.length ? (
              <Bar
                options={commonOptions}
                data={{
                  labels,
                  datasets: [
                    {
                      label: "Số đơn",
                      data: ordersSeries,
                      backgroundColor: theme === "dark" ? "rgba(148,163,184,0.35)" : "rgba(15,23,42,0.18)",
                      borderColor: theme === "dark" ? "rgba(148,163,184,0.6)" : "rgba(15,23,42,0.3)",
                      borderWidth: 1
                    }
                  ]
                }}
              />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Không có dữ liệu trong khoảng này.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

