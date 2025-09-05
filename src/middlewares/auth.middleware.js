import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";

export const verifyJwt = async (req, res,next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers("Authorization").replace("bearer ", "");
    if (!token) {
      throw new ApiError(401, "unathurized Token");
    }

    const decodedToken = jwt.verify(token, process.env.ACESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken",
    );

    if (!user) {
      throw new ApiError(401, "inavlid token");
    }
    req.user=user
    next()
    
  } catch (error) {
    console.log("error ocuured while verify jwt", error);
    throw new ApiError(400,'not verifyJWT')
  }
};
