import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { setSelectedUser } from '@/redux/authSlice';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { MessageCircleCode } from 'lucide-react';
import Messages from './Messages';
import axios from 'axios';
import { setMessages } from '@/redux/chatSlice';

const ChatPage = () => {
  const [textMessage, setTextMessage] = useState('');
  const { user, suggestedUsers, selectedUser } = useSelector(
    (store) => store.auth
  );
  const { onlineUsers, messages } = useSelector((store) => store.chat);
  const dispatch = useDispatch();

  const sendMessageHandler = async (receiverId) => {
    try {
      const res = await axios.post(
        `http://localhost:8080/api/v1/message/send/${receiverId}`,
        { textMessage },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        dispatch(setMessages([...messages, res.data.newMessage]));
        setTextMessage('');
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Hàm xử lý sự kiện khi nhấn phím Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Ngăn chặn hành vi mặc định (nếu có, như submit form)
      sendMessageHandler(selectedUser?._id); // Gọi hàm gửi tin nhắn
    }
  };

  useEffect(() => {
    return () => {
      dispatch(setSelectedUser(null));
    };
  }, []);

  return (
    <div className="flex ml-[16%] h-screen">
      <section className="w-full md:w-1/4 my-8">
        <h1 className="font-bold mb-4 px-3 text-xl">{user?.username}</h1>
        <hr className="mb-4 border-gray-300" />
        <div className="overflow-y-auto h-[80vh]">
          {suggestedUsers.map((suggestedUser) => {
            const isOnline = onlineUsers.includes(suggestedUser?._id);
            return (
              <div
                onClick={() => dispatch(setSelectedUser(suggestedUser))}
                className="flex gap-3 items-center p-3 hover:bg-gray-50 cursor-pointer"
              >
                <Avatar className="w-14 h-14">
                  <AvatarImage src={suggestedUser?.profilePicture} />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{suggestedUser?.username}</span>
                  <span
                    className={`text-xs font-bold ${
                      isOnline ? 'text-green-600' : 'text-red-600'
                    } `}
                  >
                    {isOnline ? 'online' : 'offline'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {selectedUser ? (
        <section className="flex-1 border-l border-l-gray-300 flex flex-col h-full">
          <div className="flex gap-3 items-center px-3 py-2 border-b border-gray-300 sticky top-0 bg-white z-10">
            <Avatar>
              <AvatarImage src={selectedUser?.profilePicture} alt="profile" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span>{selectedUser?.username}</span>
            </div>
          </div>
          <Messages selectedUser={selectedUser} />
          <div className="flex items-center p-4 border-t border-t-gray-300">
            <Input
              value={textMessage}
              onChange={(e) => setTextMessage(e.target.value)}
              onKeyDown={handleKeyDown} // Thêm sự kiện onKeyDown
              type="text"
              className="flex-1 mr-2 focus-visible:ring-transparent"
              placeholder="Messages..."
            />
            <Button onClick={() => sendMessageHandler(selectedUser?._id)}>
              Send
            </Button>
          </div>
        </section>
      ) : (
        <div className="flex flex-col items-center justify-center mx-auto">
          <MessageCircleCode className="w-32 h-32 my-4" />
          <h1 className="font-medium">Your messages</h1>
          <span>Send a message to start a chat.</span>
        </div>
      )}
    </div>
  );
};

export default ChatPage;


// const ChatPage = () => {
//   const [textMessage, setTextMessage] = useState('');
//   const { user, suggestedUsers, selectedUser } = useSelector((store) => store.auth);
//   const { onlineUsers, messages } = useSelector((store) => store.chat);
//   const dispatch = useDispatch();

//   const sendMessageHandler = async (receiverId) => {
//     try {
//       const res = await axios.post(
//         `http://localhost:8080/api/v1/message/send/${receiverId}`,
//         { textMessage },
//         {
//           headers: { 'Content-Type': 'application/json' },
//           withCredentials: true,
//         }
//       );
//       if (res.data.success) {
//         dispatch(setMessages([...messages, res.data.newMessage]));
//         setTextMessage('');
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (selectedUser && textMessage.trim()) {
//       sendMessageHandler(selectedUser._id);
//     }
//   };

//   useEffect(() => {
//     return () => {
//       dispatch(setSelectedUser(null));
//     };
//   }, []);

//   return (
//     <div className="flex ml-[16%] h-screen">
//       {/* Phần danh sách người dùng giữ nguyên */}
//       <section className="w-full md:w-1/4 my-8">...</section>

//       {selectedUser ? (
//         <section className="flex-1 border-l border-l-gray-300 flex flex-col h-full">
//           <div className="flex gap-3 items-center px-3 py-2 border-b border-gray-300 sticky top-0 bg-white z-10">
//             <Avatar>
//               <AvatarImage src={selectedUser?.profilePicture} alt="profile" />
//               <AvatarFallback>CN</AvatarFallback>
//             </Avatar>
//             <div className="flex flex-col">
//               <span>{selectedUser?.username}</span>
//             </div>
//           </div>
//           <Messages selectedUser={selectedUser} />
//           <form onSubmit={handleSubmit} className="flex items-center p-4 border-t border-t-gray-300">
//             <Input
//               value={textMessage}
//               onChange={(e) => setTextMessage(e.target.value)}
//               type="text"
//               className="flex-1 mr-2 focus-visible:ring-transparent"
//               placeholder="Messages..."
//             />
//             <Button type="submit">Send</Button>
//           </form>
//         </section>
//       ) : (
//         <div className="flex flex-col items-center justify-center mx-auto">
//           <MessageCircleCode className="w-32 h-32 my-4" />
//           <h1 className="font-medium">Your messages</h1>
//           <span>Send a message to start a chat.</span>
//         </div>
//       )}
//     </div>
//   );
// };