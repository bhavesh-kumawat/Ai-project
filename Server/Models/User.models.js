const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const UserSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/^\S+@\S+.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: true,
      trim: true,
      min: 4,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

UserSchema.pre(`save`, async function () {
  if (!this.isModified(`password`)) return;
  this.password = await bcrypt.hash(this.password, 10);
})

UserSchema.methods.comparePassword = async function (userPassword) {
  return await bcrypt.compare(userPassword, this.password);
}

module.exports = mongoose.model("User", UserSchema);