const CalendarEvent = require("../models/CalendarEvent");
const Task = require("../models/Task");

exports.getEvents = async (req, res) => {
  try {
    const events = await CalendarEvent.find({ userId:req.user._id }).sort({ startDate:1 });
    res.json({ success:true, data:events });
  } catch (err) { res.status(500).json({ error:err.message }); }
};

exports.createEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.create({ ...req.body, userId:req.user._id });
    res.status(201).json({ success:true, data:event });
  } catch (err) { res.status(400).json({ error:err.message }); }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findOneAndUpdate({ _id:req.params.id, userId:req.user._id }, req.body, { new:true });
    if (!event) return res.status(404).json({ error:"Not found" });
    res.json({ success:true, data:event });
  } catch (err) { res.status(400).json({ error:err.message }); }
};

exports.deleteEvent = async (req, res) => {
  try {
    await CalendarEvent.findOneAndDelete({ _id:req.params.id, userId:req.user._id });
    res.json({ success:true });
  } catch (err) { res.status(500).json({ error:err.message }); }
};

exports.syncTasks = async (req, res) => {
  try {
    const tasks  = await Task.find({ userId:req.user._id, scheduledDate:{ $ne:null } });
    const events = await CalendarEvent.find({ userId:req.user._id });
    let count = 0;
    for (const task of tasks) {
      if (!events.find(e => String(e.taskId) === String(task._id))) {
        const end = new Date(task.scheduledDate);
        end.setMinutes(end.getMinutes() + (task.estimatedMinutes||30));
        await CalendarEvent.create({ userId:req.user._id, title:task.title, startDate:task.scheduledDate, endDate:end, taskId:task._id, color:task.priority==="urgent"?"#ef4444":task.priority==="high"?"#f97316":"#22c55e" });
        count++;
      }
    }
    res.json({ success:true, synced:count });
  } catch (err) { res.status(500).json({ error:err.message }); }
};
