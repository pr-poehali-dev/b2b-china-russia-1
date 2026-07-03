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
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}

SCHEMA = 't_p93404869_b2b_china_russia_1'
SECRET = os.environ.get('DATABASE_URL', 'sinobridge-admin-salt')
ADMIN_PASSWORD = os.environ.get('ADMIN_PANEL_PASSWORD', '')


def _db():
    dsn = os.environ['DATABASE_URL']
    sep = '&' if '?' in dsn else '?'
    dsn += f'{sep}options=-csearch_path%3D{SCHEMA}'
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    return conn, conn.cursor(cursor_factory=RealDictCursor)


def _resp(status: int, body: dict):
    return {'statusCode': status, 'headers': CORS, 'isBase64Encoded': False, 'body': json.dumps(body, default=str)}


def _make_token() -> str:
    payload = f"admin.{int(time.time())}"
    sig = hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()[:32]
    raw = f"{payload}.{sig}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _check_token(token: str) -> bool:
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        parts = raw.split('.')
        payload = f"{parts[0]}.{parts[1]}"
        sig = parts[2]
        expected = hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()[:32]
        return hmac.compare_digest(sig, expected)
    except Exception:
        return False


def handler(event: dict, context) -> dict:
    '''Админ-панель: вход по паролю, управление товарами и поставщиками (создание, удаление, список).'''
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
    token = headers.get('X-Admin-Token') or headers.get('x-admin-token', '')

    # --- LOGIN ---
    if action == 'login' and method == 'POST':
        password = body.get('password') or ''
        if not ADMIN_PASSWORD or password != ADMIN_PASSWORD:
            return _resp(401, {'error': 'Неверный пароль'})
        return _resp(200, {'token': _make_token()})

    if not _check_token(token):
        return _resp(401, {'error': 'Требуется авторизация администратора'})

    conn, cur = _db()
    try:
        # --- SELLERS LIST ---
        if action == 'sellers' and method == 'GET':
            cur.execute(
                "SELECT id, company_name, email, province, category, plan, rating, "
                "reviews_count, created_at FROM sellers ORDER BY created_at DESC"
            )
            return _resp(200, {'sellers': [dict(s) for s in cur.fetchall()]})

        # --- CREATE SELLER ---
        if action == 'add_seller' and method == 'POST':
            company = (body.get('company_name') or '').strip()
            email = (body.get('email') or '').strip().lower()
            if not company or not email:
                return _resp(400, {'error': 'Укажите название компании и email'})
            cur.execute("SELECT id FROM sellers WHERE email = %s", (email,))
            if cur.fetchone():
                return _resp(409, {'error': 'Email уже зарегистрирован'})
            password = body.get('password') or base64.urlsafe_b64encode(os.urandom(9)).decode()
            pw_hash = hashlib.sha256((password + 'sb').encode()).hexdigest()
            cur.execute(
                "INSERT INTO sellers (company_name, email, password_hash, province, category, plan) "
                "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, company_name, email, province, category, plan, created_at",
                (company, email, pw_hash, body.get('province'), body.get('category'), body.get('plan', 'Verified')),
            )
            seller = dict(cur.fetchone())
            seller['generated_password'] = password if not body.get('password') else None
            return _resp(200, {'seller': seller})

        # --- DELETE SELLER (+ его товары) ---
        if action == 'delete_seller' and method == 'POST':
            sid = body.get('id')
            if not sid:
                return _resp(400, {'error': 'Укажите id'})
            cur.execute("DELETE FROM products WHERE seller_id = %s", (sid,))
            cur.execute("DELETE FROM sellers WHERE id = %s", (sid,))
            return _resp(200, {'ok': True})

        # --- PRODUCTS LIST ---
        if action == 'products' and method == 'GET':
            cur.execute(
                "SELECT p.id, p.name, p.category, p.price, p.image_url, p.status, p.views, p.created_at, "
                "p.seller_id, s.company_name FROM products p "
                "JOIN sellers s ON s.id = p.seller_id "
                "ORDER BY p.created_at DESC"
            )
            return _resp(200, {'products': [dict(p) for p in cur.fetchall()]})

        # --- ADD PRODUCT (от имени любого поставщика) ---
        if action == 'add_product' and method == 'POST':
            seller_id = body.get('seller_id')
            name = (body.get('name') or '').strip()
            if not seller_id or not name:
                return _resp(400, {'error': 'Укажите поставщика и название товара'})
            cur.execute("SELECT id FROM sellers WHERE id = %s", (seller_id,))
            if not cur.fetchone():
                return _resp(404, {'error': 'Поставщик не найден'})
            photos = body.get('photos', [])
            image_url = photos[0] if photos else body.get('image_url')
            cur.execute(
                "INSERT INTO products (seller_id, name, category, price, description, image_url, photos, sku, min_order, quantity) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
                "RETURNING id, name, category, price, image_url, status, views, created_at",
                (seller_id, name, body.get('category'), body.get('price'), body.get('description'),
                 image_url, photos, body.get('sku'), body.get('min_order'), body.get('quantity')),
            )
            return _resp(200, {'product': dict(cur.fetchone())})

        # --- DELETE PRODUCT (полностью) ---
        if action == 'delete_product' and method == 'POST':
            pid = body.get('id')
            if not pid:
                return _resp(400, {'error': 'Укажите id'})
            cur.execute("DELETE FROM products WHERE id = %s", (pid,))
            return _resp(200, {'ok': True})

        return _resp(404, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()