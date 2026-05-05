import { useState, useRef, useEffect } from 'react';

const SYSTEM_PROMPT = `Ты — экспертный AI-ассистент сервиса «ЭнергоНорм» по нормативной базе в электроэнергетике России, специализирующийся на строительно-монтажных работах (СМР).

Аудитория: проектировщики, ГИПы, строители, проверяющие органы.

Если пользователь загрузил документы — отвечай СТРОГО по ним, указывая название файла, раздел и номер пункта. Если документов нет — отвечай по своим знаниям ПУЭ, ГОСТов, СП, СНиПов.

Структура ответа:
✅ МОЖНО / ❌ НЕЛЬЗЯ / ⚠️ УСЛОВНО
[Краткий однозначный ответ]

📋 ОБОСНОВАНИЕ
[Подробное техническое объяснение]

📄 НОРМАТИВНЫЕ ДОКУМЕНТЫ
[Конкретные документы с номерами пунктов]

💡 ПРАКТИЧЕСКАЯ РЕКОМЕНДАЦИЯ
[Что делать на практике]

Отвечай профессионально, точно, без воды.`;

const EXAMPLES = [
  'Можно ли прокладывать кабель ВВГ в земле без защитной трубы?',
  'Минимальное расстояние между кабелем и водопроводной трубой',
  'Требования к заземлению опор ВЛ 10 кВ',
  'Нормы освещённости кабельных тоннелей',
];

// ── Auth helpers ──────────────────────────────────────────────
const USERS_KEY = 'en_users';
const SESSION_KEY = 'en_session';

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
}
function saveUsers(u) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}
function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}
function saveSession(s) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Chat history helpers ──────────────────────────────────────
function getChats(email) {
  try {
    return JSON.parse(localStorage.getItem('en_chats_' + email) || '[]');
  } catch {
    return [];
  }
}
function saveChats(email, chats) {
  localStorage.setItem('en_chats_' + email, JSON.stringify(chats));
}

