import express, { Router } from "express";
import {
  registerUser,
  loginUser,
  logout,
  changeCurrentPassword,
  refreshAccessToken,
  updateEmail,
  changedAvatar,
  chnageCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  getCurrentUser,
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
router.route("/change-password").post(verifyJwt, changeCurrentPassword);
router.route("/refresh-token").post(verifyJwt, refreshAccessToken);
router.route("/update-user").post(verifyJwt, updateEmail);
router
  .route("/change-avatar")
  .post(verifyJwt, upload.single("avatar"), changedAvatar);
router
  .route("/change-coverimage")
  .post(verifyJwt, upload.single("/coverImage"), chnageCoverImage);
router.route("/user-channel").get(verifyJwt, getUserChannelProfile);
router.route("/watch-history").get(verifyJwt, getWatchHistory);

router.route("/current-user").get(verifyJwt, getCurrentUser);
export default router;
