import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { readFileAsDataURL } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux'; // Hook Redux để truy cập store và dispatch action
import { setPosts } from '@/redux/postSlice';
//import { setPosts } from '@/redux/postSlice'; // Action để cập nhật danh sách bài post trong Redux store

const CreatePost = ({ open, setOpen }) => {
  const imageRef = useRef();
  const [file, setFile] = useState('');
  const [caption, setCaption] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((store) => store.auth); // Lấy thông tin user từ Redux store (auth slice)
  const { posts } = useSelector((store) => store.post); // Lấy danh sách posts từ Redux store (post slice)
  const dispatch = useDispatch(); // Hàm dispatch để gửi action tới Redux store

  const fileChangeHandler = async (e) => {
    // Xử lý khi người dùng chọn file
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const dataUrl = await readFileAsDataURL(file);
      setImagePreview(dataUrl);
    }
  };

  const createPostHandler = async () => {
    const formData = new FormData();
    formData.append('caption', caption);
    if (imagePreview) formData.append('image', file); // Nếu có ảnh preview, thêm file gốc vào FormData
    try {
      setLoading(true);
      const res = await axios.post(
        'http://localhost:8080/api/v1/post/addpost',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true, // Gửi cookie/credentials để xác thực (nếu cần)
        }
      );
      if (res.data.success) {
        // Nếu API trả về thành công
        dispatch(setPosts([res.data.post, ...posts])); // Thêm bài post mới vào đầu danh sách posts trong Redux
        toast.success(res.data.message);
        setOpen(false);
      }
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent onInteractOutside={() => setOpen(false)}>
        <DialogHeader className="text-center font-semibold">
          Create New Post
        </DialogHeader>
        <div className="flex gap-3 items-center">
          <Avatar>
            <AvatarImage src={user?.profilePicture} alt="img" />{' '}
            <AvatarFallback>CN</AvatarFallback>{' '}
          </Avatar>
          <div>
            <h1 className="font-semibold text-xs">{user?.username}</h1>{' '}
            <span className="text-gray-600 text-xs">Bio here...</span>{' '}
            {/* Bio mặc định */}
          </div>
        </div>
        <Textarea
          value={caption} // Giá trị caption từ state
          onChange={(e) => setCaption(e.target.value)}
          className="focus-visible:ring-transparent border-none"
          placeholder="Write a caption..."
        />
        {imagePreview && (
          <div className="w-full h-64 flex items-center justify-center">
            <img
              src={imagePreview}
              alt="preview_img"
              className="object-cover h-full w-full rounded-md"
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
          className="w-fit mx-auto bg-[#0095F6] hover:bg-[#258bcf] "
        >
          Select from computer
        </Button>
        {imagePreview && // Nếu có ảnh preview thì hiển thị nút Post hoặc loading
          (loading ? (
            <Button>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
            </Button>
          ) : (
            <Button
              onClick={createPostHandler}
              type="submit"
              className="w-full"
            >
              Post
            </Button>
          ))}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePost;
