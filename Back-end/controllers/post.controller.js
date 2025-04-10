import { Post } from '../models/post.model.js';
import { User } from '../models/user.model.js';
import { Comment } from '../models/comment.model.js';
import cloudinary from '../utils/cloudinary.js';
import sharp from 'sharp';
import { getReceiverSocketId, io } from '../socket/socket.js';
// Thêm mới bài viết
export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file;
    const authorId = req.id;

    if (!image) return res.status(400).json({ message: 'Image required' });
    // sharp image
    const optimizedImageBuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: 'inside' })
      .toFormat('jpeg', { quality: 90 })
      .toBuffer();

    const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString(
      'base64'
    )}`;
    const cloudResponse = await cloudinary.uploader.upload(fileUri);

    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: authorId,
    });

    const user = await User.findById(authorId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.posts.push(post._id);
    await user.save();

    await post.populate({ path: 'author', select: '-password' });

    return res.status(201).json({
      message: 'New post added',
      post,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Internal Server Error', error: error.message });
  }
};
// lay bai viet
export const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: 'author', select: 'username profilePicture' })
      .populate({
        path: 'comments',
        sort: { createdAt: -1 },
        populate: {
          path: 'author',
          select: 'username profilePicture',
        },
      });
    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
// lay bai viet cua 1 nguoi
export const getUserPost = async (req, res) => {
  try {
    const authorId = req.id;
    const posts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'author',
        select: 'username, profilePicture',
      })
      .populate({
        path: 'comments',
        sort: { createdAt: -1 },
        populate: {
          path: 'author',
          select: 'username, profilePicture',
        },
      });
    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Internal Server Error', error: error.message });
  }
};
// like bai viet
export const likePost = async (req, res) => {
  try {
    const curentUserId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ message: 'Post not found', success: false });

    await post.updateOne({ $addToSet: { likes: curentUserId } });
    await post.save();

    // implement socket io for real time notification
    const user = await User.findById(curentUserId).select(
      'username profilePicture'
    );

    const postOwnerId = post.author.toString();
    if (postOwnerId !== curentUserId) {
      // emit a notification event
      const notification = {
        type: 'like',
        userId: curentUserId,
        userDetails: user,
        postId,
        message: 'Your post was liked',
      };
      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      io.to(postOwnerSocketId).emit('notification', notification);
    }

    return res.status(200).json({ message: 'Post liked', success: true });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Internal Server Error', error: error.message });
  }
};
// dislike bai viet
export const dislikePost = async (req, res) => {
  try {
    const curentUserId = req.id; // ID của người dùng hiện tại
    const postId = req.params.id; // ID của bài viết từ tham số URL
    const post = await Post.findById(postId); // Tìm bài viết trong DB
    if (!post)
      return res
        .status(404)
        .json({ message: 'Post not found', success: false });

    await post.updateOne({ $pull: { likes: curentUserId } }); // Xóa userId khỏi mảng likes
    await post.save(); // Lưu thay đổi

    // Implement socket.io for real-time notification
    const user = await User.findById(curentUserId).select(
      'username profilePicture'
    ); // Sửa lỗi biến
    const postOwnerId = post.author.toString(); // ID của chủ bài viết
    if (postOwnerId !== curentUserId) {
      // Emit a notification event
      const notification = {
        type: 'dislike',
        userId: curentUserId, // Sửa lỗi biến
        userDetails: user,
        postId,
        message: 'Your post was disliked', // Sửa message cho phù hợp
      };
      const postOwnerSocketId = getReceiverSocketId(postOwnerId); // Lấy socket ID của chủ bài viết
      io.to(postOwnerSocketId).emit('notification', notification); // Gửi thông báo qua Socket.IO
    }

    return res.status(200).json({ message: 'Post disliked', success: true });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Internal Server Error', error: error.message });
  }
};
// viet comment
export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentKrneWalaUserKiId = req.id;

    const { text } = req.body;

    const post = await Post.findById(postId);

    if (!text)
      return res
        .status(400)
        .json({ message: 'text is required', success: false });

    const comment = await Comment.create({
      text,
      author: commentKrneWalaUserKiId,
      post: postId,
    });

    await comment.populate({
      path: 'author',
      select: 'username profilePicture',
    });

    post.comments.push(comment._id);
    await post.save();

    return res.status(201).json({
      message: 'Comment Added',
      comment,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};
// lay comment cua 1 bai viet
export const getCommentsOfPost = async (req, res) => {
  try {
    const postId = req.params.id;

    const comments = await Comment.find({ post: postId }).populate(
      'author',
      'username profilePicture'
    );

    if (!comments)
      return res
        .status(404)
        .json({ message: 'No comments found for this post', success: false });

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.log(error);
  }
};
// xoa bai viet
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;

    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ message: 'Post not found', success: false });

    // check if the logged-in user is the owner of the post
    if (post.author.toString() !== authorId)
      return res.status(403).json({ message: 'Unauthorized' });

    // delete post
    await Post.findByIdAndDelete(postId);

    // remove the post id from the user's post
    let user = await User.findById(authorId);
    user.posts = user.posts.filter((id) => id.toString() !== postId);
    await user.save();

    // delete associated comments
    await Comment.deleteMany({ post: postId });

    return res.status(200).json({
      success: true,
      message: 'Post deleted',
    });
  } catch (error) {
    console.log(error);
  }
};
// bookmark bai viet
export const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;
    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ message: 'Post not found', success: false });

    const user = await User.findById(authorId);
    if (user.bookmarks.includes(post._id)) {
      // already bookmarked -> remove from the bookmark
      await user.updateOne({ $pull: { bookmarks: post._id } });
      await user.save();
      return res.status(200).json({
        type: 'unsaved',
        message: 'Post removed from bookmark',
        success: true,
      });
    } else {
      // bookmark krna pdega
      await user.updateOne({ $addToSet: { bookmarks: post._id } });
      await user.save();
      return res
        .status(200)
        .json({ type: 'saved', message: 'Post bookmarked', success: true });
    }
  } catch (error) {
    console.log(error);
  }
};
