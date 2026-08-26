import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Sparkles, Bell, Shield } from 'lucide-react';

export default function TripChat({
  messages = [],
  tripMembers = [],
  currentUser,
  onSendMessage
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Map member IDs
  const memberMap = {};
  tripMembers.forEach(m => { memberMap[m.id] = m; });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    onSendMessage({
      sender_id: currentUser.id,
      text: inputText.trim(),
      is_system_event: false
    });

    setInputText('');
  };

  return (
    <div style={{ marginBottom: '2.5rem' }} className="animate-fade-in">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={22} color="var(--primary)" /> Trip Group Chat & Activity Feed
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Real-time chat & automatic expense notification feed for your group
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {tripMembers.slice(0, 5).map(m => (
            <div
              key={m.id}
              className="avatar-circle"
              title={m.name}
              style={{ width: '28px', height: '28px', fontSize: '0.75rem', backgroundColor: m.avatar_color }}
            >
              {m.name.charAt(0)}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="glass-card" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '520px',
        overflow: 'hidden'
      }}>
        {/* Messages Feed */}
        <div style={{
          flex: 1,
          padding: '1.25rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          background: 'var(--bg-main)'
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
              <Sparkles size={40} color="var(--primary)" style={{ marginBottom: '0.5rem', opacity: 0.7 }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                No messages yet!
              </h4>
              <p style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Say hi to your trip friends or add an expense to see notifications here.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              // System notification event
              if (msg.is_system_event) {
                return (
                  <div
                    key={msg.id || idx}
                    style={{
                      textAlign: 'center',
                      margin: '0.4rem 0'
                    }}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      <Bell size={13} color="var(--primary)" /> {msg.text}
                    </span>
                  </div>
                );
              }

              const isMe = msg.sender_id === currentUser?.id;
              const sender = memberMap[msg.sender_id] || { name: 'Friend', avatar_color: '#4f46e5' };
              const timeStr = new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={msg.id || idx}
                  style={{
                    display: 'flex',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: '0.5rem',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '80%'
                  }}
                >
                  {!isMe && (
                    <div
                      className="avatar-circle"
                      style={{ width: '30px', height: '30px', fontSize: '0.75rem', backgroundColor: sender.avatar_color }}
                    >
                      {sender.name.charAt(0)}
                    </div>
                  )}

                  <div>
                    {!isMe && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginLeft: '0.2rem', marginBottom: '0.15rem', display: 'block' }}>
                        {sender.name}
                      </span>
                    )}
                    <div style={{
                      padding: '0.65rem 0.95rem',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMe ? 'var(--primary)' : 'var(--bg-card)',
                      color: isMe ? 'white' : 'var(--text-primary)',
                      border: isMe ? 'none' : '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                      fontSize: '0.9rem',
                      lineHeight: '1.4'
                    }}>
                      {msg.text}
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      display: 'block',
                      textAlign: isMe ? 'right' : 'left',
                      marginTop: '0.2rem',
                      padding: '0 0.2rem'
                    }}>
                      {timeStr}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} style={{
          padding: '0.85rem 1rem',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <input
            type="text"
            className="form-control"
            placeholder={`Message ${tripMembers.map(m => m.name.split(' ')[0]).join(', ')}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ borderRadius: 'var(--radius-full)' }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-full)', padding: '0.65rem 1.1rem' }}
            disabled={!inputText.trim()}
          >
            <Send size={16} /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
