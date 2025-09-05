import express, { Router } from "express";
import {
  registerUser,
  loginUser,
  logout,
} from "../contollers/user.controller.js";
// import  {secondUser}  from '../contollers/user.controller.js'
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJwt, logout);
export default router;
