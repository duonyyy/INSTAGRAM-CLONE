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
  const dispatch = useDispatch();

  const changeEventHandler = (e) => {
    const inputText = e.target.value;
    if (inputText.trim()) {
      setText(inputText);
    } else {
      setText('');
    }
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

  // Hàm cơ bản cho comment
  const commentHandlerBase = async () => {
    if (isCommenting || !text.trim()) return; // Ngăn nếu đang xử lý hoặc text rỗng
    setIsCommenting(true);
    const originalComments = [...comment];
    const originalPosts = [...posts];
    const tempComment = { text, user: user._id, createdAt: new Date() };
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
        const realComment = res.data.comment;
        const finalCommentData = [...originalComments, realComment];
        setComment(finalCommentData);
        const finalPostData = posts.map((p) =>
          p._id === post._id ? { ...p, comments: finalCommentData } : p
        );
        dispatch(setPosts(finalPostData));
        toast.success(res.data.message);
      } else {
        setComment(originalComments);
        dispatch(setPosts(originalPosts));
        toast.error(res.data.message || 'Failed to add comment.');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setComment(originalComments);
      dispatch(setPosts(originalPosts));
      const errorMessage =
        error.response?.status === 401
          ? 'Please log in to comment.'
          : error.response?.status === 400
          ? 'Invalid comment. Please try again.'
          : error.response?.data?.message || 'Failed to add comment.';
      toast.error(errorMessage);
    } finally {
      setIsCommenting(false);
    }
  };

  const commentHandler = debounce(commentHandlerBase, 300);

  const deletePostHandler = async () => {
    if (user?._id !== post.author?._id) {
      toast.error('You are not authorized to delete this post.');
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleteModalOpen(false);
    setIsLoading(true);
    const originalPosts = [...posts];
    const updatedPostData = posts.filter((postItem) => postItem?._id !== post?._id);
    dispatch(setPosts(updatedPostData));
    try {
      const res = await axios.delete(
        `http://localhost:8080/api/v1/post/delete/${post?._id}`,
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        dispatch(setPosts(originalPosts));
        toast.error('Failed to delete post.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      dispatch(setPosts(originalPosts));
      toast.error(error.response?.data?.message || 'Failed to delete post.');
    } finally {
      setIsLoading(false);
    }
  };

  const bookmarkHandler = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/v1/post/${post._id}/bookmark`,
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      toast.error(error.response?.data?.message || 'Failed to bookmark post.');
    }
  };

  return (
    <div className="my-8 w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={post.author?.profilePicture} alt="post_image" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-3">
            <h1>{post.author?.username}</h1>
            {user?._id === post.author._id && (
              <Badge variant="secondary">Author</Badge>
            )}
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <MoreHorizontal className="cursor-pointer" />
          </DialogTrigger>
          <DialogContent className="flex flex-col items-center text-sm text-center">
            {post?.author?._id !== user?._id && (
              <Button
                variant="ghost"
                className="cursor-pointer w-fit text-[#ED4956] font-bold"
              >
                Unfollow
              </Button>
            )}
            <Button variant="ghost" className="cursor-pointer w-fit">
              Add to favorites
            </Button>
            {user && user?._id === post?.author._id && (
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
      <img
        className="rounded-sm my-2 w-full aspect-square object-cover"
        src={post.image}
        alt="post_img"
      />
      <div className="flex items-center justify-between my-2">
        <div className="flex items-center gap-3">
          {liked ? (
            <FaHeart
              onClick={likeOrDislikeHandler}
              size={'22px'}
              className={`cursor-pointer text-red-600 ${isLiking ? 'opacity-50' : ''}`}
            />
          ) : (
            <FaRegHeart
              onClick={likeOrDislikeHandler}
              size={'22px'}
              className={`cursor-pointer hover:text-gray-600 ${isLiking ? 'opacity-50' : ''}`}
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
          className="cursor-pointer hover:text-gray-600"
        />
      </div>
      <span className="font-medium block mb-2">{postLike} likes</span>
      <p>
        <span className="font-medium mr-2">{post.author?.username}</span>
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
          className="outline-none text-sm w-full "
          disabled={isCommenting} // Vô hiệu hóa input khi đang gửi
        />
        {text && (
          <span
            onClick={commentHandler}
            className={`text-[#3BADF8] ${isCommenting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isCommenting ? 'Posting...' : 'Post'}
          </span>
        )}
      </div>

      {/* Dialog cho modal xác nhận xóa */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Delete Post?</h2>
            <p className="text-sm text-gray-500 mt-2">
              Are you sure you want to delete this post? This action cannot be undone.
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