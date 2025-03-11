import { Conversation } from '../models/conversation.model.js';
import { Message } from '../models/message.model.js';

// for chatting
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.id;
    const receiverId = req.parmas.id;
    const { textMessage: message } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }
    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
    });
    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }
    await Promise.all([conversation.save(), newMessage.save()]);
    return res.status(201).json({
      success: true,
      newMessage,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Internal Server Error', error: error.message });
  }
};

// xoa
export const deleteMessage = async (req, res) => {
    try {
        // 1. Lấy thông tin từ request
        const userId = req.id; // ID người dùng hiện tại (từ middleware xác thực)
        const messageId = req.params.messageId; // ID tin nhắn cần xóa từ URL params

        // 2. Tìm tin nhắn cần xóa
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        // 3. Kiểm tra quyền xóa (chỉ người gửi mới được xóa)
        if (message.senderId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only delete your own messages"
            });
        }

        // 4. Xóa tin nhắn khỏi collection Message
        await Message.findByIdAndDelete(messageId);

        // 5. Xóa tham chiếu tin nhắn khỏi Conversation
        const conversation = await Conversation.findOne({
            participants: { $all: [message.senderId, message.receiverId] }
        });
        if (conversation) {
            conversation.messages = conversation.messages.filter(
                (msgId) => msgId.toString() !== messageId
            );
            await conversation.save();
        }

        // 6. Trả về response thành công
        return res.status(200).json({
            success: true,
            message: "Message deleted successfully"
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Server error while deleting message"
        });
    }
};

export const getMessage = async (req, res) => {
    try {
        // 1. Lấy thông tin người gửi và người nhận
        const senderId = req.id;          // ID người dùng hiện tại (từ middleware xác thực)
        const receiverId = req.params.id; // ID người nhận từ URL params

        // 2. Tìm conversation giữa hai người
        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate('messages');
        // populate('messages') sẽ thay thế các ID trong mảng messages bằng dữ liệu thực tế từ collection Message

        // 3. Nếu không có conversation, trả về mảng rỗng
        if (!conversation) return res.status(200).json({ success: true, messages: [] });

        // 4. Trả về danh sách tin nhắn
        return res.status(200).json({ success: true, messages: conversation?.messages });

    } catch (error) {
        console.log(error); // Log lỗi nếu xảy ra
    }
};