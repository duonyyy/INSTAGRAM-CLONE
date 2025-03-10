import mongoose from "mongoose"; // Import mongoose để làm việc với MongoDB

// Định nghĩa schema cho Comment (Bình luận)
const commentSchema = new mongoose.Schema({
    text: { 
        type: String, // Nội dung bình luận
        required: true // Bắt buộc phải có
    },
    author: { 
        type: mongoose.Schema.Types.ObjectId, // ID của người bình luận
        ref: 'User', // Tham chiếu đến model User
        required: true // Bắt buộc phải có
    },
    post: { 
        type: mongoose.Schema.Types.ObjectId, // ID của bài viết được bình luận
        ref: 'Post', // Tham chiếu đến model Post
        required: true // Bắt buộc phải có
    }
}, { timestamps: true }); // timestamps: true giúp tự động tạo createdAt và updatedAt

// Xuất model Comment để sử dụng trong ứng dụng
export const Comment = mongoose.model('Comment', commentSchema);
