const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref:"User", required:true },
  taskId:          { type: mongoose.Schema.Types.ObjectId, ref:"Task", default:null },
  taskTitle:       { type: String, default:"Untracked" },
  category:        { type: String, enum:["productive","unproductive","neutral"], default:"productive" },
  startTime:       { type: Date, required:true },
  endTime:         { type: Date, default:null },
  durationMinutes: { type: Number, default:0 },
  date:            { type: String, required:true },
  notes:           { type: String, default:"" },
}, { timestamps:true });
module.exports = mongoose.model("TimeEntry", schema);
