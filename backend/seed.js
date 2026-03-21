require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Task = require("./models/Task");
const TimeEntry = require("./models/TimeEntry");
const Expense = require("./models/Expense");
const CalendarEvent = require("./models/CalendarEvent");

const MONGO_URI = process.env.MONGODB_URI || "";
function daysAgo(n) { const d=new Date(); d.setDate(d.getDate()-n); return d; }
function dateStr(n) { return daysAgo(n).toISOString().split("T")[0]; }

async function seed() {
  console.log("\n🌱 LifeOS Seed — NIT Hamirpur\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  if (!MONGO_URI) { console.error("❌  Set MONGODB_URI in .env"); process.exit(1); }

  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS:10000 });
  console.log("✅ Connected to Atlas\n");

  // Create a demo user (skip if exists)
  let user = await User.findOne({ email:"demo@lifeos.nith" });
  if (!user) {
    user = await User.create({ name:"Demo User", email:"demo@lifeos.nith", password:"demo123" });
    console.log("✅ Demo user created");
  } else {
    console.log("ℹ️  Demo user already exists");
  }
  const uid = user._id;

  // Clear demo user's data only
  await Promise.all([
    Task.deleteMany({ userId:uid }),
    TimeEntry.deleteMany({ userId:uid }),
    Expense.deleteMany({ userId:uid }),
    CalendarEvent.deleteMany({ userId:uid }),
  ]);
  console.log("🗑️  Cleared demo user's old data");

  const tasks = await Task.insertMany([
    { userId:uid, title:"Complete project proposal", description:"Write Q4 proposal for client", priority:"urgent", status:"incomplete", category:"work", estimatedMinutes:90, dueDate:daysAgo(-1), scheduledDate:new Date(), order:0, tags:["important"] },
    { userId:uid, title:"Review team pull requests", priority:"high", status:"incomplete", category:"work", estimatedMinutes:45, dueDate:daysAgo(-2), order:1, tags:["code"] },
    { userId:uid, title:"Daily exercise routine", priority:"medium", status:"completed", category:"health", estimatedMinutes:45, order:2, tags:["fitness"] },
    { userId:uid, title:"Read 30 pages of Atomic Habits", priority:"low", status:"incomplete", category:"personal", estimatedMinutes:40, order:3, tags:["reading"] },
    { userId:uid, title:"Weekly grocery shopping", priority:"medium", status:"incomplete", category:"personal", estimatedMinutes:60, order:4, tags:[] },
    { userId:uid, title:"Set up CI/CD pipeline", description:"Configure GitHub Actions", priority:"high", status:"incomplete", category:"work", estimatedMinutes:120, tags:["devops"], order:5 },
    { userId:uid, title:"Doctor appointment", priority:"urgent", status:"suspended", category:"health", estimatedMinutes:30, order:6, tags:[] },
    { userId:uid, title:"Pay electricity bill", priority:"urgent", status:"completed", category:"personal", estimatedMinutes:5, order:7, tags:[] },
  ]);
  console.log(`✅ Seeded ${tasks.length} tasks`);

  const timeEntries = [];
  for (let day=13; day>=0; day--) {
    const date=dateStr(day); const base=daysAgo(day); base.setHours(9,0,0,0);
    const p=80+Math.round(Math.random()*50), u=15+Math.round(Math.random()*20), n=40+Math.round(Math.random()*30);
    timeEntries.push({ userId:uid, taskTitle:"Deep work / Coding", category:"productive", startTime:new Date(base), endTime:new Date(base.getTime()+p*60000), durationMinutes:p, date });
    timeEntries.push({ userId:uid, taskTitle:"Social media / breaks", category:"unproductive", startTime:new Date(base.getTime()+(p+5)*60000), endTime:new Date(base.getTime()+(p+5+u)*60000), durationMinutes:u, date });
    timeEntries.push({ userId:uid, taskTitle:"Meetings & emails", category:"neutral", startTime:new Date(new Date(base).setHours(13,0,0,0)), endTime:new Date(new Date(base).setHours(13,n,0,0)), durationMinutes:n, date });
  }
  await TimeEntry.insertMany(timeEntries);
  console.log(`✅ Seeded ${timeEntries.length} time entries`);

  const templates = [
    {description:"Morning tea/coffee",category:"food",amounts:[20,30,40]},
    {description:"Canteen lunch",category:"food",amounts:[60,80,100]},
    {description:"Bus/auto fare",category:"transport",amounts:[20,30,40]},
    {description:"Groceries",category:"food",amounts:[200,350,450]},
    {description:"Mobile recharge",category:"utilities",amounts:[149,199,299]},
    {description:"Books / stationery",category:"education",amounts:[150,300,500]},
    {description:"Snacks",category:"food",amounts:[30,50,80]},
    {description:"Movie / OTT",category:"entertainment",amounts:[99,149,199]},
  ];
  const expenses = [];
  for (let day=13; day>=0; day--) {
    const date=dateStr(day);
    const shuffled=[...templates].sort(()=>Math.random()-0.5).slice(0,2+Math.floor(Math.random()*3));
    shuffled.forEach(t=>expenses.push({ userId:uid, amount:t.amounts[Math.floor(Math.random()*t.amounts.length)], description:t.description, category:t.category, date, tags:[] }));
  }
  await Expense.insertMany(expenses);
  console.log(`✅ Seeded ${expenses.length} expenses`);

  console.log("\n🎉 Seed complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Demo login credentials:");
  console.log("  Email:    demo@lifeos.nith");
  console.log("  Password: demo123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  process.exit(0);
}

seed().catch(err => { console.error("❌", err.message); process.exit(1); });
