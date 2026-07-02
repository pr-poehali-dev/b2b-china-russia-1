import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chatApi, getSessionId, setSessionId, type ChatMessage } from '@/lib/chatApi';

const POLL_INTERVAL = 3000;

const Bubble = ({ msg }: { msg: ChatMessage }) => {
  const isVisitor = msg.sender === 'visitor';
  const isBot = msg.sender === 'bot';
  return (
    <div className={`flex ${isVisitor ? 'justify-end' : 'justify-start'} mb-2`}>
      {!isVisitor && (
        <div className={`mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs font-700 ${isBot ? 'bg-gold' : 'bg-navy'}`}>
          {isBot ? '🤖' : 'О'}
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isVisitor ? 'bg-navy text-white rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm'}`}>
        {msg.photo_url && (
          <a href={msg.photo_url} target="_blank" rel="noreferrer">
            <img src={msg.photo_url} alt="фото" className="mb-1 max-h-40 rounded-lg object-cover cursor-pointer" />
          </a>
        )}
        {msg.text && <p className="leading-snug">{msg.text}</p>}
        <p className={`mt-0.5 text-[10px] ${isVisitor ? 'text-white/60' : 'text-muted-foreground'}`}>
          {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<'intro' | 'chat'>('intro');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sessionId, setSessionIdState] = useState<number | null>(() => {
    const s = getSessionId(); return s ? Number(s) : null;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [lastId, setLastId] = useState(0);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

  const poll = useCallback(async () => {
    if (!sessionId) return;
    const data = await chatApi.poll(sessionId, lastId);
    if (data.messages?.length) {
      setMessages(prev => [...prev, ...data.messages]);
      setLastId(data.messages[data.messages.length - 1].id);
      if (!open) setUnread(u => u + data.messages.filter((m: ChatMessage) => m.sender !== 'visitor').length);
      scrollBottom();
    }
  }, [sessionId, lastId, open]);

  useEffect(() => {
    if (sessionId && stage === 'chat') {
      pollRef.current = setInterval(poll, POLL_INTERVAL);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [poll, sessionId, stage]);

  useEffect(() => { if (open) { setUnread(0); scrollBottom(); } }, [open]);

  // auto-resume if session exists
  useEffect(() => {
    if (sessionId && stage === 'intro') {
      chatApi.poll(sessionId, 0).then(d => {
        if (d.messages?.length) {
          setMessages(d.messages);
          setLastId(d.messages[d.messages.length - 1].id);
          setStage('chat');
        }
      });
    }
  }, []);

  const startChat = async () => {
    if (!name.trim()) return;
    const data = await chatApi.init(name, email);
    setSessionIdState(data.session_id);
    setSessionId(data.session_id);
    // load initial messages
    const msgs = await chatApi.poll(data.session_id, 0);
    setMessages(msgs.messages || []);
    if (msgs.messages?.length) setLastId(msgs.messages[msgs.messages.length - 1].id);
    setStage('chat');
    scrollBottom();
  };

  const handlePhoto = (f: File) => {
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const send = async () => {
    if ((!text.trim() && !photo) || !sessionId) return;
    setSending(true);
    const optimistic: ChatMessage = {
      id: Date.now(), sender: 'visitor',
      text: text || undefined, photo_url: photoPreview || undefined,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    const savedText = text; const savedPhoto = photo;
    setText(''); setPhoto(null); setPhotoPreview(null);
    scrollBottom();
    try {
      await chatApi.send(sessionId, savedText, savedPhoto || undefined);
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-navy shadow-lg hover:bg-navy-deep transition-colors"
        style={{ boxShadow: '0 4px 24px hsl(218 62% 18% / 0.35)' }}
      >
        {open
          ? <Icon name="X" size={24} className="text-white" />
          : <Icon name="MessageCircle" size={24} className="text-white" />
        }
        {!open && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-700 text-gold-foreground">
            {unread}
          </span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-80 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          style={{ height: '480px', boxShadow: '0 8px 40px hsl(218 62% 18% / 0.25)' }}>

          {/* Header */}
          <div className="flex items-center gap-3 bg-navy px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-gold-foreground font-display font-700 text-sm">CB</div>
            <div>
              <div className="font-600 text-white text-sm">ChineseBridge</div>
              <div className="flex items-center gap-1 text-xs text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Онлайн
              </div>
            </div>
            <button className="ml-auto text-white/60 hover:text-white" onClick={() => setOpen(false)}>
              <Icon name="Minus" size={18} />
            </button>
          </div>

          {stage === 'intro' ? (
            /* Intro form */
            <div className="flex flex-col gap-3 p-5 flex-1 justify-center">
              <p className="text-sm text-muted-foreground text-center">Привет! Как вас зовут?</p>
              <Input placeholder="Ваше имя *" value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') startChat(); }} />
              <Input placeholder="Email (необязательно)" value={email} onChange={e => setEmail(e.target.value)} />
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90" disabled={!name.trim()} onClick={startChat}>
                Начать чат
              </Button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3">
                {messages.map(m => <Bubble key={m.id} msg={m} />)}
                <div ref={bottomRef} />
              </div>

              {/* Photo preview */}
              {photoPreview && (
                <div className="relative mx-3 mb-1 w-16">
                  <img src={photoPreview} className="h-16 w-16 rounded-lg object-cover border border-border" />
                  <button className="absolute -right-1 -top-1 rounded-full bg-navy p-0.5" onClick={() => { setPhoto(null); setPhotoPreview(null); }}>
                    <Icon name="X" size={10} className="text-white" />
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="border-t border-border p-2 flex gap-1.5 items-end">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
                <button
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-gold"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="Paperclip" size={18} />
                </button>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Напишите сообщение..."
                  rows={1}
                  className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold min-h-[36px] max-h-24"
                  style={{ lineHeight: '1.4' }}
                />
                <button
                  onClick={send}
                  disabled={sending || (!text.trim() && !photo)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold text-gold-foreground hover:bg-gold/90 disabled:opacity-40 transition-colors"
                >
                  {sending ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
