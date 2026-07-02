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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}

SECRET = os.environ.get('DATABASE_URL', 'sinobridge-salt')


def _db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _hash_pw(password: str) -> str:
    return hashlib.sha256((password + 'sb').encode()).hexdigest()


def _make_token(seller_id: int) -> str:
    payload = f"{seller_id}.{int(time.time())}"
    sig = hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()[:24]
    raw = f"{payload}.{sig}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _parse_token(token: str):
    try:
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        parts = raw.split('.')
        seller_id, ts, sig = parts[0], parts[1], parts[2]
        payload = f"{seller_id}.{ts}"
        expected = hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()[:24]
        if hmac.compare_digest(sig, expected):
            return int(seller_id)
    except Exception:
        return None
    return None


def _resp(status: int, body: dict):
    return {'statusCode': status, 'headers': CORS, 'isBase64Encoded': False, 'body': json.dumps(body)}


def handler(event: dict, context) -> dict:
    '''Личный кабинет продавца: регистрация, вход, товары, заявки и статистика.'''
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
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
    seller_id = _parse_token(token) if token else None

    conn = _db()
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if action == 'register' and method == 'POST':
            company = (body.get('company_name') or '').strip()
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            if not company or not email or not password:
                return _resp(400, {'error': 'Заполните все поля'})
            cur.execute("SELECT id FROM sellers WHERE email = %s", (email,))
            if cur.fetchone():
                return _resp(409, {'error': 'Email уже зарегистрирован'})
            cur.execute(
                "INSERT INTO sellers (company_name, email, password_hash, province, category) "
                "VALUES (%s, %s, %s, %s, %s) RETURNING id, company_name, email, plan",
                (company, email, _hash_pw(password), body.get('province'), body.get('category')),
            )
            row = cur.fetchone()
            return _resp(200, {'token': _make_token(row['id']), 'seller': dict(row)})

        if action == 'login' and method == 'POST':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            cur.execute(
                "SELECT id, company_name, email, plan, password_hash FROM sellers WHERE email = %s",
                (email,),
            )
            row = cur.fetchone()
            if not row or row['password_hash'] != _hash_pw(password):
                return _resp(401, {'error': 'Неверный email или пароль'})
            seller = {'id': row['id'], 'company_name': row['company_name'], 'email': row['email'], 'plan': row['plan']}
            return _resp(200, {'token': _make_token(row['id']), 'seller': seller})

        if seller_id is None:
            return _resp(401, {'error': 'Требуется авторизация'})

        if action == 'dashboard' and method == 'GET':
            cur.execute("SELECT id, company_name, email, plan FROM sellers WHERE id = %s", (seller_id,))
            seller = cur.fetchone()
            cur.execute(
                "SELECT id, name, category, price, description, image_url, status, views, created_at "
                "FROM products WHERE seller_id = %s ORDER BY created_at DESC",
                (seller_id,),
            )
            products = cur.fetchall()
            cur.execute(
                "SELECT id, buyer_name, buyer_contact, message, status, created_at "
                "FROM leads WHERE seller_id = %s ORDER BY created_at DESC",
                (seller_id,),
            )
            leads = cur.fetchall()
            total_views = sum(p['views'] or 0 for p in products)
            stats = {
                'views': total_views,
                'leads': len(leads),
                'products': len(products),
            }
            return _resp(200, {
                'seller': dict(seller) if seller else None,
                'products': [dict(p) for p in products],
                'leads': [dict(l) for l in leads],
                'stats': stats,
            }, )

        if action == 'add_product' and method == 'POST':
            name = (body.get('name') or '').strip()
            if not name:
                return _resp(400, {'error': 'Укажите название товара'})
            cur.execute(
                "INSERT INTO products (seller_id, name, category, price, description, image_url) "
                "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, name, category, price, description, image_url, status, views, created_at",
                (
                    seller_id,
                    name,
                    body.get('category'),
                    body.get('price'),
                    body.get('description'),
                    body.get('image_url'),
                ),
            )
            return _resp(200, {'product': dict(cur.fetchone())})

        if action == 'delete_product' and method == 'POST':
            pid = body.get('id')
            cur.execute(
                "UPDATE products SET status = 'Удалён' WHERE id = %s AND seller_id = %s",
                (pid, seller_id),
            )
            return _resp(200, {'ok': True})

        if action == 'lead_status' and method == 'POST':
            cur.execute(
                "UPDATE leads SET status = %s WHERE id = %s AND seller_id = %s",
                (body.get('status', 'Новая'), body.get('id'), seller_id),
            )
            return _resp(200, {'ok': True})

        return _resp(404, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()
