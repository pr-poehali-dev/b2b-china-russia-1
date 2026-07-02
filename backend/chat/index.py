import json
import os
import uuid
import base64
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Visitor-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}

SCHEMA = 't_p93404869_b2b_china_russia_1'
ADMIN_TOKEN = 'chinabridge-admin-2026'


def _db():
    dsn = os.environ['DATABASE_URL']
    sep = '&' if '?' in dsn else '?'
    dsn += f'{sep}options=-csearch_path%3D{SCHEMA}'
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    return conn, conn.cursor(cursor_factory=RealDictCursor)


def _s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def _cdn(key):
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def _resp(status, body):
    return {'statusCode': status, 'headers': CORS, 'isBase64Encoded': False, 'body': json.dumps(body, default=str)}


def handler(event: dict, context) -> dict:
    '''Живой чат: сессии посетителей, сообщения с фото, ответы оператора.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'isBase64Encoded': False, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
    visitor_id = headers.get('X-Visitor-Id') or headers.get('x-visitor-id', '')
    is_admin = token == ADMIN_TOKEN

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            body = {}

    conn, cur = _db()
    try:
        # ── VISITOR: start or resume session ──
        if action == 'init' and method == 'POST':
            vid = visitor_id or body.get('visitor_id') or uuid.uuid4().hex
            cur.execute("SELECT id, visitor_name, status FROM chat_sessions WHERE visitor_id = %s ORDER BY created_at DESC LIMIT 1", (vid,))
            row = cur.fetchone()
            if row and row['status'] == 'open':
                session_id = row['id']
            else:
                name = (body.get('name') or '').strip() or 'Гость'
                email = (body.get('email') or '').strip()
                cur.execute(
                    "INSERT INTO chat_sessions (visitor_id, visitor_name, visitor_email) VALUES (%s,%s,%s) RETURNING id",
                    (vid, name, email)
                )
                session_id = cur.fetchone()['id']
                # welcome message
                cur.execute(
                    "INSERT INTO chat_messages (session_id, sender, text) VALUES (%s,'bot',%s)",
                    (session_id, 'Здравствуйте! Мы рады помочь вам найти поставщиков из Китая. Опишите, что вас интересует, и мы ответим в ближайшее время.')
                )
            return _resp(200, {'session_id': session_id, 'visitor_id': vid})

        # ── VISITOR: send message ──
        if action == 'send' and method == 'POST':
            session_id = body.get('session_id')
            text = (body.get('text') or '').strip()
            photo_b64 = body.get('photo')
            photo_url = None

            if not session_id:
                return _resp(400, {'error': 'Нет session_id'})
            if not text and not photo_b64:
                return _resp(400, {'error': 'Пустое сообщение'})

            if photo_b64:
                try:
                    photo_bytes = base64.b64decode(photo_b64)
                    key = f"chat/{session_id}/{uuid.uuid4().hex}.jpg"
                    _s3().put_object(Bucket='files', Key=key, Body=photo_bytes, ContentType='image/jpeg')
                    photo_url = _cdn(key)
                except Exception:
                    pass

            cur.execute(
                "INSERT INTO chat_messages (session_id, sender, text, photo_url) VALUES (%s,'visitor',%s,%s) RETURNING id, created_at",
                (session_id, text or None, photo_url)
            )
            msg = cur.fetchone()
            cur.execute("UPDATE chat_sessions SET last_message_at=NOW() WHERE id=%s", (session_id,))
            return _resp(200, {'message': dict(msg), 'photo_url': photo_url})

        # ── VISITOR: poll messages ──
        if action == 'poll' and method == 'GET':
            session_id = params.get('session_id')
            since_id = params.get('since_id', '0')
            if not session_id:
                return _resp(400, {'error': 'Нет session_id'})
            cur.execute(
                "SELECT id, sender, text, photo_url, created_at FROM chat_messages "
                "WHERE session_id=%s AND id > %s ORDER BY id ASC LIMIT 50",
                (session_id, since_id)
            )
            return _resp(200, {'messages': [dict(m) for m in cur.fetchall()]})

        # ── ADMIN: list sessions ──
        if action == 'sessions' and method == 'GET':
            if not is_admin:
                return _resp(403, {'error': 'Нет доступа'})
            cur.execute(
                "SELECT s.id, s.visitor_id, s.visitor_name, s.visitor_email, s.status, s.last_message_at, "
                "(SELECT COUNT(*) FROM chat_messages m WHERE m.session_id=s.id AND m.sender='visitor') AS visitor_count, "
                "(SELECT text FROM chat_messages m WHERE m.session_id=s.id ORDER BY m.id DESC LIMIT 1) AS last_text "
                "FROM chat_sessions s ORDER BY s.last_message_at DESC LIMIT 100"
            )
            return _resp(200, {'sessions': [dict(s) for s in cur.fetchall()]})

        # ── ADMIN: get session messages ──
        if action == 'session_messages' and method == 'GET':
            if not is_admin:
                return _resp(403, {'error': 'Нет доступа'})
            session_id = params.get('session_id')
            cur.execute(
                "SELECT id, sender, text, photo_url, created_at FROM chat_messages WHERE session_id=%s ORDER BY id ASC",
                (session_id,)
            )
            cur.execute("SELECT visitor_name, visitor_email, status FROM chat_sessions WHERE id=%s", (session_id,))
            info = cur.fetchone()
            return _resp(200, {'messages': [dict(m) for m in cur.fetchall()], 'info': dict(info) if info else {}})

        # ── ADMIN: reply ──
        if action == 'reply' and method == 'POST':
            if not is_admin:
                return _resp(403, {'error': 'Нет доступа'})
            session_id = body.get('session_id')
            text = (body.get('text') or '').strip()
            if not session_id or not text:
                return _resp(400, {'error': 'Нет session_id или текста'})
            cur.execute(
                "INSERT INTO chat_messages (session_id, sender, text) VALUES (%s,'operator',%s) RETURNING id, created_at",
                (session_id, text)
            )
            cur.execute("UPDATE chat_sessions SET last_message_at=NOW() WHERE id=%s", (session_id,))
            return _resp(200, {'ok': True})

        # ── ADMIN: close session ──
        if action == 'close' and method == 'POST':
            if not is_admin:
                return _resp(403, {'error': 'Нет доступа'})
            cur.execute("UPDATE chat_sessions SET status='closed' WHERE id=%s", (body.get('session_id'),))
            return _resp(200, {'ok': True})

        return _resp(404, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()
