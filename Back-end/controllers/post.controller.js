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
    const files = req.files; // Nhận mảng các file từ multer
    const authorId = req.id;

    // Kiểm tra xem có file nào được upload không
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    // Xử lý và upload từng ảnh
    const uploadedImages = [];
    for (const file of files) {
      // Tối ưu hóa ảnh với sharp
      const optimizedImageBuffer = await sharp(file.buffer)
        .resize({ width: 800, height: 800, fit: 'inside' })
        .toFormat('jpeg', { quality: 90 })
        .toBuffer();

      // Chuyển buffer thành base64 để upload lên Cloudinary
      const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
      const cloudResponse = await cloudinary.uploader.upload(fileUri);

      // Lưu URL ảnh đã upload vào mảng
      uploadedImages.push(cloudResponse.secure_url);
    }

    // Tạo bài viết mới với mảng images
    const post = await Post.create({
      caption,
      images: uploadedImages, // Lưu mảng các URL ảnh
      author: authorId,
    });

    // Cập nhật danh sách bài viết của user
    const user = await User.findById(authorId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.posts.push(post._id);
    await user.save();

    // Populate thông tin author (loại bỏ password)
    await post.populate({ path: 'author', select: '-password' });

    return res.status(201).json({
      message: 'New post added with multiple images',
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
    const currentUserId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ message: "Post not found", success: false });

    await post.updateOne({ $addToSet: { likes: currentUserId } });

    const user = await User.findById(currentUserId).select("username profilePicture");
    const postOwnerId = post.author.toString();
    if (postOwnerId !== currentUserId) {
      const notification = {
        _id: Date.now().toString(),
        type: "like",
        userId: currentUserId,
        userDetails: { username: user.username, profilePicture: user.profilePicture },
        postId,
        message: `${user.username} liked your post`,
        timestamp: new Date(),
      };
      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      if (postOwnerSocketId) io.to(postOwnerSocketId).emit("notification", notification);
    }

    return res.status(200).json({ message: "Post liked", success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
// dislikePost
export const dislikePost = async (req, res) => {
  try {
    const currentUserId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ message: 'Post not found', success: false });

    await post.updateOne({ $pull: { likes: currentUserId } });

    const user = await User.findById(currentUserId).select('username profilePicture');
    const postOwnerId = post.author.toString();
    if (postOwnerId !== currentUserId) {
      const notification = {
        type: 'dislike',
        userId: currentUserId,
        userDetails: user,
        postId,
        message: `${user.username} removed their like from your post`,
      };
      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      if (postOwnerSocketId) io.to(postOwnerSocketId).emit('notification', notification);
    }

    const updatedPost = await Post.findById(postId).populate('author', 'username profilePicture');
    return res.status(200).json({ message: 'Post disliked', post: updatedPost, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
// viet comment

export const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const currentUserId = req.id;
    const { text } = req.body;

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ message: "Post not found", success: false });

    if (!text)
      return res.status(400).json({ message: "Text is required", success: false });

    const comment = await Comment.create({
      text,
      author: currentUserId,
      post: postId,
    });

    await comment.populate({ path: "author", select: "username profilePicture" });

    post.comments.push(comment._id);
    await post.save();

    const postOwnerId = post.author.toString();
    if (postOwnerId !== currentUserId) {
      const notification = {
        _id: Date.now().toString(),
        type: "comment",
        userId: currentUserId,
        userDetails: { username: comment.author.username, profilePicture: comment.author.profilePicture },
        postId,
        message: `${comment.author.username} commented on your post: ${text}`,
        timestamp: new Date(),
      };
      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      if (postOwnerSocketId) io.to(postOwnerSocketId).emit("notification", notification);
    }

    return res.status(201).json({ message: "Comment Added", comment, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
// getCommentsOfPost
export const getCommentsOfPost = async (req, res) => {
  try {
    const postId = req.params.id;

    const comments = await Comment.find({ post: postId }).populate(
      'author',
      'username profilePicture'
    );

    if (comments.length === 0)
      return res.status(200).json({ message: 'No comments found for this post', success: true, comments: [] });

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
// deletePost
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ message: 'Post not found', success: false });

    if (post.author.toString() !== authorId)
      return res.status(403).json({ message: 'Unauthorized' });

    for (const imageUrl of post.images) {
      const publicId = imageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await Post.findByIdAndDelete(postId);

    let user = await User.findById(authorId);
    user.posts = user.posts.filter((id) => id.toString() !== postId);
    await user.save();

    await Comment.deleteMany({ post: postId });

    return res.status(200).json({
      success: true,
      message: 'Post deleted',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
// bookmarkPost
export const bookmarkPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const authorId = req.id;
    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ message: 'Post not found', success: false });

    const user = await User.findById(authorId);
    if (user.bookmarks.includes(post._id)) {
      await user.updateOne({ $pull: { bookmarks: post._id } });
      return res.status(200).json({
        type: 'unsaved',
        message: 'Post removed from bookmark',
        success: true,
      });
    } else {
      await user.updateOne({ $addToSet: { bookmarks: post._id } });
      return res.status(200).json({
        type: 'saved',
        message: 'Post bookmarked',
        success: true,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
