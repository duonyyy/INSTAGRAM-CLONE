import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { readFileAsDataURL } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "@/redux/postSlice";

const CreatePost = ({ open, setOpen }) => {
  const imageRef = useRef();
  const [files, setFiles] = useState([]); // Lưu mảng các file
  const [caption, setCaption] = useState("");
  const [imagePreviews, setImagePreviews] = useState([]); // Lưu mảng các URL preview
  const [loading, setLoading] = useState(false);
  const { user } = useSelector((store) => store.auth);
  const { posts } = useSelector((store) => store.post);
  const dispatch = useDispatch();

  const fileChangeHandler = async (e) => {
    const selectedFiles = Array.from(e.target.files); // Chuyển FileList thành mảng
    if (selectedFiles.length > 10) {
      toast.error("You can only upload up to 10 images");
      return;
    }

    setFiles(selectedFiles); // Lưu mảng file

    // Tạo URL preview cho từng file
    const previews = await Promise.all(
      selectedFiles.map(async (file) => {
        return await readFileAsDataURL(file);
      })
    );
    setImagePreviews(previews);
  };

  const createPostHandler = async () => {
    const formData = new FormData();
    formData.append("caption", caption);
    if (files.length > 0) {
      files.forEach((file) => {
        formData.append("images", file); 
      });
    } else {
      toast.error("Please select at least one image");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:8080/api/v1/post/addpost",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        dispatch(setPosts([res.data.post, ...posts]));
        toast.success(res.data.message);
        setOpen(false);
        // Reset state sau khi đăng bài
        setFiles([]);
        setImagePreviews([]);
        setCaption("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create post");
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
            <AvatarImage src={user?.profilePicture} alt="img" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold text-xs">{user?.username}</h1>
            <span className="text-gray-600 text-xs">Bio here...</span>
          </div>
        </div>
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="focus-visible:ring-transparent border-none"
          placeholder="Write a caption..."
        />
        {imagePreviews.length > 0 && (
          <div className="w-full flex flex-wrap gap-2">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="w-32 h-32">
                <img
                  src={preview}
                  alt={`preview-${index}`}
                  className="object-cover w-full h-full rounded-md"
                />
              </div>
            ))}
          </div>
        )}
        <input
          ref={imageRef}
          type="file"
          accept="image/jpeg,image/png,image/gif" // Chỉ cho phép ảnh
          multiple // Cho phép chọn nhiều file
          className="hidden"
          onChange={fileChangeHandler}
        />
        <Button
          onClick={() => imageRef.current.click()}
          className="w-fit mx-auto bg-[#0095F6] hover:bg-[#258bcf]"
        >
          Select from computer
        </Button>
        {imagePreviews.length > 0 &&
          (loading ? (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
            </Button>
          ) : (
            <Button onClick={createPostHandler} type="submit" className="w-full">
              Post
            </Button>
          ))}
      </DialogContent>
    </Dialog>
  );
};

export default CreatePost;