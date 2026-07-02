import json
import os
import re
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

SCHEMA = 't_p93404869_b2b_china_russia_1'
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', 'chinabridge-admin-2026')


def _db():
    dsn = os.environ['DATABASE_URL']
    sep = '&' if '?' in dsn else '?'
    dsn += f'{sep}options=-csearch_path%3D{SCHEMA}'
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    return conn, conn.cursor(cursor_factory=RealDictCursor)


def _resp(status: int, body: dict):
    return {'statusCode': status, 'headers': CORS, 'isBase64Encoded': False, 'body': json.dumps(body, default=str)}


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[аА]', 'a', text); text = re.sub(r'[бБ]', 'b', text)
    text = re.sub(r'[вВ]', 'v', text); text = re.sub(r'[гГ]', 'g', text)
    text = re.sub(r'[дД]', 'd', text); text = re.sub(r'[еЕёЁ]', 'e', text)
    text = re.sub(r'[жЖ]', 'zh', text); text = re.sub(r'[зЗ]', 'z', text)
    text = re.sub(r'[иИ]', 'i', text); text = re.sub(r'[йЙ]', 'y', text)
    text = re.sub(r'[кК]', 'k', text); text = re.sub(r'[лЛ]', 'l', text)
    text = re.sub(r'[мМ]', 'm', text); text = re.sub(r'[нН]', 'n', text)
    text = re.sub(r'[оО]', 'o', text); text = re.sub(r'[пП]', 'p', text)
    text = re.sub(r'[рР]', 'r', text); text = re.sub(r'[сС]', 's', text)
    text = re.sub(r'[тТ]', 't', text); text = re.sub(r'[уУ]', 'u', text)
    text = re.sub(r'[фФ]', 'f', text); text = re.sub(r'[хХ]', 'kh', text)
    text = re.sub(r'[цЦ]', 'ts', text); text = re.sub(r'[чЧ]', 'ch', text)
    text = re.sub(r'[шШ]', 'sh', text); text = re.sub(r'[щЩ]', 'sch', text)
    text = re.sub(r'[ъЪьЬ]', '', text); text = re.sub(r'[ыЫ]', 'y', text)
    text = re.sub(r'[эЭ]', 'e', text); text = re.sub(r'[юЮ]', 'yu', text)
    text = re.sub(r'[яЯ]', 'ya', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')[:80]


def handler(event: dict, context) -> dict:
    '''Блог: публичный список и статьи + CRUD для администратора.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'isBase64Encoded': False, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'list')
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
    is_admin = token == ADMIN_TOKEN

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            body = {}

    conn, cur = _db()
    try:
        # --- PUBLIC: LIST ---
        if action == 'list' and method == 'GET':
            tag = params.get('tag')
            q = params.get('q')
            conditions = ['published = TRUE']
            args = []
            if tag:
                conditions.append('tag = %s')
                args.append(tag)
            if q:
                conditions.append('(title ILIKE %s OR excerpt ILIKE %s)')
                args += [f'%{q}%', f'%{q}%']
            where = ' AND '.join(conditions)
            cur.execute(
                f"SELECT id, title, slug, excerpt, cover_url, tag, author, views, published_at "
                f"FROM articles WHERE {where} ORDER BY published_at DESC LIMIT 20",
                args
            )
            articles = cur.fetchall()
            cur.execute("SELECT DISTINCT tag FROM articles WHERE published = TRUE ORDER BY tag")
            tags = [r['tag'] for r in cur.fetchall()]
            return _resp(200, {'articles': [dict(a) for a in articles], 'tags': tags})

        # --- PUBLIC: SINGLE ARTICLE ---
        if action == 'get' and method == 'GET':
            slug = params.get('slug')
            if not slug:
                return _resp(400, {'error': 'Укажите slug'})
            cur.execute(
                "SELECT id, title, slug, excerpt, content, cover_url, tag, author, views, published_at "
                "FROM articles WHERE slug = %s AND published = TRUE",
                (slug,)
            )
            article = cur.fetchone()
            if not article:
                return _resp(404, {'error': 'Статья не найдена'})
            cur.execute("UPDATE articles SET views = views + 1 WHERE id = %s", (article['id'],))
            cur.execute(
                "SELECT id, title, slug, cover_url, tag, published_at FROM articles "
                "WHERE published = TRUE AND id != %s ORDER BY published_at DESC LIMIT 3",
                (article['id'],)
            )
            related = cur.fetchall()
            return _resp(200, {'article': dict(article), 'related': [dict(r) for r in related]})

        # --- ADMIN ONLY ---
        if not is_admin:
            return _resp(403, {'error': 'Требуется токен администратора'})

        if action == 'list_all' and method == 'GET':
            cur.execute(
                "SELECT id, title, slug, tag, published, views, created_at, published_at "
                "FROM articles ORDER BY created_at DESC"
            )
            return _resp(200, {'articles': [dict(a) for a in cur.fetchall()]})

        if action == 'create' and method == 'POST':
            title = (body.get('title') or '').strip()
            if not title:
                return _resp(400, {'error': 'Укажите заголовок'})
            slug = _slugify(title) + '-' + str(int(time.time()))[-6:]
            cur.execute(
                "INSERT INTO articles (title, slug, excerpt, content, cover_url, tag, author, published, published_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW()) RETURNING *",
                (
                    title,
                    slug,
                    body.get('excerpt', ''),
                    body.get('content', ''),
                    body.get('cover_url'),
                    body.get('tag', 'Новости'),
                    body.get('author', 'Редакция ChineseBridge'),
                    body.get('published', False),
                )
            )
            return _resp(200, {'article': dict(cur.fetchone())})

        if action == 'update' and method == 'POST':
            aid = body.get('id')
            if not aid:
                return _resp(400, {'error': 'Укажите id'})
            published = body.get('published', False)
            cur.execute(
                "UPDATE articles SET title=%s, excerpt=%s, content=%s, cover_url=%s, tag=%s, "
                "author=%s, published=%s, published_at=CASE WHEN %s THEN NOW() ELSE published_at END "
                "WHERE id=%s RETURNING *",
                (
                    body.get('title'), body.get('excerpt'), body.get('content'),
                    body.get('cover_url'), body.get('tag'), body.get('author'),
                    published, published, aid,
                )
            )
            article = cur.fetchone()
            if not article:
                return _resp(404, {'error': 'Статья не найдена'})
            return _resp(200, {'article': dict(article)})

        if action == 'toggle_publish' and method == 'POST':
            aid = body.get('id')
            cur.execute(
                "UPDATE articles SET published = NOT published, "
                "published_at = CASE WHEN NOT published THEN NOW() ELSE published_at END "
                "WHERE id = %s RETURNING id, published",
                (aid,)
            )
            row = cur.fetchone()
            return _resp(200, {'ok': True, 'published': row['published'] if row else False})

        return _resp(404, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()