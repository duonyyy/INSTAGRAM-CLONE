import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import axios from "axios";
import { toast } from "sonner";
import { setAuthUser } from "@/redux/authSlice"; // Giả định action để cập nhật user trong Redux

const SuggestedUsers = () => {
  const { suggestedUsers, user } = useSelector((store) => store.auth); // Lấy user hiện tại
  const dispatch = useDispatch();
  const [followingStatus, setFollowingStatus] = useState({}); // Lưu trạng thái follow cho từng user

  // Khởi tạo trạng thái follow ban đầu từ dữ liệu user
  React.useEffect(() => {
    if (user && suggestedUsers) {
      const initialStatus = {};
      suggestedUsers.forEach((suggestedUser) => {
        initialStatus[suggestedUser._id] = user.following?.includes(suggestedUser._id) || false;
      });
      setFollowingStatus(initialStatus);
    }
  }, [user, suggestedUsers]);

  // Nếu không có suggestedUsers hoặc không phải mảng
  if (!Array.isArray(suggestedUsers) || suggestedUsers.length === 0) {
    return (
      <div className="my-10">
        <div className="flex items-center justify-between text-sm">
          <h1 className="font-semibold text-gray-600">Suggested for you</h1>
          <span className="font-medium cursor-pointer">See All</span>
        </div>
        <p className="text-gray-600 text-sm mt-5">No suggested users available.</p>
      </div>
    );
  }

  const handleFollow = async (targetUserId) => {
    try {
      const res = await axios.post(
        
        `http://localhost:8080/api/v1/user/followorunfollow/${targetUserId}`,
        {},
        { withCredentials: true } // Gửi cookie để xác thực
      );

      if (res.data.success) {
        toast.success(res.data.message);
        // Cập nhật trạng thái follow cục bộ
        setFollowingStatus((prev) => ({
          ...prev,
          [targetUserId]: !prev[targetUserId], // Toggle trạng thái
        }));

        // Cập nhật Redux (auth user) để đồng bộ danh sách following
        const updatedUser = {
          ...user,
          following: res.data.message.includes("Unfollowed")
            ? user.following.filter((id) => id !== targetUserId)
            : [...user.following, targetUserId],
        };
        dispatch(setAuthUser(updatedUser));
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to follow/unfollow");
      console.error(error);
    }
  };

  return (
    <div className="my-10">
      <div className="flex items-center justify-between text-sm">
        <h1 className="font-semibold text-gray-600">Suggested for you</h1>
        <span className="font-medium cursor-pointer">See All</span>
      </div>
      {suggestedUsers.map((suggestedUser) => {
        const isFollowing = followingStatus[suggestedUser._id] || false;
        return (
          <div key={suggestedUser._id} className="flex items-center justify-between my-5">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${suggestedUser?._id}`}>
                <Avatar>
                  <AvatarImage src={suggestedUser?.profilePicture} alt="post_image" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <h1 className="font-semibold text-sm">
                  <Link to={`/profile/${suggestedUser?._id}`}>
                    {suggestedUser?.username}
                  </Link>
                </h1>
                <span className="text-gray-600 text-sm">
                  {suggestedUser?.bio || "Bio here..."}
                </span>
              </div>
            </div>
            <span
              onClick={() => handleFollow(suggestedUser._id)}
              className={`text-xs font-bold cursor-pointer ${
                isFollowing
                  ? "text-gray-600 hover:text-gray-800"
                  : "text-[#3BADF8] hover:text-[#3495d6]"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default SuggestedUsers;