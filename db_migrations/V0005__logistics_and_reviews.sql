CREATE TABLE t_p93404869_b2b_china_russia_1.logistics (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  routes TEXT,
  transit_time VARCHAR(100),
  min_weight VARCHAR(50),
  phone VARCHAR(50),
  email VARCHAR(100),
  website VARCHAR(255),
  telegram VARCHAR(100),
  wechat VARCHAR(100),
  rating NUMERIC(3,1) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE t_p93404869_b2b_china_russia_1.logistics_reviews (
  id SERIAL PRIMARY KEY,
  logistics_id INTEGER NOT NULL REFERENCES t_p93404869_b2b_china_russia_1.logistics(id),
  author VARCHAR(100) NOT NULL,
  company VARCHAR(100),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logistics_reviews ON t_p93404869_b2b_china_russia_1.logistics_reviews(logistics_id);

INSERT INTO t_p93404869_b2b_china_russia_1.logistics (company_name, type, description, routes, transit_time, min_weight, phone, email, website, telegram, rating, reviews_count, featured)
VALUES
(
  'ChinaFreight Pro',
  'Морские перевозки',
  'Специализируемся на контейнерных перевозках из Китая в Россию с 2012 года. FCL и LCL, все основные порты КНР. Таможенное оформление под ключ, страхование груза.',
  'Шанхай → Санкт-Петербург, Нинбо → Владивосток, Гуанчжоу → Новороссийск',
  '18–35 дней',
  '100 кг',
  '+7 495 111-22-33',
  'info@chinafreight.ru',
  'https://chinafreight.ru',
  '@chinafreight_pro',
  4.9,
  48,
  TRUE
),
(
  'RailBridge Logistics',
  'Ж/д перевозки',
  'Железнодорожные перевозки из Китая через погранпереходы Забайкальск и Наушки. Работаем с любыми видами грузов, включая опасные. Собственный парк вагонов.',
  'Пекин → Москва, Гуандун → Новосибирск, Урумчи → Екатеринбург',
  '12–20 дней',
  '500 кг',
  '+7 495 222-33-44',
  'info@railbridge.ru',
  'https://railbridge.ru',
  '@railbridge_ru',
  4.8,
  32,
  TRUE
),
(
  'AirCargo Express',
  'Авиаперевозки',
  'Срочная доставка авиагрузов из Китая в Россию. Прямые рейсы и консолидация. Специализируемся на электронике, фармацевтике и скоропортящихся товарах.',
  'Пекин → Москва Шереметьево, Шанхай → Новосибирск, Гуанчжоу → Екатеринбург',
  '3–7 дней',
  '1 кг',
  '+7 495 333-44-55',
  'info@aircargo-express.ru',
  'https://aircargo-express.ru',
  '@aircargo_express',
  4.7,
  27,
  FALSE
),
(
  'SilkRoad Auto',
  'Автоперевозки',
  'Автомобильные грузоперевозки по маршруту Китай–Казахстан–Россия. Подходит для негабаритных грузов и сборных партий. Возможна доставка «от двери до двери».',
  'Урумчи → Алматы → Москва, Пекин → Астана → Уфа',
  '15–25 дней',
  '200 кг',
  '+7 495 444-55-66',
  'info@silkroad-auto.ru',
  'https://silkroad-auto.ru',
  '@silkroad_auto',
  4.6,
  19,
  FALSE
);

INSERT INTO t_p93404869_b2b_china_russia_1.logistics_reviews (logistics_id, author, company, rating, text)
VALUES
(1, 'Алексей Петров', 'ООО «ТехноИмпорт»', 5, 'Отличная компания! Перевозили оборудование из Шэньчжэня, всё пришло в срок и в целости. Таможня была оформлена без нашего участия.'),
(1, 'Марина Козлова', 'ИП Козлова М.А.', 5, 'Уже 3-й раз работаем с ChinaFreight. Цены честные, менеджеры всегда на связи, документы в порядке.'),
(1, 'Дмитрий Орлов', 'Торговый дом «Восток»', 4, 'Хорошая работа, груз пришёл на 2 дня позже заявленного, но предупредили заранее. В целом доволен.'),
(2, 'Сергей Иванов', 'ООО «РусЛогистика»', 5, 'Железнодорожная доставка из Гуандуна — лучший выбор по цене/срокам. RailBridge отработали идеально.'),
(2, 'Ольга Смирнова', 'Фабрика «Уют»', 5, 'Перевозили текстиль 3 контейнера. Всё чётко, документация полная, ни одного вопроса от таможни.'),
(3, 'Виктор Нечаев', 'МедТех Групп', 5, 'Срочная доставка медоборудования — 4 дня из Пекина. Просто отлично. Рекомендую для срочных отправок.'),
(3, 'Анна Белова', 'ООО «ЭлектроПлюс»', 4, 'Авиа дорогая, но когда нужно срочно — незаменимо. Груз дошёл за 5 дней, всё в порядке.'),
(4, 'Павел Громов', 'ИП Громов П.С.', 4, 'Забрали товар прямо со склада в Урумчи. Удобно, хотя задержались на таможне на 2 дня.'),
(4, 'Наталья Фёдорова', 'Строй-Импорт', 5, 'Негабаритное оборудование доставили без проблем. Автомобильный маршрут через Казахстан — оптимально.');