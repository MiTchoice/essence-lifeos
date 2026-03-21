const Task = require("../models/Task");
const TimeEntry = require("../models/TimeEntry");
const Expense = require("../models/Expense");

exports.getDashboard = async (req, res) => {
  try {
    const uid   = req.user._id;
    const today = new Date().toISOString().split("T")[0];
    const last30 = Array.from({length:30},(_,i)=>{ const d=new Date(Date.now()-i*86400000); return d.toISOString().split("T")[0]; }).reverse();
    const last90 = Array.from({length:90},(_,i)=>{ const d=new Date(Date.now()-i*86400000); return d.toISOString().split("T")[0]; }).reverse();

    const [tasks, allTime, allExp] = await Promise.all([
      Task.find({ userId:uid }),
      TimeEntry.find({ userId:uid, date:{ $in:last90 } }),
      Expense.find({ userId:uid, date:{ $in:last30 } }),
    ]);

    const todayTime = allTime.filter(e=>e.date===today);
    const todayExp  = allExp.filter(e=>e.date===today);

    const kpis = {
      totalTasks:          tasks.length,
      completedToday:      tasks.filter(t=>t.status==="completed" && t.updatedAt?.toISOString().startsWith(today)).length,
      incompleteTasks:     tasks.filter(t=>t.status==="incomplete").length,
      productiveMinutes:   todayTime.filter(e=>e.category==="productive").reduce((s,e)=>s+e.durationMinutes,0),
      todaySpending:       todayExp.reduce((s,e)=>s+e.amount,0),
      taskCompletionRate:  tasks.length>0 ? Math.round(tasks.filter(t=>t.status==="completed").length/tasks.length*100) : 0,
    };

    const timeChart = last30.map(date=>({
      date: date.slice(5),
      productive:   allTime.filter(e=>e.date===date&&e.category==="productive").reduce((s,e)=>s+e.durationMinutes,0),
      unproductive: allTime.filter(e=>e.date===date&&e.category==="unproductive").reduce((s,e)=>s+e.durationMinutes,0),
    }));

    const expenseChart = last30.map(date=>({
      date:   date.slice(5),
      amount: allExp.filter(e=>e.date===date).reduce((s,e)=>s+e.amount,0),
    }));

    const byCat = allExp.reduce((acc,e)=>{ acc[e.category]=(acc[e.category]||0)+e.amount; return acc; },{});
    const expensePie = Object.entries(byCat).map(([name,value])=>({ name, value:Math.round(value) }));

    const taskStatus = [
      { name:"Completed",  value:tasks.filter(t=>t.status==="completed").length },
      { name:"Incomplete", value:tasks.filter(t=>t.status==="incomplete").length },
      { name:"Suspended",  value:tasks.filter(t=>t.status==="suspended").length },
    ];

    const heatmap = last90.map(date=>({
      date,
      count: Math.min(Math.floor(allTime.filter(e=>e.date===date&&e.category==="productive").reduce((s,e)=>s+e.durationMinutes,0)/25),4),
    }));

    res.json({ success:true, data:{ kpis, timeChart, expenseChart, expensePie, taskStatus, heatmap }});
  } catch (err) { res.status(500).json({ error:err.message }); }
};
