const { DB_STRING } = require("./config");
const mongoose = require('mongoose');

mongoose.connect(DB_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});