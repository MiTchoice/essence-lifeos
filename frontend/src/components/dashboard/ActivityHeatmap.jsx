import React from "react";

export default function ActivityHeatmap({ data = [] }) {
  return (
    <div>
      <div className="flex flex-wrap gap-[3px]">
        {data.map((day, i) => {
          const cls = ["heat-0","heat-1","heat-2","heat-3","heat-4"][Math.min(day.count,4)];
          return <div key={i} title={`${day.date}: ${day.count * 30} productive mins`}
            className={`w-[11px] h-[11px] rounded-[2px] cursor-default transition-opacity hover:opacity-70 ${cls}`}/>;
        })}
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[11px]" style={{ color:"var(--text-muted)" }}>Less</span>
        {["heat-0","heat-1","heat-2","heat-3","heat-4"].map((c,i) => (
          <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${c}`}/>
        ))}
        <span className="text-[11px]" style={{ color:"var(--text-muted)" }}>More</span>
      </div>
    </div>
  );
}
