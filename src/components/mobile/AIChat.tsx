'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { mobileDesign } from '@/lib/mobile-design';
import { HapticButton } from './HapticButton';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
}

const suggestions = [
  'Show me the best phones under ₹30,000',
  'Compare iPhone 15 vs Galaxy S24',
  'What EMI options are available?',
  'Which phone has the best camera?',
  'Show me wireless earbuds',
  'What\'s on sale today?',
];

const responses: Record<string, { text: string; suggestions?: string[] }> = {
  'best phones under ₹30,000': {
    text: 'Here are the top picks under ₹30K:\n\n📱 OnePlus 12R — ₹27,999\n📱 Samsung Galaxy A55 — ₹26,999\n📱 Nothing Phone 2 — ₹25,999\n📱 iQOO 12 — ₹28,999\n\nAll come with warranty + GST invoice. Want me to compare any two?',
    suggestions: ['Compare OnePlus 12R vs Samsung A55', 'Show OnePlus 12R details'],
  },
  'compare iphone 15 vs galaxy s24': {
    text: 'iPhone 15 Pro vs Galaxy S24 Ultra:\n\n🍎 iPhone 15 Pro — ₹1,34,900\n• A17 Pro chip, titanium frame\n• 48MP camera, USB-C\n• iOS 17, 6 years updates\n\n📱 Galaxy S24 Ultra — ₹1,29,999\n• Snapdragon 8 Gen 3, S-Pen\n• 200MP camera, AI features\n• Android 14, 7 years updates\n\nBoth are flagship tier. iPhone for ecosystem, Samsung for customization.',
    suggestions: ['Show iPhone 15 Pro', 'Show Galaxy S24 Ultra', 'Check exchange offers'],
  },
  'emi options': {
    text: 'We offer No-Cost EMI on:\n\n💳 Credit Cards: HDFC, ICICI, SBI, Axis\n📱 Cardless EMI: HDFC, Bajaj Finserv\n🏦 Debit Card EMI: Yes Bank, Kotak\n\nTenures: 3, 6, 9, 12, 18, 24 months\n\nStarting from just ₹1,250/month on a ₹30K phone!',
    suggestions: ['Show phones with EMI', 'Check Bajaj Finserv eligibility'],
  },
  default: {
    text: 'I can help you find the perfect device! Try asking about:\n\n• Best phones in a budget\n• Product comparisons\n• EMI & payment options\n• Exchange offers\n• Warranty info',
    suggestions: ['Show trending phones', 'What\'s on sale?', 'Exchange my old phone'],
  },
};

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m VOLTAGE AI — your shopping assistant. I can help you compare phones, find deals, check EMI options, and more. What are you looking for?',
      suggestions,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const key = text.toLowerCase();
      const match = Object.keys(responses).find((k) => key.includes(k));
      const response = match ? responses[match] : responses.default;

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        suggestions: response.suggestions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  }, []);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'fixed',
          bottom: 100,
          right: 16,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #059669, #047857)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          boxShadow: '0 8px 24px rgba(5, 150, 105, 0.4)',
          cursor: 'pointer',
          zIndex: 400,
        }}
        aria-label="Open AI shopping assistant"
      >
        <Sparkles style={{ width: 24, height: 24 }} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 500,
              background: 'rgba(0, 0, 0, 0.5)',
            }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '85%',
                background: '#FAFAFA',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderBottom: '1px solid #E5E7EB',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Sparkles style={{ width: 18, height: 18, color: 'white' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>VOLTAGE AI</h3>
                    <p style={{ fontSize: '12px', color: '#059669', margin: 0 }}>Always here to help</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  aria-label="Close chat"
                >
                  <X style={{ width: 18, height: 18, color: '#6B7280' }} />
                </motion.button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: '12px',
                  }}>
                    <div style={{
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? '#059669' : '#FFFFFF',
                      color: msg.role === 'user' ? 'white' : '#111827',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      whiteSpace: 'pre-line',
                    }}>
                      {msg.content}
                      {msg.suggestions && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                          {msg.suggestions.map((s, i) => (
                            <motion.button
                              key={i}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => sendMessage(s)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 500,
                                borderRadius: '12px',
                                border: '1px solid #E5E7EB',
                                background: '#F9FAFB',
                                color: '#059669',
                                cursor: 'pointer',
                              }}
                            >
                              {s}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div style={{ display: 'flex', gap: '4px', padding: '12px 16px', background: '#FFFFFF', borderRadius: '16px', width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: '#9CA3AF' }}
                      />
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                gap: '8px',
                paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
              }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Ask me anything..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    fontSize: '14px',
                    color: '#111827',
                    outline: 'none',
                    fontFamily: mobileDesign.typography.fontFamily,
                  }}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage(input)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    border: 'none',
                    background: input.trim() ? '#059669' : '#E5E7EB',
                    color: input.trim() ? 'white' : '#9CA3AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  aria-label="Send message"
                >
                  <Send style={{ width: 18, height: 18 }} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
