const Task          = require("../models/Task");
const TimeEntry     = require("../models/TimeEntry");
const Expense       = require("../models/Expense");
const CalendarEvent = require("../models/CalendarEvent");

/* ── Helpers ── */
const fmtM    = m => m >= 60 ? `${Math.floor(m/60)}h${m%60>0?" "+m%60+"m":""}` : `${m||0}m`;
const todayStr= () => new Date().toISOString().split("T")[0];
const lastN   = n  => Array.from({length:n},(_,i)=>{
  const d=new Date(Date.now()-(i+1)*86400000); return d.toISOString().split("T")[0];
});
const fmtDate = d  => { try { return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short"}); } catch { return "?"; } };

/* ── Safe DB query wrapper ── */
async function safeFind(Model, query, opts={}) {
  try {
    let q = Model.find(query);
    if (opts.sort)  q = q.sort(opts.sort);
    if (opts.limit) q = q.limit(opts.limit);
    return await q;
  } catch { return []; }
}

/* ── Load all user context safely ── */
async function getCtx(uid) {
  const tod   = todayStr();
  const last7 = lastN(7);
  const last30= lastN(30);

  // Run all queries in parallel, each individually safe
  const [allTasks, time7, expenses30, todayTime, todayExp, upcomingEvents] = await Promise.all([
    safeFind(Task, { userId:uid }, { sort:{ order:1 } }),
    safeFind(TimeEntry, { userId:uid, date:{ $in:last7 } }),
    safeFind(Expense, { userId:uid, date:{ $in:[...last30, tod] } }),
    safeFind(TimeEntry, { userId:uid, date:tod }),
    safeFind(Expense, { userId:uid, date:tod }),
    safeFind(CalendarEvent, { userId:uid, startDate:{ $gte:new Date() } }, { sort:{ startDate:1 }, limit:5 }),
  ]);

  // Task breakdowns
  const incomplete = allTasks.filter(t=>t.status==="incomplete");
  const completed  = allTasks.filter(t=>t.status==="completed");
  const suspended  = allTasks.filter(t=>t.status==="suspended");
  const urgent     = incomplete.filter(t=>t.priority==="urgent");
  const high       = incomplete.filter(t=>t.priority==="high");
  const overdue    = incomplete.filter(t=>t.dueDate && new Date(t.dueDate)<new Date());
  const dueToday   = incomplete.filter(t=>t.dueDate && t.dueDate.toString().startsWith(tod));
  const compRate   = allTasks.length>0 ? Math.round(completed.length/allTasks.length*100) : 0;

  // Time today
  const todayProd   = todayTime.filter(e=>e.category==="productive").reduce((s,e)=>s+e.durationMinutes,0);
  const todayUnprod = todayTime.filter(e=>e.category==="unproductive").reduce((s,e)=>s+e.durationMinutes,0);
  const todayTotal  = todayTime.reduce((s,e)=>s+e.durationMinutes,0);

  // Time 7-day averages
  const avgProd   = Math.round(time7.filter(e=>e.category==="productive").reduce((s,e)=>s+e.durationMinutes,0)/7);
  const avgUnprod = Math.round(time7.filter(e=>e.category==="unproductive").reduce((s,e)=>s+e.durationMinutes,0)/7);
  const prodRate  = (avgProd+avgUnprod)>0 ? Math.round(avgProd/(avgProd+avgUnprod)*100) : 0;

  // Best/worst tracked day this week
  const byDay = {};
  time7.forEach(e=>{
    if(!byDay[e.date]) byDay[e.date]={prod:0,unprod:0};
    if(e.category==="productive")   byDay[e.date].prod   += e.durationMinutes;
    if(e.category==="unproductive") byDay[e.date].unprod += e.durationMinutes;
  });
  const dayArr  = Object.entries(byDay).sort((a,b)=>b[1].prod-a[1].prod);
  const bestDay = dayArr[0] || null;

  // Finance
  const todaySpend  = todayExp.reduce((s,e)=>s+e.amount,0);
  const last7Exp    = expenses30.filter(e=>last7.includes(e.date));
  const avg7Spend   = Math.round(last7Exp.reduce((s,e)=>s+e.amount,0)/7);
  const total30Spend= expenses30.reduce((s,e)=>s+e.amount,0);
  const byCat7      = {};
  last7Exp.forEach(e=>{ byCat7[e.category]=(byCat7[e.category]||0)+e.amount; });
  const topCat = Object.entries(byCat7).sort((a,b)=>b[1]-a[1]);

  return {
    allTasks, incomplete, completed, suspended, urgent, high, overdue, dueToday,
    compRate,
    todayProd, todayUnprod, todayTotal, avgProd, avgUnprod, prodRate, bestDay,
    todaySpend, avg7Spend, total30Spend, topCat, byCat7,
    upcomingEvents,
  };
}

/* ══════════════════════════════════════════════════
   SUGGESTIONS
══════════════════════════════════════════════════ */
exports.getProductivitySuggestions = async (req, res) => {
  try {
    const c = await getCtx(req.user._id);
    const s = [], h = [];

    if (c.urgent.length>0)
      s.push(`🔥 ${c.urgent.length} URGENT task${c.urgent.length>1?"s":""}: "${c.urgent[0].title}" — do this first, everything else waits.`);
    if (c.overdue.length>0)
      s.push(`⚠️ ${c.overdue.length} overdue task${c.overdue.length>1?"s":""}: "${c.overdue[0].title}". Complete or postpone using the ↓ button.`);
    if (c.todayProd===0 && c.incomplete.length>0)
      s.push(`🌅 ${c.incomplete.length} tasks waiting but 0 minutes tracked today. Start a 25-min timer on your easiest task.`);
    else if (c.todayProd>0)
      s.push(`✅ ${fmtM(c.todayProd)} productive today (7-day avg: ${fmtM(c.avgProd)}). ${c.todayProd>=c.avgProd?"Ahead of pace 🚀":"Keep going — "+Math.round(c.todayProd/Math.max(1,c.avgProd)*100)+"% of daily average."}`);
    if (c.prodRate>0 && c.prodRate<50)
      s.push(`📊 Productivity rate: ${c.prodRate}% — more unproductive than productive time. Use 25-min focus blocks with distractions blocked.`);
    else if (c.prodRate>=70)
      s.push(`📊 ${c.prodRate}% productivity rate — excellent. Protect your deep work windows from interruptions.`);
    if (c.dueToday.length>0)
      s.push(`📅 ${c.dueToday.length} task${c.dueToday.length>1?"s":""} due TODAY: ${c.dueToday.slice(0,2).map(t=>`"${t.title}"`).join(", ")}.`);
    if (c.incomplete.length>8)
      s.push(`📋 ${c.incomplete.length} pending tasks. Use AI Shuffle → focus only on top 3 per day.`);
    if (s.length===0)
      s.push(`✨ Everything looks good! Keep tracking your time and tasks to get more personalised insights.`);

    if (c.avgUnprod>60) h.push(`You average ${fmtM(c.avgUnprod)}/day unproductive. Time-box distractions to one scheduled slot.`);
    if (c.overdue.length>2) h.push(`${c.overdue.length} overdue tasks → you may be over-committing. Start each week by clearing or rescheduling old tasks.`);
    h.push("Morning rule: write your top 3 tasks before opening any app.");
    h.push("Evening rule: 5-min review — what shipped, what moves tomorrow.");

    res.json({ success:true, data:{
      suggestions: s.slice(0,5),
      habits:      h.slice(0,3),
      source:      "live-analysis",
      meta:{ compRate:`${c.compRate}%`, prodRate:`${c.prodRate}%`, todayProd:fmtM(c.todayProd), avgProd:fmtM(c.avgProd) }
    }});
  } catch(err) {
    console.error("Suggestions error:", err);
    res.status(500).json({ error: "Failed to load suggestions: " + err.message });
  }
};

/* ══════════════════════════════════════════════════
   PREDICTIONS
══════════════════════════════════════════════════ */
exports.getPredictions = async (req, res) => {
  try {
    const c = await getCtx(req.user._id);
    const { avgProd, avgUnprod, todayProd, avg7Spend, topCat, prodRate, incomplete } = c;

    const trend     = todayProd > avgProd ? 1.08 : 0.97;
    const predProd  = Math.max(0, Math.round(avgProd*trend));
    const predUnprod= Math.max(0, Math.round(avgUnprod*0.95));
    const predSpend = Math.max(0, Math.round(avg7Spend*1.02));
    const ins       = [];

    if (avgProd>0)
      ins.push(`⏱️ Forecast: ~${fmtM(predProd)} productive tomorrow (7-day avg ${fmtM(avgProd)}/day, trend ${todayProd>avgProd?"📈 improving":"📊 consistent"}).`);
    else
      ins.push(`⏱️ No time tracking data yet. Start using the timer to unlock productivity forecasts.`);

    if (avg7Spend>0)
      ins.push(`💸 Predicted spend: ₹${predSpend} tomorrow (avg ₹${avg7Spend}/day).${topCat[0]?" Top category: "+topCat[0][0]+" (₹"+Math.round(topCat[0][1]/7)+"/day).":""}`);
    else
      ins.push(`💸 No expense data yet. Log expenses to unlock spending forecasts.`);

    if (prodRate>0 && incomplete.length>0)
      ins.push(`📋 At ${prodRate}% efficiency, completing ~${Math.max(1,Math.round(incomplete.length*0.14))} tasks/day. Clear your ${incomplete.length}-task backlog in ~${Math.ceil(incomplete.length/Math.max(1,Math.round(incomplete.length*0.14)))} days.`);

    ins.push(`💡 Peak focus tip: schedule your hardest task 1–3 hours after waking — that's when most people hit peak cognition.`);

    res.json({ success:true, data:{
      predictedTimeUsage:{ productive:predProd, unproductive:predUnprod },
      predictedSpending: predSpend,
      insights:          ins,
      source:            "pattern-analysis"
    }});
  } catch(err) {
    console.error("Predictions error:", err);
    res.status(500).json({ error: "Failed to load predictions: " + err.message });
  }
};

/* ══════════════════════════════════════════════════
   CHAT — 6 distinct intents + safe fallback
══════════════════════════════════════════════════ */
exports.askAssistant = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.json({ success:true, data:{ answer:"Please ask me a question!" } });

    const raw = question.trim();
    const q   = raw.toLowerCase();
    const c   = await getCtx(req.user._id);
    const {
      incomplete, completed, suspended, urgent, high, overdue, dueToday, allTasks,
      todayProd, todayUnprod, todayTotal, avgProd, avgUnprod, prodRate, bestDay,
      todaySpend, avg7Spend, total30Spend, topCat, byCat7,
      compRate, upcomingEvents,
    } = c;

    let answer = "";

    /* ── 1. TASKS ── */
    if (q.match(/\b(task|todo|to-do|work on|focus|next|priorit|urgent|pending|backlog|what should|do today|do next|working on)\b/)) {
      const L = [
        `📋 **Task Dashboard — ${new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"short"})}**\n`,
        `• All tasks: **${allTasks.length}** total  |  ✅ Done: ${completed.length}  |  ⏸ Paused: ${suspended.length}`,
        `• Pending: **${incomplete.length}**  |  🔥 Urgent: ${urgent.length}  |  🟠 High: ${high.length}  |  ⚠️ Overdue: ${overdue.length}`,
      ];
      if (dueToday.length>0) L.push(`• 📅 Due today: ${dueToday.map(t=>`"${t.title}"`).join(", ")}`);
      L.push("");
      if (incomplete.length===0) {
        L.push("🎉 **All caught up!** No pending tasks. Go add something new.");
      } else {
        const order = { urgent:0, high:1, medium:2, low:3 };
        const top5  = [...incomplete].sort((a,b)=>(order[a.priority]||3)-(order[b.priority]||3)).slice(0,5);
        L.push(`**Top ${top5.length} to work on right now:**`);
        top5.forEach((t,i) => {
          const due = t.dueDate ? ` (due ${fmtDate(t.dueDate)})` : "";
          const over= t.dueDate && new Date(t.dueDate)<new Date() ? " ⚠️ OVERDUE" : "";
          L.push(`${i+1}. "${t.title}" — ${t.priority}${due}${over}`);
        });
        if (incomplete.length>5) L.push(`\n…and ${incomplete.length-5} more. Use **AI Shuffle** on the Tasks page to auto-rank by urgency + deadline.`);
      }
      answer = L.join("\n");
    }

    /* ── 2. PRODUCTIVITY / TIME ── */
    else if (q.match(/\b(productiv|time|track|minutes|hours|efficient|pomodoro|focus.*today|how much.*work|wasted|deep work)\b/)) {
      const L = [
        `⏱️ **Time & Productivity Report**\n`,
        `**Today (${new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}):**`,
        `• Productive: **${fmtM(todayProd)}**  ${todayProd>avgProd?"🚀 above 7-day avg":todayProd===0?"(not started yet)":""}`,
        `• Unproductive: ${fmtM(todayUnprod)}  |  Total tracked: ${fmtM(todayTotal)}`,
      ];
      L.push(`\n**7-Day Averages:**`);
      L.push(`• Productive/day: ${fmtM(avgProd)}  |  Unproductive/day: ${fmtM(avgUnprod)}`);
      L.push(`• Efficiency rate: **${prodRate}%** ${prodRate>=70?"✅ Excellent":prodRate>=50?"👍 Good":prodRate>0?"⚠️ Needs work":"(no data yet)"}`);
      if (bestDay) L.push(`• Best day this week: ${fmtDate(bestDay[0])} with ${fmtM(bestDay[1].prod)} productive`);
      L.push("");
      if (todayTotal===0) L.push(`⚡ **Zero time tracked today.** Open Time Tracking → type your task → click Start. 25 minutes is all it takes to start.`);
      else if (prodRate<50 && (avgProd+avgUnprod)>0) L.push(`📉 Under 50% efficiency. Try: strict 25-min work blocks, one task at a time, no phone nearby.`);
      else if (todayProd>=avgProd) L.push(`💪 You're **beating your daily average** today! ${fmtM(todayProd)} vs ${fmtM(avgProd)} avg. Keep it going.`);
      else L.push(`📊 At ${Math.round(todayProd/Math.max(1,avgProd)*100)}% of your daily average. Push for ${fmtM(avgProd-todayProd)} more to match.`);
      answer = L.join("\n");
    }

    /* ── 3. SPENDING / FINANCE ── */
    else if (q.match(/\b(spend|money|finance|expense|budget|cost|rupee|₹|purchase|buy|bought|transaction|how much.*spent|cash|payment)\b/)) {
      const L = [
        `💰 **Finance & Spending Analysis**\n`,
        `**Today:** ₹${todaySpend.toFixed(0)} across ${c.allTasks.length>0?c.upcomingEvents.length:0} entries`,
        `**7-day average:** ₹${avg7Spend}/day`,
        `**30-day total:** ₹${total30Spend.toFixed(0)}`,
      ];
      if (topCat.length>0) {
        L.push(`\n**Spending by category (last 7 days):**`);
        topCat.slice(0,5).forEach(([cat,amt])=>{
          const pct = Math.round(amt/Math.max(1,last7Exp(c))*100);
          L.push(`• ${cat.charAt(0).toUpperCase()+cat.slice(1)}: ₹${Math.round(amt)}  (₹${Math.round(amt/7)}/day avg)`);
        });
      }
      L.push("");
      if (todaySpend===0) L.push(`✅ No expenses logged today. If you've spent money, add it on the Finance page to track your patterns.`);
      else if (todaySpend > avg7Spend*1.4) L.push(`⚠️ **Overspending alert**: ₹${todaySpend.toFixed(0)} today is ${Math.round((todaySpend/Math.max(1,avg7Spend)-1)*100)}% above your daily average. Review what drove this.`);
      else if (todaySpend <= avg7Spend*0.5) L.push(`🎯 Great spending discipline! Only ${Math.round(todaySpend/Math.max(1,avg7Spend)*100)}% of your daily average.`);
      else L.push(`✅ Today's spending is within your normal range.`);
      answer = L.join("\n");
    }

    /* ── 4. FULL OVERVIEW ── */
    else if (q.match(/\b(overview|summary|dashboard|overall|report|performance|all in one|how am i|doing|full|complete|everything)\b/)) {
      const score = Math.min(100, Math.round((compRate*0.35)+(prodRate*0.35)+(todayProd>0?20:0)+(todaySpend<=avg7Spend?10:0)));
      const grade = score>=80?"🌟 Excellent":score>=65?"💪 Good":score>=45?"📈 Building":score>=25?"⚡ Getting Started":"🆕 Just Joined";
      const L = [
        `📊 **Performance Overview — ${new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}**\n`,
        `**Your Score: ${score}/100 — ${grade}**\n`,
        `**📋 Tasks:**`,
        `• Pending: ${incomplete.length}  |  Done: ${completed.length}  |  Completion rate: ${compRate}%`,
      ];
      if (overdue.length>0)  L.push(`• ⚠️ ${overdue.length} task(s) overdue — need immediate attention`);
      if (urgent.length>0)   L.push(`• 🔥 ${urgent.length} urgent task(s) — drop everything and handle these`);
      L.push(`\n**⏱️ Productivity:**`);
      L.push(`• Today: ${fmtM(todayProd)} productive  |  7-day avg: ${fmtM(avgProd)}/day  |  Rate: ${prodRate}%`);
      L.push(`\n**💰 Finance:**`);
      L.push(`• Today: ₹${todaySpend.toFixed(0)}  |  Daily avg: ₹${avg7Spend}  |  30-day: ₹${total30Spend.toFixed(0)}`);
      if (topCat[0]) L.push(`• Top category: ${topCat[0][0]} (₹${Math.round(topCat[0][1])} last 7 days)`);
      L.push(`\n**🎯 #1 Priority right now:**`);
      if (overdue.length>0) L.push(`Clear ${overdue.length} overdue task(s) — "${overdue[0].title}" is most urgent.`);
      else if (urgent.length>0) L.push(`Handle "${urgent[0].title}" (urgent) before anything else.`);
      else if (todayProd===0) L.push(`Start time tracking — even 25 minutes of tracked work improves focus significantly.`);
      else L.push(`Keep completing tasks. You're at ${compRate}% overall completion — push for 70%+ for a green score.`);
      answer = L.join("\n");
    }

    /* ── 5. TIPS / HABITS ── */
    else if (q.match(/\b(tip|habit|routine|improv|better|advice|suggest|recommend|how to|strategy|help me|trick|insight)\b/)) {
      const L = [
        `🧠 **Personalised Recommendations**\n`,
        `Based on your live data (${incomplete.length} tasks, ${prodRate}% efficiency, ₹${avg7Spend}/day avg):\n`,
      ];
      let n = 1;
      if (urgent.length>0)           L.push(`${n++}. 🔥 **Right now**: Clear "${urgent[0].title}" (urgent). Nothing else matters until this is done.`);
      if (overdue.length>0)          L.push(`${n++}. ⚠️ **Today**: Fix ${overdue.length} overdue task(s) — either complete or use ↓ Postpone to reschedule.`);
      if (dueToday.length>0)         L.push(`${n++}. 📅 **Due today**: "${dueToday[0].title}" must ship before midnight.`);
      if (todayProd===0)             L.push(`${n++}. 🚀 **Start timer**: Zero productive time today. Open Time Tracking → Start → even 15 minutes builds momentum.`);
      else if (prodRate<50&&avgProd>0)L.push(`${n++}. ⏱️ **Efficiency**: ${prodRate}% efficiency. Try Pomodoro: 25-min work → 5-min break → repeat 4x = 2 hours deep work.`);
      if (todaySpend>avg7Spend*1.2)  L.push(`${n++}. 💸 **Spending**: ₹${todaySpend.toFixed(0)} today is above your ₹${avg7Spend} daily average. Log & review.`);
      if (incomplete.length>8)       L.push(`${n++}. 📋 **Backlog**: ${incomplete.length} tasks is overwhelming. Ruthlessly delete or suspend irrelevant ones. Top 3 per day max.`);
      L.push(`${n++}. 🌅 **Morning ritual**: Write 3 tasks before opening any app — 2 minutes that doubles your day's output.`);
      L.push(`${n++}. 🌙 **Evening reset**: 5-min review every night. "What finished? What moves?" Prevents tomorrow's chaos.`);
      if (compRate<50) L.push(`${n++}. 🏆 **Completion**: ${compRate}% rate. Break big tasks into 25-minute chunks — completion feels good and builds habit.`);
      answer = L.join("\n");
    }

    /* ── 6. SCHEDULE / CALENDAR ── */
    else if (q.match(/\b(schedule|calendar|event|meeting|plan|tomorrow|week|deadline|upcoming|due|when|appointment)\b/)) {
      const L = [`📅 **Schedule & Upcoming Deadlines**\n`];

      // Calendar events
      if (upcomingEvents.length>0) {
        L.push(`**📆 Upcoming events:**`);
        upcomingEvents.forEach(e => {
          const d = new Date(e.startDate);
          L.push(`• ${e.title} — ${fmtDate(e.startDate)} at ${d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}`);
        });
        L.push("");
      }

      // Tasks with due dates
      const withDue = incomplete
        .filter(t=>t.dueDate)
        .sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate))
        .slice(0,6);

      if (withDue.length>0) {
        L.push(`**📋 Upcoming task deadlines:**`);
        withDue.forEach(t => {
          const d    = new Date(t.dueDate);
          const days = Math.round((d-new Date())/86400000);
          const tag  = days<0 ? `⚠️ ${Math.abs(days)}d overdue` : days===0 ? "📅 TODAY" : days===1 ? "📅 Tomorrow" : `📅 ${days}d (${fmtDate(t.dueDate)})`;
          L.push(`• "${t.title}" — ${tag}  [${t.priority}]`);
        });
      }

      if (upcomingEvents.length===0 && withDue.length===0) {
        L.push(`Your schedule is clear! Add events on the Calendar page, or set due dates when creating tasks.`);
        L.push(`\n💡 Use **Sync Tasks** on the Calendar page to auto-populate task deadlines into your calendar grid.`);
      }

      answer = L.join("\n");
    }

    /* ── FALLBACK ── */
    else {
      const h = new Date().getHours();
      const g = h<5?"late night":h<12?"morning":h<17?"afternoon":"evening";
      answer = [
        `Good ${g}, ${req.user.name?.split(" ")[0]||"there"}! Here's your live snapshot:\n`,
        `📋 **Tasks:** ${incomplete.length} pending (${urgent.length} urgent, ${overdue.length} overdue) · ${completed.length} done · ${compRate}% rate`,
        `⏱️ **Time:** ${fmtM(todayProd)} today · ${fmtM(avgProd)}/day avg · ${prodRate}% efficiency`,
        `💰 **Finance:** ₹${todaySpend.toFixed(0)} today · ₹${avg7Spend}/day avg · ₹${total30Spend.toFixed(0)} this month`,
        ``,
        `Try asking:`,
        `• "What tasks should I work on?" — smart prioritisation`,
        `• "How productive am I today?" — time analysis`,
        `• "Analyse my spending" — finance breakdown`,
        `• "My full overview" — performance score`,
        `• "Give me tips" — personalised advice`,
        `• "What's on my schedule?" — upcoming deadlines`,
      ].join("\n");
    }

    res.json({ success:true, data:{ answer } });
  } catch(err) {
    console.error("AI ask error:", err);
    res.status(500).json({ error: "AI failed: " + err.message });
  }
};

// Helper used inside spending handler
function last7Exp(c) {
  return c.topCat.reduce((s,[,v])=>s+v, 0) || 1;
}
