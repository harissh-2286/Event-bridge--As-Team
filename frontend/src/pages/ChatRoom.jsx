import React, { useEffect, useState, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { chatService, authService } from '../services/api';

const ChatRoom = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [partners, setPartners] = useState([]);
  const [chattableUsers, setChattableUsers] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // WebSocket references
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatDetails = async () => {
    setLoading(true);
    try {
      const user = authService.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        // Load existing chat partners
        const prts = await chatService.getPartners();
        setPartners(prts);

        // Load new contact directory (role filtered)
        const directory = await chatService.getChattableUsers();
        setChattableUsers(directory);

        // Initialize WebSocket connection
        connectWebSocket(user.username);
      }
    } catch (err) {
      setError("Failed to load chat details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = (username) => {
    try {
      const wsBase = import.meta.env.VITE_API_BASE_URL || '';
      const socket = new SockJS(`${wsBase}/ws`);
      const stompClient = Stomp.over(socket);
      
      // Mute console logging for STOMP to keep it clean
      stompClient.debug = null;

      stompClient.connect({}, () => {
        stompClientRef.current = stompClient;

        // Subscribe to user specific message queue
        stompClient.subscribe(`/user/queue/messages`, (messageOutput) => {
          const incomingMsg = JSON.parse(messageOutput.body);
          
          // If the message is from our active chat partner, append it to the current screen
          setSelectedPartner((currentPartner) => {
            if (currentPartner && incomingMsg.sender.id === currentPartner.id) {
              setMessages((prev) => [...prev, incomingMsg]);
            } else {
              // Refresh partners list to show update/badge
              chatService.getPartners().then(setPartners);
            }
            return currentPartner;
          });
        });
      }, (err) => {
        console.warn("WebSocket connection lost. Retrying in 5s...", err);
        setTimeout(() => connectWebSocket(username), 5000);
      });
    } catch (e) {
      console.error("Error setting up socket client:", e);
    }
  };

  useEffect(() => {
    loadChatDetails();
    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.disconnect();
      }
    };
  }, []);

  const handlePartnerSelect = async (partner) => {
    setSelectedPartner(partner);
    try {
      const history = await chatService.getHistory(partner.id);
      setMessages(history);
      // Refresh partners list to clear unread counts
      const prts = await chatService.getPartners();
      setPartners(prts);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner) return;

    try {
      const msg = await chatService.sendMessage(selectedPartner.id, newMessage);
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
      
      // Update partners list to bring selected partner to the top
      const prts = await chatService.getPartners();
      setPartners(prts);
    } catch (err) {
      alert("Failed to send message: " + (err.response?.data || err.message));
    }
  };

  return (
    <div className="container py-4 fade-in-up">
      <div className="card custom-card overflow-hidden shadow border-0" style={{ height: '600px' }}>
        <div className="row g-0 h-100">
          
          {/* Left Panel: Partners list */}
          <div className="col-md-4 border-end h-100 d-flex flex-column bg-white">
            <div className="p-3 border-bottom">
              <h5 className="fw-bold mb-2">Conversations</h5>
              <div className="dropdown w-100">
                <button className="btn btn-light border dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center" type="button" id="newChatMenu" data-bs-toggle="dropdown" aria-expanded="false">
                  <span><i className="fa-solid fa-plus text-primary me-2"></i>New Chat</span>
                </button>
                <ul className="dropdown-menu w-100 shadow border-0" aria-labelledby="newChatMenu" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <div className="dropdown-header small fw-semibold text-muted text-uppercase">Role Matches</div>
                  {chattableUsers.length === 0 ? (
                    <li className="px-3 py-2 small text-muted">No contacts available</li>
                  ) : (
                    chattableUsers.map(user => (
                      <li key={user.id}>
                        <button className="dropdown-item d-flex align-items-center justify-content-between py-2" onClick={() => handlePartnerSelect(user)}>
                          <span className="fw-semibold text-dark">{user.fullName}</span>
                          <span className="badge bg-secondary-subtle text-secondary small">{user.role}</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            <div className="flex-grow-1 overflow-auto">
              {partners.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="fa-regular fa-comments fs-3 mb-2"></i>
                  <p className="small mb-0">No active chats.</p>
                  <small>Select 'New Chat' above to start.</small>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {partners.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handlePartnerSelect(p)}
                      className={`list-group-item list-group-item-action border-0 py-3 px-4 d-flex align-items-center justify-content-between ${selectedPartner?.id === p.id ? 'bg-light text-primary border-start border-primary border-3' : ''}`}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle fw-bold" style={{ width: '36px', height: '36px' }}>
                          {p.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold text-dark mb-0 small">{p.fullName}</div>
                          <span className="badge bg-light border text-muted" style={{ fontSize: '0.65rem' }}>{p.role}</span>
                        </div>
                      </div>
                      <span className={`badge rounded-circle p-1.5 ${p.onlineStatus ? 'bg-success' : 'bg-transparent'}`} style={{ width: '8px', height: '8px' }}> </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Conversation bubbles */}
          <div className="col-md-8 h-100 d-flex flex-column bg-light">
            {selectedPartner ? (
              <>
                {/* Active Partner Title */}
                <div className="p-3 bg-white border-bottom d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle fw-bold" style={{ width: '38px', height: '38px' }}>
                      {selectedPartner.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0 text-dark">{selectedPartner.fullName}</h6>
                      <span className="text-muted small">Role: {selectedPartner.role}</span>
                    </div>
                  </div>
                  <span className={`badge px-3 py-1.5 ${selectedPartner.onlineStatus ? 'bg-success' : 'bg-secondary'}`}>
                    {selectedPartner.onlineStatus ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Messages view */}
                <div className="chat-messages p-4 flex-grow-1 overflow-auto bg-light">
                  {messages.length === 0 ? (
                    <div className="text-center my-auto text-muted">
                      <p className="small mb-0">No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isSent = msg.sender.id === currentUser.id;
                      return (
                        <div key={msg.id || index} className={`chat-bubble ${isSent ? 'sent' : 'received'}`}>
                          <div className="small">{msg.messageContent}</div>
                          <div className="text-end" style={{ fontSize: '0.6rem', opacity: 0.8, marginTop: '3px' }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Inputs */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-top">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control bg-light border-0"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      required
                    />
                    <button className="btn btn-primary-custom px-4" type="submit">
                      <i className="fa-solid fa-paper-plane"></i>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                <i className="fa-regular fa-comments fs-1 mb-3 text-secondary"></i>
                <h5 className="fw-bold">No Conversation Selected</h5>
                <p className="small">Select a contact from the left menu panel to start chatting</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
