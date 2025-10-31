import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import socketService from '../services/socket';
import { toast } from 'react-toastify';

const ChatInterface = ({ taskId, otherUserId, otherUserName }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messageEndRef = useRef(null);
  const socket = socketService.getSocket();

  useEffect(() => {
    fetchMessages();

    // Set up socket event listener for new messages
    if (socket) {
      socket.on('new_message', (message) => {
        if (message.task === taskId && 
            (message.sender._id === otherUserId || message.receiver._id === otherUserId)) {
          setMessages(prevMessages => [...prevMessages, message]);
        }
      });
    }

    return () => {
      // Clean up socket event listener
      if (socket) {
        socket.off('new_message');
      }
    };
  }, [taskId, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/task/${taskId}/user/${otherUserId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      setSending(true);
      const response = await api.post('/messages', {
        task: taskId,
        receiver: otherUserId,
        content: newMessage.trim()
      });
      
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-center text-gray-500">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b p-3 bg-gray-50">
        <h3 className="text-lg font-medium">Chat with {otherUserName}</h3>
      </div>
      
      <div className="p-4 h-96 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`mb-3 ${
                message.sender._id === currentUser._id
                  ? 'text-right'
                  : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg max-w-xs md:max-w-md ${
                  message.sender._id === currentUser._id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="break-words">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.sender._id === currentUser._id
                    ? 'text-blue-100'
                    : 'text-gray-500'
                }`}>
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messageEndRef}></div>
      </div>
      
      <form onSubmit={sendMessage} className="p-3 border-t">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            disabled={sending}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded-r hover:bg-blue-700 transition"
            disabled={sending || !newMessage.trim()}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface; 