const TimeEntry = require("../models/TimeEntry");

exports.getEntries = async (req, res) => {
  try {
    const filter = { userId:req.user._id };
    if (req.query.date) filter.date = req.query.date;
    const entries = await TimeEntry.find(filter).sort({ startTime:-1 });
    res.json({ success:true, data:entries });
  } catch (err) { res.status(500).json({ error:err.message }); }
};

exports.startTimer = async (req, res) => {
  try {
    const now  = new Date();
    const date = now.toISOString().split("T")[0];
    const entry = await TimeEntry.create({ ...req.body, userId:req.user._id, startTime:now, date });
    res.status(201).json({ success:true, data:entry });
  } catch (err) { res.status(400).json({ error:err.message }); }
};

exports.stopTimer = async (req, res) => {
  try {
    const entry = await TimeEntry.findOne({ _id:req.params.id, userId:req.user._id });
    if (!entry) return res.status(404).json({ error:"Not found" });
    const now = new Date();
    entry.endTime = now;
    entry.durationMinutes = Math.max(1, Math.round((now-entry.startTime)/60000));
    await entry.save();
    res.json({ success:true, data:entry });
  } catch (err) { res.status(500).json({ error:err.message }); }
};

exports.createEntry = async (req, res) => {
  try {
    const entry = await TimeEntry.create({ ...req.body, userId:req.user._id });
    res.status(201).json({ success:true, data:entry });
  } catch (err) { res.status(400).json({ error:err.message }); }
};

exports.deleteEntry = async (req, res) => {
  try {
    await TimeEntry.findOneAndDelete({ _id:req.params.id, userId:req.user._id });
    res.json({ success:true });
  } catch (err) { res.status(500).json({ error:err.message }); }
};

exports.getDailyReport = async (req, res) => {
  try {
    const today     = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now()-86400000).toISOString().split("T")[0];
    const uid = req.user._id;
    const [te, ye] = await Promise.all([
      TimeEntry.find({ userId:uid, date:today }),
      TimeEntry.find({ userId:uid, date:yesterday }),
    ]);
    const s = arr => ({
      productive:   arr.filter(e=>e.category==="productive").reduce((a,e)=>a+e.durationMinutes,0),
      unproductive: arr.filter(e=>e.category==="unproductive").reduce((a,e)=>a+e.durationMinutes,0),
      neutral:      arr.filter(e=>e.category==="neutral").reduce((a,e)=>a+e.durationMinutes,0),
      total:        arr.reduce((a,e)=>a+e.durationMinutes,0),
    });
    res.json({ success:true, data:{ today:s(te), yesterday:s(ye), todayEntries:te, yesterdayEntries:ye }});
  } catch (err) { res.status(500).json({ error:err.message }); }
};
