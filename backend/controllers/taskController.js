const Task = require("../models/Task");

exports.getTasks = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    const tasks = await Task.find(filter).sort({ order:1, createdAt:-1 });
    res.json({ success:true, data:tasks });
  } catch (err) { res.status(500).json({ error:err.message }); }
};

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, userId:req.user._id });
    res.status(201).json({ success:true, data:task });
  } catch (err) { res.status(400).json({ error:err.message }); }
};

exports.updateTask = async (req, res) => {
  try {
    let updateData = { ...req.body };
    if (req.body.status === "completed") updateData.completedAt = new Date();
    else if (req.body.status === "incomplete") updateData.completedAt = null;
    const task = await Task.findOneAndUpdate({ _id:req.params.id, userId:req.user._id }, updateData, { new:true });
    if (!task) return res.status(404).json({ error:"Task not found" });
    res.json({ success:true, data:task });
  } catch (err) { res.status(400).json({ error:err.message }); }
};

exports.deleteTask = async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id:req.params.id, userId:req.user._id });
    res.json({ success:true, message:"Deleted" });
  } catch (err) { res.status(500).json({ error:err.message }); }
};

exports.preponeTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id:req.params.id, userId:req.user._id });
    if (!task) return res.status(404).json({ error:"Not found" });
    const d = new Date(task.scheduledDate || new Date());
    d.setDate(d.getDate() - 1);
    task.scheduledDate = d; await task.save();
    res.json({ success:true, data:task });
  } catch (err) { res.status(500).json({ error:err.message }); }
};

exports.postponeTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id:req.params.id, userId:req.user._id });
    if (!task) return res.status(404).json({ error:"Not found" });
    const d = new Date(task.scheduledDate || new Date());
    d.setDate(d.getDate() + 1);
    task.scheduledDate = d; await task.save();
    res.json({ success:true, data:task });
  } catch (err) { res.status(500).json({ error:err.message }); }
};

exports.shuffleTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId:req.user._id, status:"incomplete" });
    const pm = { urgent:4, high:3, medium:2, low:1 };
    tasks.sort((a, b) => {
      let sa = pm[a.priority]||1, sb = pm[b.priority]||1;
      if (a.dueDate) { const dl=(new Date(a.dueDate)-new Date())/86400000; if(dl<1)sa+=5; else if(dl<3)sa+=3; else if(dl<7)sa+=1; }
      if (b.dueDate) { const dl=(new Date(b.dueDate)-new Date())/86400000; if(dl<1)sb+=5; else if(dl<3)sb+=3; else if(dl<7)sb+=1; }
      return sb - sa;
    });
    await Promise.all(tasks.map((t,i) => Task.findByIdAndUpdate(t._id, { order:i, aiPriorityScore:(4-i)*10 })));
    const updated = await Task.find({ userId:req.user._id }).sort({ order:1, createdAt:-1 });
    res.json({ success:true, data:updated });
  } catch (err) { res.status(500).json({ error:err.message }); }
};

exports.getTaskStats = async (req, res) => {
  try {
    const uid = req.user._id;
    const tasks = await Task.find({ userId:uid });
    const today = new Date().toISOString().split("T")[0];
    const byPriority = { urgent:0, high:0, medium:0, low:0 };
    const byCategory = {};
    tasks.forEach(t => {
      if (byPriority[t.priority]!==undefined) byPriority[t.priority]++;
      byCategory[t.category] = (byCategory[t.category]||0)+1;
    });
    const overdue = tasks.filter(t=>t.status==="incomplete"&&t.dueDate&&new Date(t.dueDate)<new Date()).length;
    const dueToday= tasks.filter(t=>t.status==="incomplete"&&t.dueDate&&t.dueDate.toISOString().startsWith(today)).length;
    const completedToday = tasks.filter(t=>t.status==="completed"&&t.completedAt&&t.completedAt.toISOString().startsWith(today)).length;
    res.json({ success:true, data:{ total:tasks.length, byStatus:{ incomplete:tasks.filter(t=>t.status==="incomplete").length, completed:tasks.filter(t=>t.status==="completed").length, suspended:tasks.filter(t=>t.status==="suspended").length }, byPriority, byCategory, overdue, dueToday, completedToday }});
  } catch(err){ res.status(500).json({ error:err.message }); }
};