// ── Auth screen ───────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    setErr('');
    if (!email || !pass) return setErr('Заполните все поля');
    const users = getUsers();
    if (mode === 'register') {
      if (!name) return setErr('Введите имя');
      if (users[email]) return setErr('Пользователь уже существует');
      users[email] = { pass, name };
      saveUsers(users);
      const session = { email, name };
      saveSession(session);
      onLogin(session);
    } else {
      if (!users[email] || users[email].pass !== pass)
        return setErr('Неверный email или пароль');
      const session = { email, name: users[email].name };
      saveSession(session);
      onLogin(session);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F9FAFB',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: 380,
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #E5E7EB',
          padding: '36px 32px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#1A56DB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              margin: '0 auto 12px',
            }}
          >
            ⚡
          </div>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#111' }}>
            ЭнергоНорм
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            AI-ассистент по нормативам электроэнергетики
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            background: '#F3F4F6',
            borderRadius: 9,
            padding: 3,
            marginBottom: 20,
          }}
        >
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setErr('');
              }}
              style={{
                flex: 1,
                padding: '7px',
                borderRadius: 7,
                border: 'none',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#111' : '#6B7280',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {m === 'login' ? 'Войти' : 'Регистрация'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'register' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ваше имя"
              style={inputStyle}
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKey}
            type="email"
            placeholder="Email"
            style={inputStyle}
          />
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={onKey}
            type="password"
            placeholder="Пароль"
            style={inputStyle}
          />
          {err && (
            <div
              style={{
                fontSize: 13,
                color: '#EF4444',
                padding: '6px 10px',
                background: '#FEF2F2',
                borderRadius: 7,
              }}
            >
              {err}
            </div>
          )}
          <button
            onClick={submit}
            style={{
              padding: '11px',
              borderRadius: 9,
              border: 'none',
              background: '#1A56DB',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 9,
  border: '1px solid #E5E7EB',
  fontSize: 14,
  color: '#111',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
  fontFamily: 'inherit',
  background: '#FAFAFA',
};

// ── Sidebar ───────────────────────────────────────────────────
function Sidebar({
  page,
  setPage,
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  user,
  onLogout,
}) {
  return (
    <div
      style={{
        width: 230,
        flexShrink: 0,
        borderRight: '1px solid #EBEBEB',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#FAFAFA',
      }}
    >
      <div style={{ padding: '18px 14px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: '#1A56DB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
            }}
          >
            ⚡
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>
            ЭнергоНорм
          </span>
        </div>
        <button
          onClick={onNewChat}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid #DBEAFE',
            background: '#EFF6FF',
            color: '#1A56DB',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Новый чат
        </button>
      </div>

      <nav style={{ padding: '0 8px' }}>
        {[
          { id: 'chat', icon: '💬', label: 'Чат' },
          { id: 'docs', icon: '📚', label: 'База знаний' },
{ id: 'upload', icon: '⬆️', label: 'Загрузить' },
          { id: 'about', icon: 'ℹ️', label: 'О сервисе' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 7,
              border: 'none',
              background:
                page === item.id && item.id !== 'chat'
                  ? '#EFF6FF'
                  : 'transparent',
              color:
                page === item.id && item.id !== 'chat' ? '#1A56DB' : '#555',
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 2,
            }}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span> {item.label}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 0' }}>
        {chats.length > 0 && (
          <>
            <div
              style={{
                fontSize: 11,
                color: '#9CA3AF',
                padding: '8px 10px 4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              История чатов
            </div>
            {chats.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onSelectChat(c.id);
                  setPage('chat');
                }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 7,
                  border: 'none',
                  background:
                    currentChatId === c.id ? '#EFF6FF' : 'transparent',
                  color: currentChatId === c.id ? '#1A56DB' : '#555',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginBottom: 1,
                }}
                title={c.title}
              >
                {c.title}
              </button>
            ))}
          </>
        )}
      </div>

      <div style={{ padding: '12px 14px', borderTop: '1px solid #EBEBEB' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{user.email}</div>
          </div>
          <button
            onClick={onLogout}
            style={{
              fontSize: 11,
              color: '#9CA3AF',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 5,
            }}
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Chat page ─────────────────────────────────────────────────
function ChatPage({
  messages,
  input,
  setInput,
  loading,
  send,
  uploadedDocs,
  onUploadDocs,
  onRemoveDoc,
}) {
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const readPdf = (file) =>
    new Promise((res, rej) => {
      const r = new FileReader();
    r.onload = () => res((r.result as string).split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

  const handleFiles = async (files) => {
    const newDocs = [];
    for (const f of [...files]) {
      if (f.type !== 'application/pdf') continue;
      const b64 = await readPdf(f);
      newDocs.push({ name: f.name, size: f.size, b64 });
    }
    onUploadDocs(newDocs);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {uploadedDocs.length > 0 && (
        <div
          style={{
            padding: '8px 24px',
            borderBottom: '1px solid #EBEBEB',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 12, color: '#6B7280' }}>Документы:</span>
          {uploadedDocs.map((d, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: '#EFF6FF',
                border: '1px solid #DBEAFE',
                borderRadius: 6,
                padding: '3px 8px',
                fontSize: 12,
                color: '#1A56DB',
              }}
            >
              📄 {d.name.length > 25 ? d.name.slice(0, 25) + '…' : d.name}
              <button
                onClick={() => onRemoveDoc(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#93C5FD',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {messages.length === 0 && (
          <div
            style={{
              maxWidth: 580,
              margin: '30px auto 0',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 13,
                background: '#1A56DB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                margin: '0 auto 14px',
              }}
            >
              ⚡
            </div>
            <h2
              style={{
                fontSize: 19,
                fontWeight: 600,
                color: '#111',
                margin: '0 0 8px',
              }}
            >
              Чем могу помочь?
            </h2>
            <p
              style={{
                fontSize: 14,
                color: '#6B7280',
                margin: '0 0 24px',
                lineHeight: 1.6,
              }}
            >
              Задайте вопрос по ПУЭ, ГОСТам, СП, СНиПам или загрузите свои
              нормативные документы.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 9,
                marginBottom: 20,
              }}
            >
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => send(ex)}
                  style={{
                    padding: '11px 13px',
                    borderRadius: 10,
                    border: '1px solid #E5E7EB',
                    background: '#fff',
                    color: '#374151',
                    fontSize: 12,
                    lineHeight: 1.5,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                padding: '9px 18px',
                borderRadius: 9,
                border: '1px solid #DBEAFE',
                background: '#EFF6FF',
                color: '#1A56DB',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              📎 Загрузить PDF документы
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              maxWidth: 700,
              margin: '0 auto 18px',
              display: 'flex',
              gap: 11,
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                flexShrink: 0,
                background: m.role === 'user' ? '#E5E7EB' : '#1A56DB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: m.role === 'user' ? '#374151' : '#fff',
              }}
            >
              {m.role === 'user' ? 'Я' : 'AI'}
            </div>
            <div
              style={{
                maxWidth: '85%',
                padding: '11px 15px',
                borderRadius: 12,
                background: m.role === 'user' ? '#F3F4F6' : '#fff',
                border: m.role === 'assistant' ? '1px solid #E5E7EB' : 'none',
                fontSize: 14,
                lineHeight: 1.7,
                color: '#111',
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.loading ? (
                <span style={{ color: '#9CA3AF' }}>
                  Анализирую нормативы...
                </span>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div
        style={{
          padding: '14px 24px',
          borderTop: '1px solid #EBEBEB',
          background: '#fff',
        }}
      >
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              gap: 8,
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: 12,
              padding: '8px 10px',
              alignItems: 'flex-end',
            }}
          >
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                color: '#9CA3AF',
                padding: '2px 4px',
                flexShrink: 0,
              }}
              title="Загрузить PDF"
            >
              📎
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)}
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Задайте вопрос по нормативам..."
              rows={2}
              disabled={loading}
              style={{
                flex: 1,
                resize: 'none',
                border: 'none',
                background: 'transparent',
                fontSize: 14,
                lineHeight: 1.5,
                color: '#111',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                border: 'none',
                flexShrink: 0,
                background: loading || !input.trim() ? '#E5E7EB' : '#1A56DB',
                color: loading || !input.trim() ? '#9CA3AF' : '#fff',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: 16,
              }}
            >
              ↑
            </button>
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#9CA3AF',
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            Ответы носят справочный характер. Проверяйте актуальность
            нормативов.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Docs info page ────────────────────────────────────────────
const DOCS_INFO = [
  {
    icon: '⚡',
    name: 'ПУЭ 7-е издание',
    desc: 'Правила устройства электроустановок',
  },
  {
    icon: '📐',
    name: 'СП 76.13330.2016',
    desc: 'Электротехнические устройства',
  },
  { icon: '📏', name: 'ГОСТ Р 50571', desc: 'Электроустановки зданий' },
  {
    icon: '🏗️',
    name: 'СНиП 3.05.06-85',
    desc: 'Электротехнические устройства (монтаж)',
  },
  { icon: '🔌', name: 'СП 256.1325800', desc: 'Электроустановки жилых зданий' },
  { icon: '📋', name: 'ПТЭЭП', desc: 'Правила технической эксплуатации' },
];

function DocsPage() {
  return (
    <div
      style={{
        padding: '28px 32px',
        overflowY: 'auto',
        height: '100%',
        boxSizing: 'border-box' as const,
      }}
    >
      <div style={{ maxWidth: 660 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#111',
            margin: '0 0 4px',
          }}
        >
          База знаний
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 20px' }}>
          Нормативные документы в базе ЭнергоНорм AI
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 24,
          }}
        >
          {DOCS_INFO.map((d, i) => (
            <div
              key={i}
              style={{
                padding: '14px',
                borderRadius: 11,
                border: '1px solid #E5E7EB',
                background: '#fff',
                display: 'flex',
                gap: 11,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 17,
                  flexShrink: 0,
                }}
              >
                {d.icon}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: 13,
                    color: '#111',
                    marginBottom: 2,
                  }}
                >
                  {d.name}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{d.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 11,
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            display: 'flex',
            gap: 11,
          }}
        >
          <span style={{ fontSize: 18 }}>💡</span>
          <div>
            <div
              style={{
                fontWeight: 500,
                fontSize: 13,
                color: '#92400E',
                marginBottom: 3,
              }}
            >
              Загрузите свои документы
            </div>
            <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.5 }}>
              Нажмите 📎 в чате, чтобы загрузить PDF — внутренние регламенты,
              ТУ, проектную документацию. AI ответит строго по ним.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function UploadPage({ proxyUrl }: { proxyUrl: string }) {
  const [docName, setDocName] = useState('');
  const [docText, setDocText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const readFile = (file: File): Promise<string> => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsText(file, 'utf-8');
  });

  const handleFile = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    setDocName(file.name);
    if (file.type === 'text/plain') {
      const text = await readFile(file);
      setDocText(text);
    } else {
      setResult('⚠️ Для PDF и Word скопируйте текст вручную в поле ниже');
    }
  };

  const upload = async () => {
    if (!docName || !docText) return;
    setLoading(true);
    setResult('');
    try {
      const res = await fetch(`${proxyUrl}/upload-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: docText,
          metadata: { source: docName }
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(`✅ Загружено успешно! Создано ${data.chunks} фрагментов.`);
        setDocText('');
        setDocName('');
      } else {
        setResult('❌ Ошибка: ' + (data.error || 'неизвестная ошибка'));
      }
    } catch (e) {
      setResult('❌ Ошибка соединения');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' as const }}>
      <div style={{ maxWidth: 640 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111', margin: '0 0 6px' }}>Загрузить документ</h2>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>
          Добавьте нормативный документ в базу знаний. AI будет использовать его при ответах.
        </p>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Название документа</div>
          <input
            value={docName}
            onChange={e => setDocName(e.target.value)}
            placeholder="Например: ПУЭ 7-е издание"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #E5E7EB', fontSize: 14, color: '#111', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Текст документа</div>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border: '1.5px dashed #D1D5DB', borderRadius: 10, padding: '14px', textAlign: 'center', cursor: 'pointer', background: '#F9FAFB', marginBottom: 10 }}
          >
            <div style={{ fontSize: 13, color: '#6B7280' }}>📎 Нажмите чтобы загрузить .txt файл</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>или вставьте текст вручную ниже</div>
          </div>
          <input ref={fileRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={e => handleFile(e.target.files)} />
          <textarea
            value={docText}
            onChange={e => setDocText(e.target.value)}
            placeholder="Вставьте текст нормативного документа сюда..."
            rows={12}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid #E5E7EB', fontSize: 13, color: '#111', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, fontFamily: 'inherit', lineHeight: 1.6 }}
          />
          {docText && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{docText.length.toLocaleString()} символов · ~{Math.ceil(docText.length / 800)} фрагментов</div>}
        </div>

        <button
          onClick={upload}
          disabled={loading || !docName || !docText}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: loading || !docName || !docText ? '#E5E7EB' : '#1A56DB',
            color: loading || !docName || !docText ? '#9CA3AF' : '#fff',
            fontSize: 14, fontWeight: 500, cursor: loading || !docName || !docText ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Загружаю в базу знаний...' : 'Загрузить документ'}
        </button>

        {result && (
          <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: result.startsWith('✅') ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${result.startsWith('✅') ? '#BBF7D0' : '#FECACA'}`, fontSize: 14, color: result.startsWith('✅') ? '#15803D' : '#DC2626' }}>
            {result}
          </div>
        )}

        <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#92400E', marginBottom: 6 }}>Как загрузить PDF или Word?</div>
          <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>
            1. Откройте документ в браузере или Word<br />
            2. Нажмите Ctrl+A → Ctrl+C (выделить всё и скопировать)<br />
            3. Вставьте текст в поле выше через Ctrl+V<br />
            4. Укажите название и нажмите "Загрузить"
          </div>
        </div>
      </div>
    </div>
  );
}
function AboutPage() {
  return (
    <div
      style={{
        padding: '28px 32px',
        overflowY: 'auto',
        height: '100%',
       boxSizing: 'border-box' as const,
      }}
    >
      <div style={{ maxWidth: 620 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: '#111',
            margin: '0 0 8px',
          }}
        >
          О сервисе
        </h2>
        <p
          style={{
            fontSize: 14,
            color: '#555',
            lineHeight: 1.7,
            margin: '0 0 20px',
          }}
        >
          ЭнергоНорм — AI-ассистент для инженеров в сфере электроэнергетики.
          Помогает быстро находить ответы на нормативные вопросы при
          проектировании и СМР.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            {
              icon: '⚡',
              t: 'Мгновенные ответы',
              d: 'Не тратьте часы на поиск нужного пункта в нормативах',
            },
            {
              icon: '📄',
              t: 'Ссылки на документы',
              d: 'Каждый ответ содержит конкретный номер пункта ПУЭ или ГОСТа',
            },
            {
              icon: '🏗️',
              t: 'Для практиков',
              d: 'Для проектировщиков, ГИПов, строителей, проверяющих органов',
            },
            {
              icon: '📎',
              t: 'Свои документы',
              d: 'Загружайте PDF — AI ответит строго по вашим нормативам',
            },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                padding: '14px',
                borderRadius: 11,
                border: '1px solid #E5E7EB',
                background: '#fff',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 7 }}>{f.icon}</div>
              <div
                style={{
                  fontWeight: 500,
                  fontSize: 13,
                  color: '#111',
                  marginBottom: 3,
                }}
              >
                {f.t}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
                {f.d}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            fontSize: 13,
            color: '#15803D',
          }}
        >
          Проектировщики · ГИПы · Строители · Проверяющие органы · Заказчики
          строительства
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => getSession());
  const [page, setPage] = useState('chat');
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);

  useEffect(() => {
    if (user) setChats(getChats(user.email));
  }, [user]);

  const persistChats = (email, updated) => {
    setChats(updated);
    saveChats(email, updated);
  };

  const newChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setInput('');
    setUploadedDocs([]);
    setPage('chat');
  };

  const selectChat = (id) => {
    const c = chats.find((c) => c.id === id);
    if (c) {
      setCurrentChatId(id);
      setMessages(c.messages);
      setUploadedDocs([]);
    }
  };

  const send = async (q) => {
    const text = (q || input).trim();
    if (!text || loading) return;
    setInput('');
    setPage('chat');

    const userMsg = { role: 'user', content: text };
    const loadingMsg = { role: 'assistant', content: '', loading: true };
    const newMsgs = [...messages, userMsg, loadingMsg];
    setMessages(newMsgs);
    setLoading(true);

    try {
      let userContent = [];
      for (const doc of uploadedDocs) {
        userContent.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: doc.b64,
          },
          title: doc.name,
        });
      }
      userContent.push({ type: 'text', text });

      const hist = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('https://energonorm-proxy.onrender.com/v1/messages', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system:
            uploadedDocs.length > 0
              ? SYSTEM_PROMPT +
                '\n\nПользователь загрузил документы. Отвечай СТРОГО по ним с указанием файла, раздела и пункта.'
              : SYSTEM_PROMPT,
          messages: [...hist, { role: 'user', content: userContent }],
        }),
      });
      const data = await res.json();
      const answer =
        data.content?.map((b) => b.text || '').join('') ||
        'Не удалось получить ответ.';
      const finalMsgs = [
        ...messages,
        userMsg,
        { role: 'assistant', content: answer },
      ];
      setMessages(finalMsgs);

      if (user) {
        const chatId = currentChatId || Date.now().toString();
        const title = text.slice(0, 45) + (text.length > 45 ? '…' : '');
        const updated = currentChatId
          ? chats.map((c) =>
              c.id === chatId ? { ...c, messages: finalMsgs } : c
            )
          : [{ id: chatId, title, messages: finalMsgs }, ...chats].slice(0, 30);
        setCurrentChatId(chatId);
        persistChats(user.email, updated);
      }
    } catch {
      setMessages([
        ...messages,
        userMsg,
        {
          role: 'assistant',
          content: 'Ошибка соединения. Попробуйте ещё раз.',
        },
      ]);
    }
    setLoading(false);
  };

  if (!user)
    return (
      <AuthScreen
        onLogin={(u) => {
          setUser(u);
          setChats(getChats(u.email));
        }}
      />
    );

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: '#fff',
      }}
    >
      <Sidebar
        page={page}
        setPage={setPage}
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={newChat}
        onSelectChat={selectChat}
        user={user}
        onLogout={() => {
          clearSession();
          setUser(null);
          setChats([]);
          newChat();
        }}
      />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid #EBEBEB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
            {page === 'chat'
              ? 'Чат'
              : page === 'docs'
              ? 'База знаний'
              : 'О сервисе'}
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10B981',
              }}
            />
            AI активен
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {page === 'chat' && (
            <ChatPage
              messages={messages}
              input={input}
              setInput={setInput}
              loading={loading}
              send={send}
              uploadedDocs={uploadedDocs}
              onUploadDocs={(docs) =>
                setUploadedDocs((prev) => [...prev, ...docs])
              }
              onRemoveDoc={(i) =>
                setUploadedDocs((prev) => prev.filter((_, j) => j !== i))
              }
            />
          )}
          {page === 'docs' && <DocsPage />}
{page === 'upload' && <UploadPage proxyUrl="https://energonorm-proxy.onrender.com" />}
          {page === 'about' && <AboutPage />}
        </div>
      </div>
    </div>
  );
}
