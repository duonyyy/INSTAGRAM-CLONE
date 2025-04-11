import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Bookmark, MessageCircle, MoreHorizontal, Send } from 'lucide-react';
import { Button } from './ui/button';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import CommentDialog from './CommentDialog';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'sonner';
import { setPosts, setSelectedPost } from '@/redux/postSlice';
import { Badge } from './ui/badge';
import debounce from 'lodash/debounce';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Post = ({ post }) => {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const { user } = useSelector((store) => store.auth);
  const { posts } = useSelector((store) => store.post);
  const [liked, setLiked] = useState(post.likes.includes(user?._id) || false);
  const [postLike, setPostLike] = useState(post.likes.length);
  const [comment, setComment] = useState(post.comments);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const dispatch = useDispatch();

  const changeEventHandler = (e) => {
    const inputText = e.target.value;
    setText(inputText.trim() ? inputText : '');
  };

  // Hàm cơ bản cho like/dislike
  const likeOrDislikeHandlerBase = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const originalLiked = liked;
    const originalPostLike = postLike;
    const originalPosts = [...posts];
    const updatedLikes = liked ? postLike - 1 : postLike + 1;
    setPostLike(updatedLikes);
    setLiked(!liked);
    const updatedPostData = posts.map((p) =>
      p._id === post._id
        ? {
            ...p,
            likes: liked
              ? p.likes.filter((id) => id !== user._id)
              : [...p.likes, user._id],
          }
        : p
    );
    dispatch(setPosts(updatedPostData));
    try {
      const action = originalLiked ? 'dislike' : 'like';
      const res = await axios.get(
        `http://localhost:8080/api/v1/post/${post._id}/${action}`,
        { withCredentials: true }
      );
      if (!res.data.success) {
        setPostLike(originalPostLike);
        setLiked(originalLiked);
        dispatch(setPosts(originalPosts));
        toast.error(res.data.message || 'Failed to update like status.');
      }
    } catch (error) {
      console.error('Error in like/dislike:', error);
      setPostLike(originalPostLike);
      setLiked(originalLiked);
      dispatch(setPosts(originalPosts));
      const errorMessage =
        error.response?.status === 401
          ? 'Please log in to like this post.'
          : error.response?.data?.message || 'Failed to update like status.';
      toast.error(errorMessage);
    } finally {
      setIsLiking(false);
    }
  };

  const likeOrDislikeHandler = debounce(likeOrDislikeHandlerBase, 300);
  const commentHandlerBase = async () => {
    if (!user) {
      toast.error('Please log in to comment.');
      return;
    }
    if (isCommenting || !text.trim()) return;
    setIsCommenting(true);
    const originalComments = [...comment];
    const originalPosts = [...posts];
    const tempComment = { text, author: user, createdAt: new Date() };
    const updatedCommentData = [...comment, tempComment];
    setComment(updatedCommentData);
    const updatedPostData = posts.map((p) =>
      p._id === post._id ? { ...p, comments: updatedCommentData } : p
    );
    dispatch(setPosts(updatedPostData));
    setText('');
    try {
      const res = await axios.post(
        `http://localhost:8080/api/v1/post/${post._id}/comment`,
        { text },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        setComment([...originalComments, res.data.comment]);
        dispatch(
          setPosts(
            posts.map((p) =>
              p._id === post._id
                ? { ...p, comments: [...originalComments, res.data.comment] }
                : p
            )
          )
        );
        toast.success(res.data.message);
      } else throw new Error(res.data.message);
    } catch (error) {
      console.error('Error adding comment:', error);
      setComment(originalComments);
      dispatch(setPosts(originalPosts));
      toast.error(error.message || 'Failed to add comment.');
    } finally {
      setIsCommenting(false);
    }
  };

  const commentHandler = debounce(commentHandlerBase, 300);

  const deletePostHandler = () => {
    if (!user || user._id !== post.author?._id) {
      toast.error('You are not authorized to delete this post.');
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleteModalOpen(false);
    setIsLoading(true);
    const originalPosts = [...posts];
    const updatedPostData = posts.filter((p) => p._id !== post._id);
    dispatch(setPosts(updatedPostData));
    try {
      const res = await axios.delete(
        `http://localhost:8080/api/v1/post/delete/${post._id}`,
        { withCredentials: true }
      );
      if (!res.data.success) throw new Error(res.data.message);
      toast.success(res.data.message);
    } catch (error) {
      console.error('Error deleting post:', error);
      dispatch(setPosts(originalPosts));
      toast.error(error.message || 'Failed to delete post.');
    } finally {
      setIsLoading(false);
    }
  };

  const bookmarkHandlerBase = async () => {
    if (!user) {
      toast.error('Please log in to bookmark this post.');
      return;
    }
    if (isBookmarking) return;
    setIsBookmarking(true);
    try {
      const res = await axios.get(
        `http://localhost:8080/api/v1/post/${post._id}/bookmark`,
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
      } else throw new Error(res.data.message);
    } catch (error) {
      console.error('Error bookmarking post:', error);
      toast.error(error.message || 'Failed to bookmark post.');
    } finally {
      setIsBookmarking(false);
    }
  };

  const bookmarkHandler = debounce(bookmarkHandlerBase, 300);

  if (!post) return null;

  return (
    <div className="my-8 w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={post.author?.profilePicture} alt="post_author" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-3">
            <h1>{post.author?.username || 'Unknown'}</h1>
            {user?._id === post.author?._id && (
              <Badge variant="secondary">Author</Badge>
            )}
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <MoreHorizontal className="cursor-pointer" />
          </DialogTrigger>
          <DialogContent className="flex flex-col items-center text-sm text-center">
            <Button
              variant="ghost"
              className="cursor-pointer w-fit"
              onClick={bookmarkHandler}
              disabled={isBookmarking}
            >
              {isBookmarking ? 'Bookmarking...' : 'Add to favorites'}
            </Button>
            {user?._id === post.author?._id && (
              <Button
                onClick={deletePostHandler}
                variant="ghost"
                className="cursor-pointer w-fit"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </Button>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Swiper
        style={{
          '--swiper-navigation-color': '#fff',
          '--swiper-pagination-color': '#fff',
        }}
        pagination={{ clickable: true }}
        modules={[Navigation, Pagination]}
        className="mySwiper my-2 w-full aspect-square"
      >
        {post.images?.length > 0 ? (
          post.images.map((image, index) => (
            <SwiperSlide key={index}>
              <img  onClick={() => {
              dispatch(setSelectedPost(post));
              setOpen(true);
            }}
                className="rounded-sm w-full h-full object-cover"
                src={image}
                alt={`post_img_${index}`}
              />
            </SwiperSlide>
          ))
        ) : (
          <SwiperSlide>
            <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-sm">
              <span>No images available</span>
            </div>
          </SwiperSlide>
        )}
      </Swiper>

      <div className="flex items-center justify-between my-2">
        <div className="flex items-center gap-3">
          {liked ? (
            <FaHeart
              onClick={likeOrDislikeHandler}
              size="22px"
              className={`cursor-pointer text-red-600 ${
                isLiking ? 'opacity-50' : ''
              }`}
            />
          ) : (
            <FaRegHeart
              onClick={likeOrDislikeHandler}
              size="22px"
              className={`cursor-pointer hover:text-gray-600 ${
                isLiking ? 'opacity-50' : ''
              }`}
            />
          )}
          <MessageCircle
            onClick={() => {
              dispatch(setSelectedPost(post));
              setOpen(true);
            }}
            className="cursor-pointer hover:text-gray-600"
          />
          <Send className="cursor-pointer hover:text-gray-600" />
        </div>
        <Bookmark
          onClick={bookmarkHandler}
          className={`cursor-pointer hover:text-gray-600 ${
            isBookmarking ? 'opacity-50' : ''
          }`}
        />
      </div>
      <span className="font-medium block mb-2">{postLike} likes</span>
      <p>
        <span className="font-medium mr-2">
          {post.author?.username || 'Unknown'}
        </span>
        {post.caption}
      </p>
      {comment.length > 0 && (
        <span
          onClick={() => {
            dispatch(setSelectedPost(post));
            setOpen(true);
          }}
          className="cursor-pointer text-sm text-gray-400"
        >
          View all {comment.length} comments
        </span>
      )}
      <CommentDialog open={open} setOpen={setOpen} />
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Add a comment..."
          value={text}
          onChange={changeEventHandler}
          className="outline-none text-sm w-full"
          disabled={isCommenting}
        />
        {text && (
          <span
            onClick={commentHandler}
            className={`text-[#3BADF8] ${
              isCommenting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isCommenting ? 'Posting...' : 'Post'}
          </span>
        )}
      </div>
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Delete Post?</h2>
            <p className="text-sm text-gray-500 mt-2">
              Are you sure you want to delete this post? This action cannot be
              undone.
            </p>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Post;
