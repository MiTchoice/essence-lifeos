import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function KPICard({ icon:Icon, label, value, sub, color, trend, trendLabel }) {
  return (
    <motion.div whileHover={{ y:-2 }} transition={{ duration:0.15 }}
      className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color:"var(--text-muted)" }}>
          {label}
        </p>
        <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums" style={{ color:"var(--text-primary)" }}>{value}</p>
      {(sub || trend !== undefined) && (
        <div className="flex items-center gap-2 mt-1.5">
          {trend !== undefined && (
            <span className={`flex items-center gap-0.5 text-[11px] font-bold ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
              {Math.abs(trend)}%
            </span>
          )}
          {sub && <p className="text-[11px]" style={{ color:"var(--text-muted)" }}>{sub}</p>}
          {trendLabel && <p className="text-[11px]" style={{ color:"var(--text-muted)" }}>{trendLabel}</p>}
        </div>
      )}
    </motion.div>
  );
}
