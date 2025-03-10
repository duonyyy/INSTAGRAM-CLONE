import mongoose from "mongoose"; // Import mongoose để làm việc với MongoDB

// Định nghĩa schema cho Post (Bài viết)
const postSchema = new mongoose.Schema({
    caption: { type: String, default: '' }, // Chú thích (caption) của bài viết, mặc định là chuỗi rỗng
    image: { type: String, required: true }, // Đường dẫn hoặc URL của hình ảnh, bắt buộc phải có
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người đăng bài (tham chiếu đến User), bắt buộc phải có
    
    // Danh sách người dùng đã thích bài viết (Mảng chứa ObjectId tham chiếu đến User)
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Danh sách bình luận của bài viết (Mảng chứa ObjectId tham chiếu đến Comment)
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
}, { timestamps: true }); // timestamps:true giúp tự động tạo createdAt và updatedAt

// Xuất model Post để sử dụng trong các phần khác của ứng dụng
export const Post = mongoose.model('Post', postSchema);
