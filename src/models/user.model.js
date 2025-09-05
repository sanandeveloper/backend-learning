import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    fullName: {
      type: String,
      required: true,
    },
    watchHistory: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    refreshToken:{
      type: String
    }
  },
  { timestamps: true },
);

userSchema.plugin(mongooseAggregatePaginate);

userSchema.pre("save", function (next) {
  if (this.password.isModified) return next();
  this.password = bcrypt.hash("password", 10);
  next();
});

userSchema.methods.isPassowrdCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {

   return jwt.sign(
    {
   
      _id: this._id,
      email: this.email,
      fullName: this.fullName,
    },
    process.env.ACESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACESS_TOKEN_EXPIRAY,
    },
  );
};

userSchema.methods.genrateRefreshToken=function () {
   return jwt.sign({
        _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRAY
    }
)
}

export const User = mongoose.model("User", userSchema);
