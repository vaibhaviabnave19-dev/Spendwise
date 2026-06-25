import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Sparkles, Smile, Flame, HelpCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

// Simple markdown-to-HTML parser for chat bubbles
const renderMarkdown = (text) => {
  if (!text) return '';
  const lines = text.split('\n');
  return lines.map((line, index) => {
    let trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      return <h4 key={index} style={{ color: 'var(--text-primary)', marginTop: '8px', marginBottom: '4px', fontWeight: '700' }}>{trimmed.replace('### ', '')}</h4>;
    }
    if (trimmed.startsWith('## ')) {
      return <h3 key={index} style={{ color: 'var(--accent-purple)', marginTop: '12px', marginBottom: '6px', fontWeight: '800' }}>{trimmed.replace('## ', '')}</h3>;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      return (
        <li key={index} style={{ marginLeft: '16px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
          {parseBoldText(content)}
        </li>
      );
    }
    if (trimmed === '') {
      return <div key={index} style={{ height: '6px' }} />;
    }
    return <p key={index} style={{ marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>{parseBoldText(line)}</p>;
  });
};

const parseBoldText = (text) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{part}</strong>;
    }
    const subParts = part.split(/`(.*?)`/g);
    return subParts.map((subPart, j) => {
      if (j % 2 === 1) {
        return <code key={j} style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-purple)', fontSize: '12px' }}>{subPart}</code>;
      }
      return subPart;
    });
  });
};

function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [spendingLevel, setSpendingLevel] = useState(0); // Determine roommate mood
  const chatEndRef = useRef(null);
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch current spending to adjust roommate mood
  const fetchSpendingLevel = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/expense/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSpendingLevel(data.total_spending || 0);
      }
    } catch (err) {
      console.error('Failed to load spending for chat mood', err);
    }
  }, [token]);

  useEffect(() => {
    // Initial welcome message
    const welcome = {
      id: 'welcome',
      sender: 'bot',
      text: `Yo ${user.name || 'Roomie'}! 🛌 Just got back to our room. I saw our current bills. Ask me why you are overspending, how to save, or ask for a future budget prediction. I'm ready to roast or help!`,
      time: new Date()
    };
    setMessages([welcome]);
    fetchSpendingLevel();
  }, [user.name, fetchSpendingLevel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      time: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Roommate fell asleep. Try again.');
      }

      // Add bot response
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.response,
        time: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `⚠️ *Error:* ${err.message}`,
        time: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      // Refresh spending level in case they added items recently
      fetchSpendingLevel();
    }
  };

  const suggestions = [
    { text: 'Why am I overspending?', icon: <Flame size={14} /> },
    { text: 'Can I save money this month?', icon: <Smile size={14} /> },
    { text: 'Predict my future budget', icon: <Sparkles size={14} /> }
  ];

  // Roommate mood based on spending level
  const getRoommateMood = () => {
    if (spendingLevel > 4000) {
      return {
        label: 'Roast Master Mode 🔥',
        class: '',
        color: 'var(--accent-rose)',
        icon: <Flame size={16} />
      };
    } else if (spendingLevel > 2000) {
      return {
        label: 'Suspicious Advisor 🧐',
        class: 'friendly',
        color: 'var(--accent-yellow)',
        icon: <HelpCircle size={16} />
      };
    } else {
      return {
        label: 'Friendly Roomie 🤝',
        class: 'friendly',
        color: 'var(--accent-green)',
        icon: <Smile size={16} />
      };
    }
  };

  const mood = getRoommateMood();

  return (
    <div className="chat-container-page glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
      {/* Header bar */}
      <div className="chat-roommate-bar">
        <div className="chat-roommate-avatar">
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--accent-purple-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            border: `1.5px solid ${mood.color}`
          }}>
            🛏️
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>SpendWise Roommate</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Online • Always watching your bills</p>
          </div>
        </div>

        <div className={`chat-roommate-status ${mood.class}`} style={{ color: mood.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
          {mood.icon}
          <span>{mood.label}</span>
        </div>
      </div>

      {/* Messages Window */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`message-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}
          >
            {msg.sender === 'bot' ? renderMarkdown(msg.text) : <p>{msg.text}</p>}
            <span style={{
              display: 'block',
              fontSize: '10px',
              color: msg.sender === 'user' ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)',
              textAlign: 'right',
              marginTop: '6px'
            }}>
              {new Date(msg.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {loading && (
          <div className="message-bubble bot" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 0.8s infinite alternate' }} />
            <span style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 0.8s infinite alternate 0.2s' }} />
            <span style={{ width: '6px', height: '6px', background: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 0.8s infinite alternate 0.4s' }} />
            <style>{`
              @keyframes bounce {
                from { transform: translateY(0); }
                to { transform: translateY(-4px); }
              }
            `}</style>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestions */}
      <div className="chat-quick-suggestions">
        {suggestions.map((sug, idx) => (
          <button
            key={idx}
            className="suggestion-chip"
            onClick={() => handleSendMessage(sug.text)}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {sug.icon}
            <span>{sug.text}</span>
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
        className="chat-input-bar"
      >
        <input
          type="text"
          className="input-field"
          placeholder="Ask your roommate: 'How do I save money?' or 'Roast my food bills'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button 
          type="submit" 
          className="btn-primary" 
          style={{ width: '50px', height: '50px', padding: 0, borderRadius: 'var(--border-radius-md)' }}
          disabled={loading || !input.trim()}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default AIChat;
