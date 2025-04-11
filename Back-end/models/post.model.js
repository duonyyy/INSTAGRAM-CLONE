import mongoose from 'mongoose';

// Định nghĩa schema cho Post (Bài viết)
const postSchema = new mongoose.Schema(
  {
    caption: { type: String, default: '' }, // Chú thích của bài viết, mặc định là chuỗi rỗng
    images: [{ type: String, required: true }], // Mảng chứa các URL hình ảnh, bắt buộc phải có ít nhất một ảnh
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }, // Người đăng bài (tham chiếu đến User), bắt buộc
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Danh sách người thích
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }], // Danh sách bình luận
  },
  { timestamps: true }
);

// Xuất model Post
export const Post = mongoose.model('Post', postSchema);
