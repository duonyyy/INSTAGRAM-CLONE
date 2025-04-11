import { User } from '../models/user.model.js';
import { Post } from '../models/post.model.js';
import cloudinary from '../utils/cloudinary.js';
import getDataUri from '../utils/datauri.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getReceiverSocketId, io } from '../socket/socket.js';
const hashPassword = (password) =>
  bcrypt.hashSync(password, bcrypt.genSaltSync(10));
export const register = async (req, res) => {
  try {
    // check fill data
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(401).json({
        message: ' Something is missing, please check!',
        success: false,
      });
    }
    // check have email
    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({
        message: 'Try different email',
        success: false,
      });
    }
    // bcrypt password
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      password: hashedPassword,
    });
    return res.status(201).json({
      message: 'Account created successfully.',
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        message: 'Something is missing, please check!',
        success: false,
      });
    }
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Incorrect email or password',
        success: false,
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: 'Incorrect email or password',
        success: false,
      });
    }

    const token = await jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: '1d',
    });

    // Populate posts, kiểm tra post tồn tại trước khi truy cập author
    const populatedPosts = await Promise.all(
      user.posts.map(async (postId) => {
        const post = await Post.findById(postId);
        if (post && post.author.equals(user._id)) {
          // Kiểm tra post tồn tại
          return post;
        }
        return null;
      })
    );
    const validPosts = populatedPosts.filter((post) => post !== null); // Lọc các post null

    user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: validPosts, // Chỉ trả về các bài viết hợp lệ
    };

    return res
      .cookie('token', token, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 1 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: `Welcome back ${user.username}`,
        success: true,
        user,
      });
  } catch (error) {
    console.error('Error in login:', error);
    return res
      .status(500)
      .json({ message: 'Internal Server Error', error: error.message });
  }
};

export const logout = async (_, res) => {
  try {
    return res.cookie('token', '', { maxAge: 0 }).json({
      message: 'Logged out successfully.',
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    let user = await User.findById(userId)
      .populate({ path: 'posts', createdAt: -1 })
      .populate('bookmarks');
    return res.status(200).json({
      user,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
export const editProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { bio, gender } = req.body;
    const profilePicture = req.file;
    let cloudResponse;

    if (profilePicture) {
      const fileUri = getDataUri(profilePicture);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found.',
        success: false,
      });
    }
    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (profilePicture) user.profilePicture = cloudResponse.secure_url;

    await user.save();

    return res.status(200).json({
      message: 'Profile updated.',
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select(
      '-password'
    );
    if (!suggestedUsers) {
      return res.status(400).json({
        message: 'Currently do not have any users',
      });
    }
    return res.status(200).json({
      success: true,
      users: suggestedUsers,
    });
  } catch (error) {
    console.log(error);
  }
};
// controllers/userController.js
export const followOrUnfollow = async (req, res) => {
  try {
    const currentUserId = req.id;
    const targetUserId = req.params.id;

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        message: 'You cannot follow/unfollow yourself',
        success: false,
      });
    }

    const user = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);
    if (!user || !targetUser) {
      return res
        .status(400)
        .json({ message: 'User not found', success: false });
    }

    const isFollowing = user.following.includes(targetUserId);

    if (isFollowing) {
      await Promise.all([
        User.updateOne(
          { _id: currentUserId },
          { $pull: { following: targetUserId } }
        ),
        User.updateOne(
          { _id: targetUserId },
          { $pull: { followers: currentUserId } }
        ),
      ]);
      return res
        .status(200)
        .json({ message: 'Unfollowed successfully', success: true });
    } else {
      await Promise.all([
        User.updateOne(
          { _id: currentUserId },
          { $push: { following: targetUserId } }
        ),
        User.updateOne(
          { _id: targetUserId },
          { $push: { followers: currentUserId } }
        ),
      ]);

      const recentPost = await Post.findOne({ author: targetUserId })
        .sort({ createdAt: -1 })
        .select('_id');

      const notification = {
        _id: Date.now().toString(),
        type: 'follow',
        userId: currentUserId,
        userDetails: {
          username: user.username,
          profilePicture: user.profilePicture,
        },
        targetUserId,
        message: `${user.username} started following you`,
        postId: recentPost?._id || null,
        timestamp: new Date(),
      };

      const targetUserSocketId = getReceiverSocketId(targetUserId);
      if (targetUserSocketId)
        io.to(targetUserSocketId).emit('notification', notification);

      return res
        .status(200)
        .json({ message: 'Followed successfully', success: true });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Internal Server Error', error: error.message });
  }
};
