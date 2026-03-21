const Expense = require("../models/Expense");

exports.getExpenses = async (req, res) => {
  try {
    const filter = { userId:req.user._id };
    if (req.query.date) filter.date = req.query.date;
    if (req.query.category) filter.category = req.query.category;
    const expenses = await Expense.find(filter).sort({ createdAt:-1 });
    res.json({ success:true, data:expenses });
  } catch (err) { res.status(500).json({ error:err.message }); }
};

exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, userId:req.user._id });
    res.status(201).json({ success:true, data:expense });
  } catch (err) { res.status(400).json({ error:err.message }); }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate({ _id:req.params.id, userId:req.user._id }, req.body, { new:true });
    if (!expense) return res.status(404).json({ error:"Not found" });
    res.json({ success:true, data:expense });
  } catch (err) { res.status(400).json({ error:err.message }); }
};

exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id:req.params.id, userId:req.user._id });
    res.json({ success:true });
  } catch (err) { res.status(500).json({ error:err.message }); }
};

exports.getDailyComparison = async (req, res) => {
  try {
    const today     = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now()-86400000).toISOString().split("T")[0];
    const uid = req.user._id;
    const [te, ye] = await Promise.all([
      Expense.find({ userId:uid, date:today }),
      Expense.find({ userId:uid, date:yesterday }),
    ]);
    const sum = arr => arr.reduce((s,e)=>s+e.amount,0);
    const byCat = arr => arr.reduce((acc,e)=>{ acc[e.category]=(acc[e.category]||0)+e.amount; return acc; },{});
    res.json({ success:true, data:{ today:{ total:sum(te), byCategory:byCat(te), count:te.length }, yesterday:{ total:sum(ye), byCategory:byCat(ye), count:ye.length }, difference:sum(te)-sum(ye) }});
  } catch (err) { res.status(500).json({ error:err.message }); }
};

exports.getBudgetStatus = async (req, res) => {
  try {
    const uid = req.user._id;
    const month = new Date().toISOString().slice(0,7); // "2024-03"
    const allDays = [];
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
    for (let i=1; i<=daysInMonth; i++) {
      allDays.push(`${month}-${String(i).padStart(2,"0")}`);
    }
    const expenses = await require("../models/Expense").find({ userId:uid, date:{ $in:allDays } });
    const totalSpent = expenses.reduce((s,e)=>s+e.amount,0);
    const byCat = {};
    expenses.forEach(e=>{ byCat[e.category]=(byCat[e.category]||0)+e.amount; });
    const dailyAvg = totalSpent / new Date().getDate();
    const projectedMonthly = dailyAvg * daysInMonth;
    res.json({ success:true, data:{ totalSpent, byCat, dailyAvg:Math.round(dailyAvg), projectedMonthly:Math.round(projectedMonthly), month } });
  } catch(err) { res.status(500).json({ error:err.message }); }
};
