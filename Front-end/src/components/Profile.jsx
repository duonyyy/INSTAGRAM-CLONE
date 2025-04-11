import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import useGetUserProfile from '@/hooks/useGetUserProfile';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AtSign, Heart, MessageCircle } from 'lucide-react';
import { setSelectedPost } from '@/redux/postSlice';
import { setAuthUser, setUserProfile } from '@/redux/authSlice'; // Thêm setUserProfile
import CommentDialog from './CommentDialog';
import { toast } from 'sonner';
import axios from 'axios';

const Profile = () => {
  const params = useParams();
  const userId = params.id;
  useGetUserProfile(userId);

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeProfileTab') || 'posts';
  });
  const [open, setOpen] = useState(false);
  const { userProfile, user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();

  const isLoggedInUserProfile = user?._id === userProfile?._id;
  const [isFollowing, setIsFollowing] = useState(false); // Khởi tạo false, sẽ cập nhật trong useEffect
  const [isLoading, setIsLoading] = useState(false); // Trạng thái loading cho nút

  // Cập nhật isFollowing khi userProfile hoặc user thay đổi
  useEffect(() => {
    if (userProfile && user) {
      setIsFollowing(userProfile.followers?.includes(user._id) || false);
    }
  }, [userProfile, user]);

  // Lưu activeTab vào localStorage
  useEffect(() => {
    localStorage.setItem('activeProfileTab', activeTab);
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const displayedPost =
    activeTab === 'posts' ? userProfile?.posts : userProfile?.bookmarks;

  const handleFollow = async (targetUserId) => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        `http://localhost:8080/api/v1/user/followorunfollow/${targetUserId}`, // Endpoint sửa lại
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(res.data.message);

        // Toggle trạng thái isFollowing
        const newIsFollowing = !isFollowing;
        setIsFollowing(newIsFollowing);

        // Cập nhật Redux cho user hiện tại
        const updatedUser = {
          ...user,
          following: newIsFollowing
            ? [...user.following, targetUserId]
            : user.following.filter((id) => id !== targetUserId),
        };
        dispatch(setAuthUser(updatedUser));

        // Cập nhật Redux cho userProfile
        const updatedUserProfile = {
          ...userProfile,
          followers: newIsFollowing
            ? [...userProfile.followers, user._id]
            : userProfile.followers.filter((id) => id !== user._id),
        };
        dispatch(setUserProfile(updatedUserProfile));
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to follow/unfollow');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userProfile) {
    return <div className="text-center py-10">Loading profile...</div>;
  }

  return (
    <div className="flex max-w-5xl justify-center mx-auto pl-10">
      <div className="flex flex-col gap-20 p-8 w-full">
        <div className="grid grid-cols-2 gap-8">
          <section className="flex items-center justify-center">
            <Avatar className="h-32 w-32">
              <AvatarImage
                src={userProfile.profilePicture}
                alt="profilephoto"
              />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </section>
          <section>
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{userProfile.username}</span>
                {isLoggedInUserProfile ? (
                  <>
                    <Link to="/account/edit">
                      <Button
                        variant="secondary"
                        className="hover:bg-gray-200 h-8"
                      >
                        Edit profile
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      className="hover:bg-gray-200 h-8"
                    >
                      View archive
                    </Button>
                    <Button
                      variant="secondary"
                      className="hover:bg-gray-200 h-8"
                    >
                      Ad tools
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className={`h-8 ${
                        isFollowing
                          ? 'bg-gray-200 hover:bg-gray-300 text-black'
                          : 'bg-[#0095F6] hover:bg-[#3192d2] text-white'
                      }`}
                      onClick={() => handleFollow(userProfile._id)}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? 'Loading...'
                        : isFollowing
                        ? 'Unfollow'
                        : 'Follow'}
                    </Button>
                    {isFollowing && (
                      <Button
                        variant="secondary"
                        className="h-8"
                        disabled={isLoading}
                      >
                        Message
                      </Button>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                <p>
                  <span className="font-semibold">
                    {userProfile.posts?.length || 0}{' '}
                  </span>
                  posts
                </p>
                <p>
                  <span className="font-semibold">
                    {userProfile.followers?.length || 0}{' '}
                  </span>
                  followers
                </p>
                <p>
                  <span className="font-semibold">
                    {userProfile.following?.length || 0}{' '}
                  </span>
                  following
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-semibold">
                  {userProfile.bio || 'Bio here...'}
                </span>
                <Badge className="w-fit" variant="secondary">
                  <AtSign className="h-3 w-3" />
                  <span className="pl-1">{userProfile.username}</span>
                </Badge>
              </div>
            </div>
          </section>
        </div>
        <div className="border-t border-t-gray-200">
          <div className="flex items-center justify-center gap-10 text-sm">
            <span
              className={`py-3 cursor-pointer ${
                activeTab === 'posts' ? 'font-bold border-t border-black' : ''
              }`}
              onClick={() => handleTabChange('posts')}
            >
              POSTS
            </span>
            <span
              className={`py-3 cursor-pointer ${
                activeTab === 'saved' ? 'font-bold border-t border-black' : ''
              }`}
              onClick={() => handleTabChange('saved')}
            >
              SAVED
            </span>
            <span className="py-3 cursor-pointer">REELS</span>
            <span className="py-3 cursor-pointer">TAGS</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {displayedPost?.length > 0 ? (
              displayedPost.map((post) => (
                <div key={post?._id} className="relative group cursor-pointer">
                  <img
                    onClick={() => {
                      dispatch(setSelectedPost(post));
                      setOpen(true);
                    }}
                    src={post.images?.[0] || ''}
                    alt="postimage"
                    className="my-2 w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center text-white space-x-4">
                      <button className="flex items-center gap-2 hover:text-gray-300">
                        <Heart fill="white" stroke="none" />
                        <span>{post?.likes?.length || 0}</span>
                      </button>
                      <button className="flex items-center gap-2 hover:text-gray-300">
                        <MessageCircle fill="white" stroke="none" />
                        <span>{post?.comments?.length || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                No {activeTab === 'posts' ? 'posts' : 'saved posts'} yet.
              </div>
            )}
          </div>
        </div>
      </div>
      <CommentDialog open={open} setOpen={setOpen} />
    </div>
  );
};

export default Profile;
