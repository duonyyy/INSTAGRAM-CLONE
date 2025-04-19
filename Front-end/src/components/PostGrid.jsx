import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';

const PostGrid = ({ posts, onPostClick }) => {
  if (!posts?.length) {
    return (
      <div className="col-span-3 text-center py-10">
        No posts yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {posts.map((post) => (
        <div key={post?._id} className="relative group cursor-pointer">
          <img
            onClick={() => onPostClick(post)}
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
      ))}
    </div>
  );
};

export default PostGrid;
