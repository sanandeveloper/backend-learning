import { asyncHandler } from "../utils/ayncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadCloundiary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessandRefreshToken = async (user_id) => {
  try {
    const user = await User.findById(user_id);
    console.log("accestoken generatering...");

    const accessToken = user.generateAccessToken();
    console.log("accestoken generaterd", accessToken);

    const refreshToken = user.genrateRefreshToken();

    console.log("refreshToken generaterd", refreshToken);

    user.refreshToken = accessToken;

    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    console.log("acces token not generated", error);
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // 1: step to register user
  // 2: take input from frontend
  // 3: validate
  // 4: use middle ware in routes
  // 5: check coverImage and avatar
  // 6: upload file on cloudinary,check
  // 7: created user object and send data
  // 8: after this remove password ad token from data
  // 9: return res

  console.log("req.body =>", req.body);
  console.log("req.files =>", req.files);

  const { fullName, email, password, username } = req.body;

  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all field are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "username or email already registerd");
  }
  console.log("existedUser=>", existedUser);

  console.log("req.fils", req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;



  console.log("localpathavatar :", avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar files is required");
  }

  const avatar = await uploadCloundiary(avatarLocalPath);

  console.log("avatar", avatar);
  const coverImage = coverImageLocalPath
    ? await uploadCloundiary(coverImageLocalPath)
    : null;
  console.log("coverImage", coverImage);

  if (!avatar) {
    throw new ApiError(400, "avatar files are required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
    username: username.toLowerCase(),
    email,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!createdUser) {
    throw new ApiError(501, "something went wrong while registerd user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "user registerd succesfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  if (!(username || email)) {
    throw new ApiError("400", "email or password is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "email or password is incorrect");
  }

  await user.isPassowrdCorrect(password);

  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-refreshToken -password ",
  );

  const option = {
    httpOnly: true,
    secure: true,
  };
  console.log("datafetched");

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          refreshToken,
          accessToken,
        },
        "user logged in succuefully",
      ),
    );
});

const logout = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: 1 },
  });

  const option = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "user logged out"));
};

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken = req.cookie?.accessToken || req.body.accessToken;

  if (!incommingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    if (!decodedToken) {
      throw new ApiError(400, "inavlid refresh token");
    }

    if (!incommingRefreshToken !== decodedToken) {
      throw new ApiError(400, "inavlid token not matched");
    }

    const user = User.findById(decodedToken?._id);

    const { accessToken, newRefreshToken } = generateAccessandRefreshToken(
      user._id,
    );
    const option = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(
        new ApiResponse(
          200,
          {
            refreshToken: newRefreshToken,
          },
          "token is refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(400, "token not refreshed");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword) {
    throw new ApiError(400, "please enter old password");
  }

  const user = await User.findById(req.user?._id);
  const isPassowrdCorrect = user.isPassowrdCorrect(oldPassword);

  if (!isPassowrdCorrect) {
    throw new ApiError(400, "old password is inccorect");
  }

  user.password = newPassword;

  const changedPassword = await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed Succesfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.res, "user fetched succesfully"));
});

const updateEmail = asyncHandler(async (req, res) => {
  const { newEmail, newfullName } = req.body;
  if (!(newEmail && newfullName)) {
    throw ApiError(400, "email and fullname are required");
  }

  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      fullName: newfullName,
      email: newEmail,
    },
  }).select("-password");
  if (!user) {
    throw ApiError(500, "email and fullame not updated");
  }

  return res
    .status(200)
    .json(200, user, "email and fullname changed successfully");
});

const changedAvatar = asyncHandler(async (req, res) => {
  const avatarPath = req.file?.path;
  if (!avatarPath) {
    throw new ApiError(200, "avatar path not found");
  }

  const avatar = uploadCloundiary(avatarPath);

  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      avatar: avatar.url,
    },
  }).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar changed Succesfully"));
});

const chnageCoverImage = asyncHandler(async (req, res) => {
  try {
    const coverImagePath = req.file?.path;
    if (!coverImagePath) {
      throw new ApiError(400, "cover image not found");
    }

    const avatar = await uploadCloundiary(coverImagePath);
    if (!avatar) {
      throw new ApiError(400, "file not upload on cloundiar");
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,

      {
        $set: {
          coverImage: avatar?.url,
        },
      },
    ).select("-password");

    if (!user) {
      throw new ApiError(400, "user not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "cover image changed successfully"));
  } catch (error) {
    console.log("error", error);
  }
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "username not found");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username,
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscriber",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        channelSubscriber: {
          $size: "$susbcriber",
        },
        channelSubscribedTo: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { in: [req.user?._id, "$susbcriber.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        channelSubscriber: 1,
        channelSubscribedTo: 1,
        email: 1,
        coverImage: 1,
      },
    },
  ]);
  if (!channel) {
    throw new ApiError(400, "channel does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "channel fetched succesfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watch History",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    avatar: 1,
                    fullName: 1,
                    username: 1,
                  },
                },
                {
                  $addFields: {
                    owner: {
                      $first: "$owner",
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched sucessfully",
      ),
    );
});

export {
  registerUser,
  loginUser,
  logout,
  changeCurrentPassword,
  refreshAccessToken,
  updateEmail,
  changedAvatar,
  chnageCoverImage,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory
};
