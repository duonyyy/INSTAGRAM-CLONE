import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { readFileAsDataURL } from '@/lib/utils'; // Hàm tiện ích để đọc file thành Data URL (base64)
import { Loader2 } from 'lucide-react'; // Icon loading từ thư viện Lucide
import { toast } from 'sonner'; // Thư viện hiển thị thông báo (toast)
import axios from 'axios'; // Thư viện để gửi request HTTP
import { useDispatch, useSelector } from 'react-redux'; // Hook Redux để truy cập store và dispatch action
import { setPosts } from '@/redux/postSlice'; // Action để cập nhật danh sách bài post trong Redux store

const CreatePost = ({ open, setOpen }) => {
  // open: trạng thái hiển thị Dialog, setOpen: hàm để đóng/mở Dialog từ parent component
  const imageRef = useRef(); // Tạo ref để tham chiếu tới input file ẩn
  const [file, setFile] = useState(''); // Lưu trữ file gốc được chọn từ input
  const [caption, setCaption] = useState(''); // Lưu trữ nội dung caption người dùng nhập
  const [imagePreview, setImagePreview] = useState(''); // Lưu trữ chuỗi Data URL để hiển thị ảnh preview
  const [loading, setLoading] = useState(false); // Trạng thái loading khi gửi request
  const { user } = useSelector((store) => store.auth); // Lấy thông tin user từ Redux store (auth slice)
  const { posts } = useSelector((store) => store.post); // Lấy danh sách posts từ Redux store (post slice)
  const dispatch = useDispatch(); // Hàm dispatch để gửi action tới Redux store

  const fileChangeHandler = async (e) => {
    // Xử lý khi người dùng chọn file
    const file = e.target.files?.[0]; // Lấy file đầu tiên từ input (nếu có)
    if (file) {
      setFile(file); // Lưu file gốc vào state
      const dataUrl = await readFileAsDataURL(file); // Chuyển file thành Data URL bằng hàm tiện ích
      setImagePreview(dataUrl); // Cập nhật state để hiển thị ảnh preview
    }
  };

  const createPostHandler = async () => {
    // Xử lý tạo bài post mới
    const formData = new FormData(); // Tạo FormData để gửi dữ liệu multipart (text + file)
    formData.append('caption', caption); // Thêm caption vào FormData
    if (imagePreview) formData.append('image', file); // Nếu có ảnh preview, thêm file gốc vào FormData
    try {
      setLoading(true); // Bật trạng thái loading
      const res = await axios.post(
        'http://localhost:8080/api/v1/post/addpost', // Gửi POST request tới API endpoint
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data', // Định dạng multipart cho file upload
          },
          withCredentials: true, // Gửi cookie/credentials để xác thực (nếu cần)
        }
      );
      if (res.data.success) {
        // Nếu API trả về thành công
        dispatch(setPosts([res.data.post, ...posts])); // Thêm bài post mới vào đầu danh sách posts trong Redux
        toast.success(res.data.message); // Hiển thị thông báo thành công
        setOpen(false); // Đóng Dialog
      }
    } catch (error) {
      // Xử lý lỗi
      toast.error(error.response.data.message); // Hiển thị thông báo lỗi từ server
    } finally {
      setLoading(false); // Tắt trạng thái loading dù thành công hay thất bại
    }
  };

  return (
    <Dialog open={open}> {/* Dialog hiển thị dựa trên prop open */}
      <DialogContent onInteractOutside={() => setOpen(false)}> {/* Đóng Dialog khi click ra ngoài */}
        <DialogHeader className="text-center font-semibold">
          Create New Post {/* Tiêu đề của Dialog */}
        </DialogHeader>
        <div className="flex gap-3 items-center">
          {/* Hiển thị avatar và thông tin user */}
          <Avatar>
            <AvatarImage src={user?.profilePicture} alt="img" /> {/* Ảnh profile từ Redux */}
            <AvatarFallback>CN</AvatarFallback> {/* Hiển thị chữ cái đầu nếu không có ảnh */}
          </Avatar>
          <div>
            <h1 className="font-semibold text-xs">{user?.username}</h1> {/* Tên user */}
            <span className="text-gray-600 text-xs">Bio here...</span> {/* Bio mặc định */}
          </div>
        </div>
        <Textarea
          value={caption} // Giá trị caption từ state
          onChange={(e) => setCaption(e.target.value)} // Cập nhật caption khi người dùng nhập
          className="focus-visible:ring-transparent border-none" // Style cho Textarea
          placeholder="Write a caption..." // Placeholder
        />
        {imagePreview && ( // Nếu có ảnh preview thì hiển thị
          <div className="w-full h-64 flex items-center justify-center">
            <img
              src={imagePreview} // Nguồn ảnh từ Data URL
              alt="preview_img"
              className="object-cover h-full w-full rounded-md" // Style ảnh
            />
          </div>
        )}
        <input
          ref={imageRef} // Gắn ref để điều khiển input file
          type="file"
          className="hidden" // Ẩn input file
          onChange={fileChangeHandler} // Gọi hàm xử lý khi chọn file
        />
        <Button
          onClick={() => imageRef.current.click()} // Mở file explorer khi click button
          className="w-fit mx-auto bg-[#0095F6] hover:bg-[#258bcf] " // Style button
        >
          Select from computer
        </Button>
        {imagePreview && // Nếu có ảnh preview thì hiển thị nút Post hoặc loading
          (loading ? ( // Nếu đang loading
            <Button>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {/* Icon loading */}
              Please wait
            </Button>
          ) : ( // Nếu không loading
            <Button
              onClick={createPostHandler} // Gọi hàm tạo post
              type="submit"
              className="w-full" // Style button
            >
              Post
            </Button>
          ))}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePost;