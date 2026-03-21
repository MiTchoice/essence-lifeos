const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref:"User", required:true },
  title:            { type: String, required:true, trim:true },
  description:      { type: String, default:"" },
  status:           { type: String, enum:["incomplete","completed","suspended"], default:"incomplete" },
  priority:         { type: String, enum:["low","medium","high","urgent"], default:"medium" },
  category:         { type: String, default:"general" },
  dueDate:          { type: Date, default:null },
  scheduledDate:    { type: Date, default:null },
  reminderAt:       { type: Date, default:null },
  estimatedMinutes: { type: Number, default:30 },
  actualMinutes:    { type: Number, default:0 },
  tags:             [String],
  aiPriorityScore:  { type: Number, default:0 },
  order:            { type: Number, default:0 },
  completedAt:      { type: Date, default:null },
  streak:           { type: Number, default:0 },
}, { timestamps:true });
module.exports = mongoose.model("Task", taskSchema);
