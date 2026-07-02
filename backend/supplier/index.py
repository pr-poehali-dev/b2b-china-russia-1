import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}

SCHEMA = 't_p93404869_b2b_china_russia_1'


def _db():
    dsn = os.environ['DATABASE_URL']
    sep = '&' if '?' in dsn else '?'
    dsn += f'{sep}options=-csearch_path%3D{SCHEMA}'
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    return conn, conn.cursor(cursor_factory=RealDictCursor)


def _resp(status: int, body: dict):
    return {'statusCode': status, 'headers': CORS, 'isBase64Encoded': False, 'body': json.dumps(body, default=str)}


def handler(event: dict, context) -> dict:
    '''Публичный профиль поставщика и отправка заявки от покупателя.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'isBase64Encoded': False, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'profile')
    seller_id = params.get('id')

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            body = {}

    conn, cur = _db()
    try:
        # --- PUBLIC PROFILE ---
        if action == 'profile' and method == 'GET':
            if not seller_id:
                return _resp(400, {'error': 'Укажите id поставщика'})
            cur.execute(
                "SELECT id, company_name, plan, description, province, category, "
                "wechat, whatsapp, telegram, website, logo_url, founded_year, employees, "
                "rating, reviews_count, created_at "
                "FROM sellers WHERE id = %s",
                (seller_id,)
            )
            seller = cur.fetchone()
            if not seller:
                return _resp(404, {'error': 'Поставщик не найден'})

            cur.execute(
                "SELECT id, name, category, price, description, image_url, views "
                "FROM products WHERE seller_id = %s AND status = 'Активен' ORDER BY views DESC",
                (seller_id,)
            )
            products = cur.fetchall()

            cur.execute(
                "SELECT id, name, issued_by, valid_until "
                "FROM certificates WHERE seller_id = %s ORDER BY created_at DESC",
                (seller_id,)
            )
            certs = cur.fetchall()

            cur.execute(
                "SELECT id, type, url, caption "
                "FROM media WHERE seller_id = %s ORDER BY created_at DESC",
                (seller_id,)
            )
            media = cur.fetchall()

            # Increment views for all active products
            if products:
                cur.execute(
                    "UPDATE products SET views = views + 1 WHERE seller_id = %s AND status = 'Активен'",
                    (seller_id,)
                )

            return _resp(200, {
                'seller': dict(seller),
                'products': [dict(p) for p in products],
                'certificates': [dict(c) for c in certs],
                'media': [dict(m) for m in media],
            })

        # --- LIST SUPPLIERS ---
        if action == 'list' and method == 'GET':
            province = params.get('province')
            category = params.get('category')
            search = params.get('q')
            plan = params.get('plan')

            conditions = ['1=1']
            args = []

            if province:
                conditions.append('province = %s')
                args.append(province)
            if category:
                conditions.append('category = %s')
                args.append(category)
            if plan:
                conditions.append('plan = %s')
                args.append(plan)
            if search:
                conditions.append('(company_name ILIKE %s OR description ILIKE %s OR category ILIKE %s)')
                args += [f'%{search}%', f'%{search}%', f'%{search}%']

            where = ' AND '.join(conditions)
            order = "CASE plan WHEN 'Platinum' THEN 0 WHEN 'Gold' THEN 1 WHEN 'Premium' THEN 2 ELSE 3 END, rating DESC"

            cur.execute(
                f"SELECT id, company_name, plan, province, category, logo_url, rating, reviews_count, description "
                f"FROM sellers WHERE {where} ORDER BY {order} LIMIT 50",
                args
            )
            sellers = cur.fetchall()
            return _resp(200, {'sellers': [dict(s) for s in sellers]})

        # --- SEND LEAD ---
        if action == 'send_lead' and method == 'POST':
            sid = body.get('seller_id')
            name = (body.get('buyer_name') or '').strip()
            contact = (body.get('buyer_contact') or '').strip()
            message = (body.get('message') or '').strip()

            if not sid or not name or not contact:
                return _resp(400, {'error': 'Заполните имя и контакт'})

            cur.execute(
                "INSERT INTO leads (seller_id, buyer_name, buyer_contact, message) "
                "VALUES (%s, %s, %s, %s) RETURNING id",
                (sid, name, contact, message)
            )
            lead = cur.fetchone()
            return _resp(200, {'ok': True, 'lead_id': lead['id']})

        # --- CONTACT REQUEST (главная форма) ---
        if action == 'contact' and method == 'POST':
            name = (body.get('name') or '').strip()
            email = (body.get('email') or '').strip()
            phone = (body.get('phone') or '').strip()
            if not name or (not email and not phone):
                return _resp(400, {'error': 'Укажите имя и email или телефон'})
            cur.execute(
                "INSERT INTO contact_requests "
                "(name, company, email, phone, product_interest, budget, quantity, message) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (
                    name,
                    body.get('company', ''),
                    email,
                    phone,
                    body.get('product_interest', ''),
                    body.get('budget', ''),
                    body.get('quantity', ''),
                    body.get('message', ''),
                )
            )
            req = cur.fetchone()
            return _resp(200, {'ok': True, 'id': req['id']})

        return _resp(404, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()