import mongoose from "mongoose"; // Import mongoose để làm việc với MongoDB

// Định nghĩa schema cho Message (Tin nhắn)
const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId, // ID của người gửi tin nhắn
        ref: 'User', // Tham chiếu đến model User
        required: true // Bắt buộc phải có
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId, // ID của người nhận tin nhắn
        ref: 'User', // Tham chiếu đến model User
        required: true // Bắt buộc phải có
    },
    message: {
        type: String, // Nội dung tin nhắn
        required: true // Bắt buộc phải có
    }
}, { timestamps: true }); // timestamps: true giúp tự động tạo createdAt và updatedAt

// Xuất model Message để sử dụng trong ứng dụng
export const Message = mongoose.model('Message', messageSchema);
