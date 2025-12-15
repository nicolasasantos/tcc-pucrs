const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'category',
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  name: { type: String, required: true },
  email: { type: String, required: false },
  vote_fix: { type: Number, default: 0 },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
const Report = mongoose.model('report', reportSchema);
module.exports = Report;
