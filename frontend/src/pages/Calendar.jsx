import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, X, CalendarDays, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from "date-fns";
import { calendarApi } from "../api";
import useStore from "../store/useStore";

const PALETTE = ["#6366f1","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899"];

function EventModal({ onClose, onSave, prefillDate }) {
  const [f, setF] = useState({
    title:"", description:"", color:"#6366f1",
    startDate: prefillDate ? format(prefillDate,"yyyy-MM-dd'T'HH:mm") : "",
    endDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) { setErr("Title is required"); return; }
    if (!f.startDate)    { setErr("Start date is required"); return; }
    setSaving(true);
    try {
      await onSave({ ...f, startDate:new Date(f.startDate).toISOString(), endDate:new Date(f.endDate||f.startDate).toISOString() });
    } catch { setErr("Failed to save. Try again."); }
    finally  { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background:"rgba(0,0,0,0.65)", backdropFilter:"blur(8px)" }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <motion.div initial={{ scale:0.92,opacity:0,y:20 }} animate={{ scale:1,opacity:1,y:0 }}
        exit={{ scale:0.92,opacity:0,y:20 }} transition={{ type:"spring",stiffness:400,damping:30 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", boxShadow:"0 24px 64px rgba(0,0,0,0.5)" }}>

        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom:"1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background:"rgba(6,182,212,0.12)", border:"1px solid rgba(6,182,212,0.3)" }}>
              <CalendarDays className="w-4 h-4 text-cyan-400"/>
            </div>
            <p className="font-bold" style={{ color:"var(--text-primary)" }}>New Calendar Event</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4"/></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {err && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", color:"#fca5a5" }}>{err}</div>
          )}
          <div>
            <label className="label">Event Title *</label>
            <input className="input" placeholder="Meeting, deadline, reminder…" autoFocus
              value={f.title} onChange={e=>setF({...f,title:e.target.value})}/>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} placeholder="Optional notes…"
              value={f.description} onChange={e=>setF({...f,description:e.target.value})}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start *</label>
              <input type="datetime-local" className="input"
                value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})}/>
            </div>
            <div>
              <label className="label">End</label>
              <input type="datetime-local" className="input"
                value={f.endDate} onChange={e=>setF({...f,endDate:e.target.value})}/>
            </div>
          </div>
          <div>
            <label className="label">Colour</label>
            <div className="flex gap-2.5 mt-1">
              {PALETTE.map(c=>(
                <button key={c} type="button" onClick={()=>setF({...f,color:c})}
                  className="w-7 h-7 rounded-full transition-all duration-150 hover:scale-110"
                  style={{
                    backgroundColor:c,
                    transform: f.color===c ? "scale(1.25)" : undefined,
                    boxShadow: f.color===c ? `0 0 12px ${c}80, 0 0 0 2px white, 0 0 0 3px ${c}` : "none",
                  }}/>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : "Create Event"}
            </button>
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Calendar() {
  const { addToast } = useStore();
  const [events,   setEvents]   = useState([]);
  const [curr,     setCurr]     = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [prefill,  setPrefill]  = useState(null);
  const [selected, setSelected] = useState(null);
  const [syncing,  setSyncing]  = useState(false);

  const load = useCallback(() => {
    calendarApi.getAll().then(r=>setEvents(r.data)).catch(()=>{});
  }, []);

  useEffect(() => { load(); }, [load]);

  const days     = eachDayOfInterval({ start:startOfWeek(startOfMonth(curr)), end:endOfWeek(endOfMonth(curr)) });
  const forDay   = d => events.filter(e=>isSameDay(new Date(e.startDate),d));
  const selEvs   = selected ? forDay(selected) : [];
  const monthEvs = events.filter(e=>isSameMonth(new Date(e.startDate),curr));

  const handleSave = async (data) => {
    await calendarApi.create(data);
    setShowForm(false); setPrefill(null);
    addToast("Event created! 📅"); load();
  };
  const handleDelete = async (id) => {
    await calendarApi.remove(id); addToast("Event deleted","error"); load(); setSelected(null);
  };
  const handleSync = async () => {
    setSyncing(true);
    try { const r = await calendarApi.syncTasks(); addToast(`Synced ${r.synced} tasks`); load(); }
    catch { addToast("Sync failed","error"); }
    finally { setSyncing(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="text-sm mt-0.5" style={{ color:"var(--text-muted)" }}>
            {monthEvs.length} events in {format(curr,"MMMM yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSync} disabled={syncing} className="btn-outline">
            <RefreshCw className={`w-4 h-4 ${syncing?"animate-spin":""}`}/> Sync Tasks
          </button>
          <button onClick={()=>{ setPrefill(null); setShowForm(true); }} className="btn-primary">
            <Plus className="w-4 h-4"/> Add Event
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={()=>setCurr(subMonths(curr,1))} className="btn-ghost p-2 rounded-xl"><ChevronLeft className="w-4 h-4"/></button>
        <button onClick={()=>setCurr(new Date())} className="btn-outline px-4 py-2 text-sm">Today</button>
        <button onClick={()=>setCurr(addMonths(curr,1))} className="btn-ghost p-2 rounded-xl"><ChevronRight className="w-4 h-4"/></button>
        <span className="font-bold ml-2" style={{ color:"var(--text-primary)" }}>{format(curr,"MMMM yyyy")}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Grid */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="grid grid-cols-7" style={{ borderBottom:"1px solid var(--border)" }}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
              <div key={d} className="py-3 text-center text-xs font-bold uppercase tracking-widest"
                style={{ color:"var(--text-muted)" }}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day,i)=>{
              const evs     = forDay(day);
              const today   = isToday(day);
              const inMonth = isSameMonth(day,curr);
              const isSel   = selected && isSameDay(day,selected);
              return (
                <div key={i}
                  onClick={()=>setSelected(isSel?null:day)}
                  onDoubleClick={()=>{ setPrefill(day); setShowForm(true); }}
                  className="min-h-[88px] p-1.5 cursor-pointer transition-colors relative group"
                  style={{
                    borderBottom:"1px solid var(--border)",
                    borderRight:"1px solid var(--border)",
                    background: isSel ? "rgba(99,102,241,0.08)" : inMonth ? "transparent" : "rgba(0,0,0,0.06)",
                    outline: isSel ? "1px solid rgba(99,102,241,0.3)" : "none",
                    outlineOffset:"-1px",
                  }}
                  onMouseEnter={e=>{ if(!isSel) e.currentTarget.style.background="var(--bg-elevated)"; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background=isSel?"rgba(99,102,241,0.08)":inMonth?"transparent":"rgba(0,0,0,0.06)"; }}>

                  <button
                    onClick={e=>{ e.stopPropagation(); setPrefill(day); setShowForm(true); }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background:"rgba(99,102,241,0.2)", color:"#818cf8" }}>+</button>

                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold mb-1`}
                    style={today
                      ? { background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", boxShadow:"0 0 12px rgba(99,102,241,0.5)" }
                      : { color: inMonth ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {format(day,"d")}
                  </div>

                  <div className="space-y-0.5">
                    {evs.slice(0,3).map(ev=>(
                      <div key={ev._id} className="text-[10px] px-1.5 py-0.5 rounded-md truncate font-semibold text-white leading-tight"
                        style={{ backgroundColor:ev.color||"#6366f1" }}>
                        {ev.title}
                      </div>
                    ))}
                    {evs.length>3 && <div className="text-[10px] pl-1" style={{ color:"var(--text-muted)" }}>+{evs.length-3}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-center py-2" style={{ color:"var(--text-muted)" }}>
            Double-click any day to add an event
          </p>
        </div>

        {/* Side panel */}
        <div className="card p-5 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-4 h-4 text-cyan-400"/>
              <p className="section-title">
                {selected ? format(selected,"MMM d, yyyy") : "Click a day"}
              </p>
            </div>

            {!selected ? (
              <p className="text-sm text-center py-6" style={{ color:"var(--text-muted)" }}>
                Select a day to view or add events
              </p>
            ) : selEvs.length===0 ? (
              <div className="text-center py-6">
                <p className="text-sm mb-3" style={{ color:"var(--text-muted)" }}>No events this day</p>
                <button onClick={()=>{ setPrefill(selected); setShowForm(true); }} className="btn-primary text-xs py-1.5 mx-auto">
                  <Plus className="w-3.5 h-3.5"/> Add Event
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {selEvs.map(ev=>(
                    <motion.div key={ev._id} initial={{ opacity:0,x:12 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-12 }}
                      className="rounded-xl p-3 group"
                      style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)" }}>
                      <div className="flex items-start gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor:ev.color, boxShadow:`0 0 8px ${ev.color}60` }}/>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold leading-tight" style={{ color:"var(--text-primary)" }}>{ev.title}</p>
                          {ev.description && <p className="text-xs mt-0.5" style={{ color:"var(--text-muted)" }}>{ev.description}</p>}
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" style={{ color:"var(--text-muted)" }}/>
                            <p className="text-[11px]" style={{ color:"var(--text-muted)" }}>{format(new Date(ev.startDate),"h:mm a")}</p>
                          </div>
                        </div>
                        <button onClick={()=>handleDelete(ev._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300">
                          <X className="w-3.5 h-3.5"/>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="pt-4 flex-1" style={{ borderTop:"1px solid var(--border)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color:"var(--text-muted)" }}>
              All Events — {format(curr,"MMM yyyy")} ({monthEvs.length})
            </p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {monthEvs.length===0 ? (
                <p className="text-xs text-center py-4" style={{ color:"var(--text-muted)" }}>No events this month</p>
              ) : monthEvs.map(ev=>(
                <div key={ev._id} className="flex items-center gap-2 px-1 py-1.5 rounded-lg cursor-pointer group transition-colors"
                  onClick={()=>setSelected(new Date(ev.startDate))}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--bg-elevated)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor:ev.color }}/>
                  <span className="flex-1 truncate text-xs" style={{ color:"var(--text-secondary)" }}>{ev.title}</span>
                  <span className="text-[10px]" style={{ color:"var(--text-muted)" }}>{format(new Date(ev.startDate),"MMM d")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <EventModal
            onClose={()=>{ setShowForm(false); setPrefill(null); }}
            onSave={handleSave}
            prefillDate={prefill}/>
        )}
      </AnimatePresence>
    </div>
  );
}
