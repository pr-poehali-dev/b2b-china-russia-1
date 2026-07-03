import json
import os
import hashlib
import hmac
import base64
import time
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Buyer-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}

SECRET = os.environ.get('DATABASE_URL', 'sinobridge-buyer-salt')
SCHEMA = 't_p93404869_b2b_china_russia_1'


def _db():
    dsn = os.environ['DATABASE_URL']
    sep = '&' if '?' in dsn else '?'
    dsn += f'{sep}options=-csearch_path%3D{SCHEMA}'
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    return conn, conn.cursor(cursor_factory=RealDictCursor)


def _hash_pw(password: str) -> str:
    return hashlib.sha256((password + 'buyer').encode()).hexdigest()


def _make_token(buyer_id: int) -> str:
    payload = f"{buyer_id}.{int(time.time())}"
    sig = hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()[:24]
    raw = f"{payload}.{sig}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _parse_token(token: str):
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        parts = raw.split('.')
        buyer_id, ts, sig = parts[0], parts[1], parts[2]
        payload = f"{buyer_id}.{ts}"
        expected = hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()[:24]
        if hmac.compare_digest(sig, expected):
            return int(buyer_id)
    except Exception:
        return None
    return None


def _resp(status: int, body: dict):
    return {'statusCode': status, 'headers': CORS, 'isBase64Encoded': False, 'body': json.dumps(body, default=str)}


