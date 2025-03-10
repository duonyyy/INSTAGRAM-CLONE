import mongoose from "mongoose"; // Import mongoose để làm việc với MongoDB

// Định nghĩa schema cho User
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, // Tên người dùng, bắt buộc và duy nhất
    email: { type: String, required: true, unique: true }, // Email, bắt buộc và duy nhất
    password: { type: String, required: true }, // Mật khẩu, bắt buộc (nên hash trước khi lưu)
    profilePicture: { type: String, default: '' }, // Ảnh đại diện, mặc định là chuỗi rỗng
    bio: { type: String, default: '' }, // Tiểu sử cá nhân, mặc định là chuỗi rỗng
    gender: { type: String, enum: ['male', 'female'] }, // Giới tính, chỉ chấp nhận 'male' hoặc 'female'
    
    // Danh sách những người theo dõi (Mảng chứa ObjectId tham chiếu đến User)
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Danh sách những người mà user đang theo dõi (Mảng chứa ObjectId tham chiếu đến User)
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Danh sách bài viết của người dùng (Mảng chứa ObjectId tham chiếu đến Post)
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],

    // Danh sách bài viết mà người dùng đã bookmark (Mảng chứa ObjectId tham chiếu đến Post)
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
}, { timestamps: true }); // timestamps:true sẽ tự động tạo createdAt và updatedAt

// Xuất model User để có thể sử dụng trong các phần khác của ứng dụng
export const User = mongoose.model('User', userSchema);
