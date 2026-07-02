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
            <img src={msg.photo_url} alt="фото" className="mb-1 max-h-32 rounded-lg object-cover cursor-pointer" />
          </a>
        )}
        {msg.text && <p className="leading-snug break-words">{msg.text}</p>}
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

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-navy shadow-lg hover:bg-navy-deep transition-colors sm:bottom-6 sm:right-6"
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

      {/* Chat window — full screen on mobile, popup on desktop */}
      {open && (
        <div
          className="fixed z-[9998] flex flex-col overflow-hidden border border-border bg-background shadow-2xl
            inset-0 rounded-none
            sm:inset-auto sm:bottom-24 sm:right-6 sm:w-80 sm:rounded-2xl"
          style={{ height: undefined, maxHeight: '100dvh' }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 bg-navy px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-gold-foreground font-display font-700 text-sm">CB</div>
            <div>
              <div className="font-600 text-white text-sm">ChineseBridge</div>
              <div className="flex items-center gap-1 text-xs text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Онлайн · ответим быстро
              </div>
            </div>
            <button
              className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              onClick={() => setOpen(false)}
            >
              <Icon name="X" size={20} />
            </button>
          </div>

          {stage === 'intro' ? (
            <div className="flex flex-col gap-4 p-5 flex-1 justify-center max-w-sm mx-auto w-full">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gold/15">
                  <Icon name="MessageCircle" size={28} className="text-gold" />
                </div>
                <p className="font-600 text-navy">Привет! Как вас зовут?</p>
                <p className="text-sm text-muted-foreground mt-1">Ответим в течение нескольких минут</p>
              </div>
              <Input
                placeholder="Ваше имя *"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') startChat(); }}
                className="h-12 text-base"
              />
              <Input
                placeholder="Email (необязательно)"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-12 text-base"
              />
              <Button
                className="h-12 bg-gold text-gold-foreground hover:bg-gold/90 text-base"
                disabled={!name.trim()}
                onClick={startChat}
              >
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
                <div className="relative mx-3 mb-1 w-16 shrink-0">
                  <img src={photoPreview} className="h-16 w-16 rounded-lg object-cover border border-border" />
                  <button
                    className="absolute -right-1 -top-1 rounded-full bg-navy p-1"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  >
                    <Icon name="X" size={10} className="text-white" />
                  </button>
                </div>
              )}

              {/* Input row */}
              <div className="shrink-0 border-t border-border p-2 flex gap-2 items-end pb-safe">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
                <button
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-gold"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon name="Paperclip" size={20} />
                </button>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Напишите сообщение..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-1 focus:ring-gold min-h-[44px] max-h-24"
                  style={{ lineHeight: '1.4', fontSize: '16px' }}
                />
                <button
                  onClick={send}
                  disabled={sending || (!text.trim() && !photo)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 disabled:opacity-40 transition-colors"
                >
                  {sending
                    ? <Icon name="Loader2" size={18} className="animate-spin" />
                    : <Icon name="Send" size={18} />}
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
