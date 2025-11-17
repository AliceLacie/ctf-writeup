CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(95) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    balance INT DEFAULT 100000 NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    author VARCHAR(95) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS goods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    price INT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS sales_goods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    price INT NOT NULL,
    author VARCHAR(95) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
    visible BOOLEAN DEFAULT FALSE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS buy_history (
    username VARCHAR(95) REFERENCES users(username) ON DELETE CASCADE ON UPDATE CASCADE,
    goods_id UUID REFERENCES goods(id) ON DELETE CASCADE,
    sales_goods_id UUID REFERENCES sales_goods(id) ON DELETE CASCADE,
    price INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flag (
    flag VARCHAR(200)
);

INSERT INTO goods (name, price, description) VALUES ('절대 우산', 1000, '우산');
INSERT INTO goods (name, price, description) VALUES ('절대 색연필', 2000, '색연필');
INSERT INTO goods (name, price, description) VALUES ('절대 시계', 3000, '시계');
INSERT INTO flag (flag) VALUES ('cce2025{fake-flag}');

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user LOGIN PASSWORD 'app_password';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE cce_database TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

GRANT SELECT ON posts TO app_user;
GRANT SELECT ON goods TO app_user;
GRANT SELECT ON flag TO app_user;

GRANT SELECT, INSERT, UPDATE ON users TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON sales_goods TO app_user;
GRANT SELECT, INSERT ON buy_history TO app_user;