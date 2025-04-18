import {
  Heart,
  Home,
  LogOut,
  MessageCircle,
  PlusSquare,
  Search,
  TrendingUp,
  Menu,
} from 'lucide-react';
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { toast } from 'sonner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthUser } from '@/redux/authSlice';
import CreatePost from './CreatePost';
import { setPosts, setSelectedPost } from '@/redux/postSlice';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import logo from '../assets/logov3.svg';

const LeftSidebar = () => {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const { notifications } = useSelector((store) => store.notifications);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Trạng thái cho sidebar trên mobile

  const logoutHandler = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/v1/user/logout', {
        withCredentials: true,
      });
      if (res.data.success) {
        dispatch(setAuthUser(null));
        dispatch(setSelectedPost(null));
        dispatch(setPosts([]));
        navigate('/login');
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  const sidebarHandler = (textType) => {
    if (textType === 'Logout') logoutHandler();
    else if (textType === 'Create') setOpen(true);
    else if (textType === 'Profile') navigate(`/profile/${user?._id}`);
    else if (textType === 'Home') navigate('/');
    else if (textType === 'Messages') navigate('/chat');
    setIsSidebarOpen(false); // Đóng sidebar trên mobile sau khi chọn
  };

  const notificationHandler = (notification) => {
    if (notification.type === 'follow') {
      navigate(`/profile/${notification.userId}`);
    } else if (notification.postId) {
      navigate(`/post/${notification.postId}`);
    }
  };

  const sidebarItems = [
    { icon: <Home />, text: 'Home' },
    { icon: <Search />, text: 'Search' },
    { icon: <TrendingUp />, text: 'Explore' },
    { icon: <MessageCircle />, text: 'Messages' },
    { icon: <Heart />, text: 'Notifications' },
    { icon: <PlusSquare />, text: 'Create' },
    {
      icon: (
        <Avatar className="w-6 h-6">
          <AvatarImage src={user?.profilePicture} alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      ),
      text: 'Profile',
    },
    { icon: <LogOut />, text: 'Logout' },
  ];

  return (
    <>
      {/* Nút Hamburger cho mobile */}
      <div className="md:hidden fixed top-4 left-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-10 h-screen bg-white border-r border-gray-300 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:w-[16%] w-64`}
      >
        <div className="flex flex-col h-full px-4">
          <h1 className="my-4 pl-14 font-bold text-xl">
            <img src={logo} alt="Social Network Logo" width={58} height={58} />
          </h1>
          <div className="flex-1">
            {sidebarItems.map((item, index) => (
              <div
                onClick={() => sidebarHandler(item.text)}
                key={index}
                className="flex items-center gap-3 relative hover:bg-gray-100 cursor-pointer rounded-lg p-3 my-3"
              >
                {item.icon}
                <span>{item.text}</span>
                {item.text === 'Notifications' && notifications.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        size="icon"
                        className="rounded-full h-5 w-5 bg-red-600 hover:bg-red-600 absolute bottom-6 left-6"
                      >
                        {notifications.length}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 max-w-[90vw]">
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-center">No new notifications</p>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer"
                              onClick={() => notificationHandler(notification)}
                            >
                              <Avatar>
                                <AvatarImage
                                  src={notification.userDetails?.profilePicture}
                                />
                                <AvatarFallback>CN</AvatarFallback>
                              </Avatar>
                              <p className="text-sm">
                                <span className="font-bold">
                                  {notification.userDetails?.username}
                                </span>{' '}
                                {notification.type === 'like'
                                  ? 'liked your post'
                                  : notification.type === 'comment'
                                  ? `commented: ${
                                      notification.message.split(': ')[1]
                                    }`
                                  : 'started following you'}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            ))}
          </div>
        </div>
        <CreatePost open={open} setOpen={setOpen} />
      </div>

      {/* Overlay khi sidebar mở trên mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-0 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default LeftSidebar;