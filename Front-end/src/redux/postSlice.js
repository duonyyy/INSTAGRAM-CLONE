
import { createSlice } from "@reduxjs/toolkit";


const postSlice = createSlice({
    name: 'post', // Tên của slice, dùng để định danh trong store
    initialState: { // Trạng thái ban đầu của slice
        posts: [], // Mảng lưu danh sách các bài post, khởi tạo rỗng
        selectedPost: null, // Lưu bài post được chọn, ban đầu là null
    },
    reducers: { // Các hàm reducer để xử lý actions
        // Action setPosts: cập nhật danh sách posts
        setPosts: (state, action) => {
            state.posts = action.payload; // Gán payload (dữ liệu mới) vào state.posts
            // action.payload là dữ liệu được gửi khi dispatch action này
        },
        // Action setSelectedPost: cập nhật bài post được chọn
        setSelectedPost: (state, action) => {
            state.selectedPost = action.payload; // Gán payload vào state.selectedPost
            // payload ở đây thường là một object post hoặc null
        }
    }
});

// Xuất các action creators để sử dụng trong component
// setPosts và setSelectedPost sẽ được dùng với dispatch
export const { setPosts, setSelectedPost } = postSlice.actions;

// Xuất reducer để thêm vào store của Redux
// Đây là hàm reducer tổng của slice này
export default postSlice.reducer;