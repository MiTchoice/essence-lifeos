const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref:"User", required:true },
  title:       { type: String, required:true, trim:true },
  description: { type: String, default:"" },
  startDate:   { type: Date, required:true },
  endDate:     { type: Date, required:true },
  allDay:      { type: Boolean, default:false },
  color:       { type: String, default:"#22c55e" },
  taskId:      { type: mongoose.Schema.Types.ObjectId, ref:"Task", default:null },
  recurring:   { type: String, enum:["none","daily","weekly","monthly"], default:"none" },
}, { timestamps:true });
module.exports = mongoose.model("CalendarEvent", schema);
