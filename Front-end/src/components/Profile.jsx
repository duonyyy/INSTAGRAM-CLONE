import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import useGetUserProfile from '@/hooks/useGetUserProfile';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AtSign } from 'lucide-react';
import { setSelectedPost } from '@/redux/postSlice';
import { setAuthUser, setUserProfile } from '@/redux/authSlice';
import CommentDialog from './CommentDialog';
import PostGrid from './PostGrid';
import { toast } from 'sonner';
import axios from 'axios';

const ProfileTabs = ({ activeTab, onTabChange }) => (
  <div className="flex items-center justify-center gap-10 text-sm">
    {['POSTS', 'SAVED', 'REELS', 'TAGS'].map((tab) => (
      <span
        key={tab}
        className={`py-3 cursor-pointer ${
          activeTab === tab.toLowerCase() ? 'font-bold border-t border-black' : ''
        }`}
        onClick={() => onTabChange(tab.toLowerCase())}
      >
        {tab}
      </span>
    ))}
  </div>
);

const ProfileActions = ({ isLoggedInUser, isFollowing, isLoading, onFollow }) => (
  isLoggedInUser ? (
    <div className="flex gap-2">
      <Link to="/account/edit">
        <Button variant="secondary" className="hover:bg-gray-200 h-8">
          Edit profile
        </Button>
      </Link>
      <Button variant="secondary" className="hover:bg-gray-200 h-8">
        View archive
      </Button>
      <Button variant="secondary" className="hover:bg-gray-200 h-8">
        Ad tools
      </Button>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button
        className={`h-8 ${
          isFollowing
            ? 'bg-gray-200 hover:bg-gray-300 text-black'
            : 'bg-[#0095F6] hover:bg-[#3192d2] text-white'
        }`}
        onClick={onFollow}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
      </Button>
      {isFollowing && (
        <Button variant="secondary" className="h-8" disabled={isLoading}>
          Message
        </Button>
      )}
    </div>
  )
);

const Profile = () => {
  const params = useParams();
  const userId = params.id;
  useGetUserProfile(userId);

  const [activeTab, setActiveTab] = useState(() => 
    localStorage.getItem('activeProfileTab') || 'posts'
  );
  const [open, setOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { userProfile, user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();

  const isLoggedInUserProfile = user?._id === userProfile?._id;

  useEffect(() => {
    if (userProfile && user) {
      setIsFollowing(userProfile.followers?.includes(user._id) || false);
    }
  }, [userProfile, user]);

  useEffect(() => {
    localStorage.setItem('activeProfileTab', activeTab);
  }, [activeTab]);

  const handleFollow = async () => {
    if (!userProfile?._id) return;
    
    setIsLoading(true);
    try {
      const res = await axios.post(
        `http://localhost:8080/api/v1/user/followorunfollow/${userProfile._id}`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        const newIsFollowing = !isFollowing;
        setIsFollowing(newIsFollowing);

        // Update Redux state
        dispatch(setAuthUser({
          ...user,
          following: newIsFollowing
            ? [...user.following, userProfile._id]
            : user.following.filter(id => id !== userProfile._id)
        }));

        dispatch(setUserProfile({
          ...userProfile,
          followers: newIsFollowing
            ? [...userProfile.followers, user._id]
            : userProfile.followers.filter(id => id !== user._id)
        }));
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to follow/unfollow');
      console.error('Follow/unfollow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!userProfile) {
    return <div className="text-center py-10">Loading profile...</div>;
  }

  const displayedPosts = activeTab === 'posts' ? userProfile?.posts : userProfile?.bookmarks;

  return (
    <div className="flex max-w-5xl justify-center mx-auto pl-10">
      <div className="flex flex-col gap-20 p-8 w-full">
        <div className="grid grid-cols-2 gap-8">
          <section className="flex items-center justify-center">
            <Avatar className="h-32 w-32">
              <AvatarImage src={userProfile.profilePicture} alt="profilephoto" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </section>
          
          <section className="flex flex-col gap-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{userProfile.username}</span>
              <ProfileActions
                isLoggedInUser={isLoggedInUserProfile}
                isFollowing={isFollowing}
                isLoading={isLoading}
                onFollow={handleFollow}
              />
            </div>

            <div className="flex items-center gap-4">
              <p><span className="font-semibold">{userProfile.posts?.length || 0} </span>posts</p>
              <p><span className="font-semibold">{userProfile.followers?.length || 0} </span>followers</p>
              <p><span className="font-semibold">{userProfile.following?.length || 0} </span>following</p>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-semibold">{userProfile.bio || 'Bio here...'}</span>
              <Badge className="w-fit" variant="secondary">
                <AtSign className="h-3 w-3" />
                <span className="pl-1">{userProfile.username}</span>
              </Badge>
            </div>
          </section>
        </div>

        <div className="border-t border-t-gray-200">
          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
          <PostGrid
            posts={displayedPosts}
            onPostClick={(post) => {
              dispatch(setSelectedPost(post));
              setOpen(true);
            }}
          />
        </div>
      </div>
      <CommentDialog open={open} setOpen={setOpen} />
    </div>
  );
};

export default Profile;
