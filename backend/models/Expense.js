const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref:"User", required:true },
  amount:      { type: Number, required:true, min:0 },
  description: { type: String, required:true, trim:true },
  category:    { type: String, enum:["food","transport","entertainment","health","shopping","utilities","education","other"], default:"other" },
  date:        { type: String, required:true },
  isRecurring: { type: Boolean, default:false },
  tags:        [String],
  notes:       { type: String, default:"" },
}, { timestamps:true });
module.exports = mongoose.model("Expense", schema);