def handler(event: dict, context) -> dict:
    '''Кабинет покупателя: авторизация, избранное, история просмотров, заявки, чат с поставщиками, уведомления.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'isBase64Encoded': False, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            body = {}

    headers = event.get('headers') or {}
    token = headers.get('X-Buyer-Token') or headers.get('x-buyer-token', '')
    buyer_id = _parse_token(token) if token else None

    conn, cur = _db()

    try:
        # --- AUTH ---
        if action == 'register' and method == 'POST':
            name = (body.get('name') or '').strip()
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            if not name or not email or not password:
                return _resp(400, {'error': 'Заполните все поля'})
            cur.execute("SELECT id FROM buyers WHERE email = %s", (email,))
            if cur.fetchone():
                return _resp(409, {'error': 'Email уже зарегистрирован'})
            cur.execute(
                "INSERT INTO buyers (name, email, password_hash, phone, company) "
                "VALUES (%s, %s, %s, %s, %s) RETURNING id, name, email, phone, company",
                (name, email, _hash_pw(password), body.get('phone'), body.get('company')),
            )
            row = cur.fetchone()
            return _resp(200, {'token': _make_token(row['id']), 'buyer': dict(row)})

        if action == 'login' and method == 'POST':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            cur.execute(
                "SELECT id, name, email, phone, company, password_hash FROM buyers WHERE email = %s",
                (email,),
            )
            row = cur.fetchone()
            if not row or row['password_hash'] != _hash_pw(password):
                return _resp(401, {'error': 'Неверный email или пароль'})
            buyer = {'id': row['id'], 'name': row['name'], 'email': row['email'], 'phone': row['phone'], 'company': row['company']}
            return _resp(200, {'token': _make_token(row['id']), 'buyer': buyer})

        if buyer_id is None:
            return _resp(401, {'error': 'Требуется авторизация'})

        # --- PROFILE ---
        if action == 'profile' and method == 'GET':
            cur.execute("SELECT id, name, email, phone, company, created_at FROM buyers WHERE id = %s", (buyer_id,))
            buyer = cur.fetchone()
            return _resp(200, {'buyer': dict(buyer) if buyer else None})

        if action == 'update_profile' and method == 'POST':
            cur.execute(
                "UPDATE buyers SET name=%s, phone=%s, company=%s WHERE id=%s",
                (body.get('name'), body.get('phone'), body.get('company'), buyer_id),
            )
            return _resp(200, {'ok': True})

        # --- FAVORITES ---
        if action == 'favorites' and method == 'GET':
            item_type = params.get('type')
            conditions = ['buyer_id = %s']
            args = [buyer_id]
            if item_type:
                conditions.append('item_type = %s')
                args.append(item_type)
            cur.execute(
                f"SELECT id, item_type, item_id, created_at FROM favorites WHERE {' AND '.join(conditions)} ORDER BY created_at DESC",
                args,
            )
            favs = cur.fetchall()

            companies, products, videos = [], [], []
            company_ids = [f['item_id'] for f in favs if f['item_type'] == 'company']
            product_ids = [f['item_id'] for f in favs if f['item_type'] == 'product']
            video_ids = [f['item_id'] for f in favs if f['item_type'] == 'video']

            if company_ids:
                cur.execute(
                    "SELECT id, company_name, province, category, plan, rating, logo_url FROM sellers WHERE id = ANY(%s)",
                    (company_ids,),
                )
                companies = [dict(r) for r in cur.fetchall()]
            if product_ids:
                cur.execute(
                    "SELECT p.id, p.name, p.category, p.price, p.image_url, p.seller_id, s.company_name "
                    "FROM products p JOIN sellers s ON s.id = p.seller_id WHERE p.id = ANY(%s)",
                    (product_ids,),
                )
                products = [dict(r) for r in cur.fetchall()]
            if video_ids:
                cur.execute(
                    "SELECT m.id, m.url, m.caption, m.likes_count, m.views_count, m.seller_id, s.company_name "
                    "FROM media m JOIN sellers s ON s.id = m.seller_id WHERE m.id = ANY(%s)",
                    (video_ids,),
                )
                videos = [dict(r) for r in cur.fetchall()]

            return _resp(200, {'companies': companies, 'products': products, 'videos': videos})

        if action == 'add_favorite' and method == 'POST':
            item_type = body.get('item_type')
            item_id = body.get('item_id')
            if item_type not in ('company', 'product', 'video') or not item_id:
                return _resp(400, {'error': 'Некорректные данные'})
            cur.execute(
                "INSERT INTO favorites (buyer_id, item_type, item_id) VALUES (%s, %s, %s) "
                "ON CONFLICT (buyer_id, item_type, item_id) DO NOTHING",
                (buyer_id, item_type, item_id),
            )
            return _resp(200, {'ok': True})

        if action == 'remove_favorite' and method == 'POST':
            cur.execute(
                "DELETE FROM favorites WHERE buyer_id=%s AND item_type=%s AND item_id=%s",
                (buyer_id, body.get('item_type'), body.get('item_id')),
            )
            return _resp(200, {'ok': True})

        if action == 'check_favorites' and method == 'GET':
            item_type = params.get('type')
            cur.execute(
                "SELECT item_id FROM favorites WHERE buyer_id=%s AND item_type=%s",
                (buyer_id, item_type),
            )
            return _resp(200, {'ids': [r['item_id'] for r in cur.fetchall()]})

        # --- VIEW HISTORY ---
        if action == 'add_view' and method == 'POST':
            item_type = body.get('item_type')
            item_id = body.get('item_id')
            if item_type not in ('company', 'product') or not item_id:
                return _resp(400, {'error': 'Некорректные данные'})
            cur.execute(
                "INSERT INTO view_history (buyer_id, item_type, item_id, viewed_at) VALUES (%s, %s, %s, NOW()) "
                "ON CONFLICT (buyer_id, item_type, item_id) DO UPDATE SET viewed_at = NOW()",
                (buyer_id, item_type, item_id),
            )
            return _resp(200, {'ok': True})

        if action == 'history' and method == 'GET':
            cur.execute(
                "SELECT item_type, item_id, viewed_at FROM view_history WHERE buyer_id=%s ORDER BY viewed_at DESC LIMIT 50",
                (buyer_id,),
            )
            rows = cur.fetchall()
            company_ids = [r['item_id'] for r in rows if r['item_type'] == 'company']
            product_ids = [r['item_id'] for r in rows if r['item_type'] == 'product']
            companies, products = [], []
            if company_ids:
                cur.execute(
                    "SELECT id, company_name, province, category, plan, rating, logo_url FROM sellers WHERE id = ANY(%s)",
                    (company_ids,),
                )
                by_id = {r['id']: dict(r) for r in cur.fetchall()}
                companies = [by_id[r['item_id']] for r in rows if r['item_type'] == 'company' and r['item_id'] in by_id]
            if product_ids:
                cur.execute(
                    "SELECT p.id, p.name, p.category, p.price, p.image_url, p.seller_id, s.company_name "
                    "FROM products p JOIN sellers s ON s.id = p.seller_id WHERE p.id = ANY(%s)",
                    (product_ids,),
                )
                by_id = {r['id']: dict(r) for r in cur.fetchall()}
                products = [by_id[r['item_id']] for r in rows if r['item_type'] == 'product' and r['item_id'] in by_id]
            return _resp(200, {'companies': companies, 'products': products})

        # --- LEADS (Запросы / Заказы) ---
        if action == 'leads' and method == 'GET':
            status_filter = params.get('status')
            conditions = ['l.buyer_id = %s']
            args = [buyer_id]
            if status_filter:
                conditions.append('l.status = %s')
                args.append(status_filter)
            cur.execute(
                f"SELECT l.id, l.seller_id, s.company_name, l.buyer_name, l.buyer_contact, l.message, "
                f"l.status, l.product_interest, l.budget, l.quantity, l.created_at "
                f"FROM leads l JOIN sellers s ON s.id = l.seller_id "
                f"WHERE {' AND '.join(conditions)} ORDER BY l.created_at DESC",
                args,
            )
            return _resp(200, {'leads': [dict(r) for r in cur.fetchall()]})

        if action == 'send_lead' and method == 'POST':
            seller_id = body.get('seller_id')
            message = body.get('message', '')
            if not seller_id:
                return _resp(400, {'error': 'Укажите поставщика'})
            cur.execute("SELECT name, email, phone, company FROM buyers WHERE id = %s", (buyer_id,))
            buyer = cur.fetchone()
            buyer_name = buyer['company'] or buyer['name']
            buyer_contact = buyer['email']
            cur.execute(
                "INSERT INTO leads (seller_id, buyer_id, buyer_name, buyer_contact, message, product_id, product_interest, budget, quantity) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) "
                "RETURNING id, seller_id, buyer_name, buyer_contact, message, status, created_at",
                (seller_id, buyer_id, buyer_name, buyer_contact, message, body.get('product_id'),
                 body.get('product_interest'), body.get('budget'), body.get('quantity')),
            )
            return _resp(200, {'lead': dict(cur.fetchone())})

        # --- NOTIFICATIONS ---
        if action == 'notifications' and method == 'GET':
            cur.execute(
                "SELECT id, type, title, message, seller_id, is_read, created_at "
                "FROM buyer_notifications WHERE buyer_id=%s ORDER BY created_at DESC LIMIT 50",
                (buyer_id,),
            )
            notifs = cur.fetchall()
            cur.execute("SELECT COUNT(*) as cnt FROM buyer_notifications WHERE buyer_id=%s AND is_read=FALSE", (buyer_id,))
            unread = cur.fetchone()['cnt']
            return _resp(200, {'notifications': [dict(n) for n in notifs], 'unread': unread})

        if action == 'mark_notification_read' and method == 'POST':
            cur.execute(
                "UPDATE buyer_notifications SET is_read=TRUE WHERE id=%s AND buyer_id=%s",
                (body.get('id'), buyer_id),
            )
            return _resp(200, {'ok': True})

        if action == 'mark_all_read' and method == 'POST':
            cur.execute("UPDATE buyer_notifications SET is_read=TRUE WHERE buyer_id=%s", (buyer_id,))
            return _resp(200, {'ok': True})

        # --- CHAT ---
        if action == 'chats' and method == 'GET':
            cur.execute(
                "SELECT c.id, c.seller_id, s.company_name, s.logo_url, c.last_message_at, c.buyer_unread, "
                "(SELECT text FROM buyer_chat_messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message "
                "FROM buyer_chats c JOIN sellers s ON s.id = c.seller_id "
                "WHERE c.buyer_id = %s ORDER BY c.last_message_at DESC",
                (buyer_id,),
            )
            return _resp(200, {'chats': [dict(r) for r in cur.fetchall()]})

        if action == 'chat_start' and method == 'POST':
            seller_id = body.get('seller_id')
            if not seller_id:
                return _resp(400, {'error': 'Укажите поставщика'})
            cur.execute(
                "INSERT INTO buyer_chats (buyer_id, seller_id) VALUES (%s, %s) "
                "ON CONFLICT (buyer_id, seller_id) DO UPDATE SET buyer_id = EXCLUDED.buyer_id "
                "RETURNING id",
                (buyer_id, seller_id),
            )
            chat = cur.fetchone()
            return _resp(200, {'chat_id': chat['id']})

        if action == 'chat_messages' and method == 'GET':
            chat_id = params.get('chat_id')
            cur.execute("SELECT id FROM buyer_chats WHERE id=%s AND buyer_id=%s", (chat_id, buyer_id))
            if not cur.fetchone():
                return _resp(404, {'error': 'Чат не найден'})
            cur.execute(
                "SELECT id, sender, text, created_at FROM buyer_chat_messages WHERE chat_id=%s ORDER BY created_at ASC",
                (chat_id,),
            )
            messages = cur.fetchall()
            cur.execute("UPDATE buyer_chats SET buyer_unread=0 WHERE id=%s", (chat_id,))
            return _resp(200, {'messages': [dict(m) for m in messages]})

        if action == 'chat_send' and method == 'POST':
            chat_id = body.get('chat_id')
            text = (body.get('text') or '').strip()
            if not chat_id or not text:
                return _resp(400, {'error': 'Укажите текст сообщения'})
            cur.execute("SELECT id FROM buyer_chats WHERE id=%s AND buyer_id=%s", (chat_id, buyer_id))
            if not cur.fetchone():
                return _resp(404, {'error': 'Чат не найден'})
            cur.execute(
                "INSERT INTO buyer_chat_messages (chat_id, sender, text) VALUES (%s, 'buyer', %s) "
                "RETURNING id, sender, text, created_at",
                (chat_id, text),
            )
            msg = cur.fetchone()
            cur.execute(
                "UPDATE buyer_chats SET last_message_at=NOW(), seller_unread = seller_unread + 1 WHERE id=%s",
                (chat_id,),
            )
            return _resp(200, {'message': dict(msg)})

        return _resp(404, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()
