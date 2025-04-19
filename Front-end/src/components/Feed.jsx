// components/Feed.jsx
import React from 'react';
import Posts from './Posts';

const Feed = () => {
  return (
    <div className="flex-1 my-4 flex flex-col items-center px-4 sm:px-6 md:px-8 lg:pl-[18%] xl:pl-[16%]">
      <Posts />
    </div>
  );
};

export default Feed;