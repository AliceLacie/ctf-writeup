from flask import Flask, render_template, request, jsonify, redirect, url_for, session, g
from pg8000.native import Connection
from utils import run_sql
import os
from hashlib import sha256
from functools import wraps

app = Flask(__name__)
app.secret_key = os.urandom(24)

POSTGRES_HOST=os.getenv('POSTGRES_HOST', 'localhost')
POSTGRES_DB=os.getenv('POSTGRES_DB', 'cce_database')
POSTGRES_USER=os.getenv('POSTGRES_USER', 'app_user')
POSTGRES_PASSWORD=os.getenv('POSTGRES_PASSWORD', 'app_password')
POSTGRES_PORT=os.getenv('POSTGRES_PORT', 5432)

conn = Connection(
    host=POSTGRES_HOST,
    port=POSTGRES_PORT,
    database=POSTGRES_DB,
    user=POSTGRES_USER,
    password=POSTGRES_PASSWORD,
)

def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get('username'):
            return redirect(url_for('login', next=request.path))
        return view(*args, **kwargs)
    return wrapped


@app.before_request
def load_current_user():
    g.user = session.get('username')


@app.route('/')
def index():
    if not session.get('username'):
        return redirect(url_for('login'))
    return render_template('index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')
    username = request.form.get('username')
    password = request.form.get('password')
    if not username or not password:
        return render_template('login.html', error='아이디/비밀번호를 입력하세요.'), 400
    rows = run_sql(conn, "SELECT password_hash FROM users WHERE username=$1", (username,))
    if not rows or not sha256(password.encode()).hexdigest() == rows[0][0]:
        return render_template('login.html', error='로그인 실패. 계정 정보를 확인하세요.'), 401
    session['username'] = username
    next_url = request.args.get('next') or url_for('index')
    return redirect(next_url)


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        return render_template('register.html')
    username = request.form.get('username')
    password = request.form.get('password')
    email = request.form.get('email')
    if not username or not password or not email:
        return render_template('register.html', error='모든 필드를 입력하세요.'), 400
    try:
        if len(username) > 10:
            return render_template('register.html', error='아이디는 10자 이하여야 합니다.'), 400
        password_hash = sha256(password.encode()).hexdigest()
        res = run_sql(conn, "INSERT INTO users (username, password_hash, email) VALUES ($1,$2,$3)", (username, password_hash, email))
        if res == False:
            return render_template('register.html', error='error'), 400
        session['username'] = username
        return redirect(url_for('index'))
    except Exception:
        return render_template('register.html', error='error'), 400


@app.post('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))


@app.get('/board')
@login_required
def board_list_page():
    rows = run_sql(conn, "SELECT id, title, content, author FROM posts ORDER BY title")
    items = [{
        "id": str(r[0]),
        "title": r[1],
        "content": r[2],
        "author": r[3]
    } for r in rows]
    return render_template('board_list.html', posts=items)


@app.route('/board/new', methods=['GET', 'POST'])
@login_required
def board_new_page():
    if request.method == 'GET' and session.get('username') == 'admin':
        return render_template('board_new.html')
    elif request.method == 'GET' and session.get('username') != 'admin':
        return redirect(url_for('index'))
    if session.get('username') != 'admin':
        return redirect(url_for('index'))
    title = request.form.get('title')
    content = request.form.get('content')
    author = session.get('username')
    if not title or not author:
        return render_template('board_new.html', error="제목과 작성자가 필요합니다."), 400
    try:
        run_sql(conn, "INSERT INTO posts (title, content, author) VALUES ($1, $2, $3)", (title, content, author))
        return redirect(url_for('board_list_page'))
    except Exception:
        return render_template('board_new.html', error='error'), 400


def _ensure_non_negative_price(value):
    try:
        iv = int(value)
    except Exception:
        raise ValueError("error 1")
    if iv < 0:
        raise ValueError("error 2")
    return iv

@app.get('/store')
@login_required
def store_list_page():
    rows = run_sql(conn, "SELECT id, name, price, description FROM goods ORDER BY name", ())
    items = [{
        "id": str(r[0]),
        "name": r[1],
        "price": r[2],
        "description": r[3]
    } for r in rows]
    return render_template('goods_list.html', goods=items)


@app.post('/store/<id>/buy')
@login_required
def store_buy_page(id):
    username = session.get('username')
    if not username:
        return redirect(url_for('store_list_page'))
    try:
        res = run_sql(conn, "SELECT price FROM goods WHERE id=$1", (id,))
        if not res:
            return redirect(url_for('store_list_page'))
        price = res[0][0]
        conn.run("BEGIN")
        updated = run_sql(conn, "UPDATE users SET balance=balance-$1 WHERE username=$2 AND balance>=$1 RETURNING balance", (price, username))
        if not updated:
            conn.run("ROLLBACK")
            return redirect(url_for('store_list_page'))
        run_sql(conn, "INSERT INTO buy_history (username, goods_id, price) VALUES ($1, $2, $3)", (username, id, price))
        conn.run("COMMIT")
        return redirect(url_for('store_list_page'))
    except Exception:
        try:
            conn.run("ROLLBACK")
        except Exception as e:
            pass
        return redirect(url_for('store_list_page'))


@app.get('/market')
@login_required
def market_list_page():
    rows = run_sql(conn, "SELECT id, name, price, author, description FROM sales_goods WHERE author=$1 ORDER BY name", (session.get('username'),))
    items = [{
        "id": str(r[0]),
        "name": r[1],
        "price": r[2],
        "author": r[3],
        "description": r[4]
    } for r in rows]
    return render_template('sales_list.html', goods=items)


@app.route('/market/new', methods=['GET', 'POST'])
@login_required
def market_new_page():
    if request.method == 'GET':
        return render_template('sales_new.html')
    name = request.form.get('name')
    price = request.form.get('price')
    author = session.get('username')
    description = request.form.get('description')
    if not name or price is None or not author:
        return render_template('sales_new.html', error="이름/가격/작성자가 필요합니다."), 400
    try:
        price_int = _ensure_non_negative_price(price)
        run_sql(conn, "INSERT INTO sales_goods (name, price, author, description) VALUES ($1, $2, $3, $4)", (name, price_int, author, description))
        return redirect(url_for('market_list_page'))
    except Exception:
        return render_template('sales_new.html', error='error'), 400

@app.post('/market/<id>/edit')
@login_required
def market_edit_page(id):
    rows = run_sql(conn, "SELECT author FROM sales_goods WHERE id=$1", (id,))
    if not rows or rows[0][0] != session.get('username'):
        return jsonify({'error': '권한이 없습니다.'}), 403
    
    name = request.form.get('name')
    price_int = int(request.form.get('price'))
    description = request.form.get('description')
    visible = bool(request.form.get('visible', False))
    if not name or price_int is None or not description:
        return jsonify({'error': '이름/가격이 필요합니다.'}), 400
    try:
        run_sql(conn, "UPDATE sales_goods SET name=$1, price=$2, description=$3, visible=$4 WHERE id=$5", (name, price_int, description, visible, id))
        return redirect(url_for('market_list_page'))
    except Exception:
        return jsonify({'error': 'error'}), 400

@app.post('/market/<id>/buy')
@login_required
def market_buy_page(id):
    buyer = session.get('username')
    if not buyer:
        return redirect(url_for('market_list_page'))
    try:
        res = run_sql(conn, "SELECT price, author FROM sales_goods WHERE id=$1", (id,))
        if not res:
            return redirect(url_for('market_list_page'))
        price, author = res[0][0], res[0][1]
        conn.run("BEGIN")
        dec = run_sql(conn, "UPDATE users SET balance=balance-$1 WHERE username=$2 AND balance>=$1 RETURNING balance", (price, buyer))
        if not dec:
            conn.run("ROLLBACK")
            return redirect(url_for('market_list_page'))
        inc = run_sql(conn, "UPDATE users SET balance=balance+$1 WHERE username=$2 RETURNING balance", (price, author))
        if not inc:
            conn.run("ROLLBACK")
            return redirect(url_for('market_list_page'))
        run_sql(conn, "INSERT INTO buy_history (username, sales_goods_id, price) VALUES ($1, $2, $3)", (buyer, id, price))
        conn.run("COMMIT")
        return redirect(url_for('market_list_page'))
    except Exception:
        try:
            conn.run("ROLLBACK")
        except Exception:
            pass
        return redirect(url_for('market_list_page'))
    

@app.post('/market/<id>/donate')
@login_required
def market_donate_page(id):
    donor = session.get('username')
    amount = request.form.get('amount')
    if not donor or amount is None:
        return redirect(url_for('market_list_page'))
    try:
        amt = int(amount)
        if amt <= 0:
            return redirect(url_for('market_list_page'))
        res = run_sql(conn, "SELECT author FROM sales_goods WHERE id=$1", (id,))
        if not res:
            return redirect(url_for('market_list_page'))
        author = res[0][0]
        conn.run("BEGIN")
        dec = run_sql(conn, "UPDATE users SET balance= balance - $1 WHERE username= $2 AND balance>= $1 RETURNING balance", (amt, donor))
        if not dec:
            conn.run("ROLLBACK")
            return redirect(url_for('market_list_page'))
        inc = run_sql(conn, "UPDATE users SET balance= balance + $1 WHERE username= $2 RETURNING balance", (amt, author))
        if not inc:
            conn.run("ROLLBACK")
            return redirect(url_for('market_list_page'))
        conn.run("COMMIT")
        return redirect(url_for('market_list_page'))
    except Exception:
        try:
            conn.run("ROLLBACK")
        except Exception:
            pass
        return redirect(url_for('market_list_page'))


@app.route('/profile/<username>', methods=['GET', 'POST'])
@login_required
def profile_page(username):
    if session.get('username') != username:
        return redirect(url_for('profile_page', username=session.get('username')))
    rows = run_sql(conn, "SELECT username, email, balance FROM users WHERE username=$1", (username,))
    user = None
    if rows:
        user = {"username": rows[0][0], "email": rows[0][1], "balance": rows[0][2]}
    return render_template('profile.html', user=user)


@app.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def profile_edit_page():
    username = session.get('username')
    email = request.form.get('email')
    password = request.form.get('password')
    edit_username = request.form.get('edit_username')

    if not email:
        return jsonify({'error': '이메일을 입력하세요.'}), 400
    if not password:
        return jsonify({'error': '비밀번호를 입력하세요.'}), 400
    
    rows = run_sql(conn, "SELECT password_hash FROM users WHERE username=$1", (username,))
    if not rows or not sha256(password.encode()).hexdigest() == rows[0][0]:
        return jsonify({'error': '비밀번호가 일치하지 않습니다.'}), 400
    
    rows = run_sql(conn, "SELECT username FROM users WHERE username=$1", (edit_username,))
    if rows:
        return jsonify({'error': '이미 존재하는 아이디입니다.'}), 400
    
    rows = run_sql(conn, "UPDATE users SET email=$1, username=$2 WHERE username=$3", (email, edit_username, username))
    if rows == False:
        return jsonify({'error': 'error'}), 400
    rows = run_sql(conn, "SELECT username, email, balance FROM users WHERE username=$1", (edit_username,))
    user = None
    if rows:
        user = {"username": rows[0][0], "email": rows[0][1], "balance": rows[0][2]}
    session['username'] = edit_username
    return render_template('profile.html', user=user)

@app.route('/history')
@login_required
def history_page():
    username = session.get('username')
    rows = run_sql(conn, "SELECT * FROM buy_history WHERE username=$1 ORDER BY timestamp DESC", (username,))
    items = [{
        "username": r[0],
        "goods_id": str(r[1]),
        "sales_goods_id": str(r[2]),
        "price": r[3],
        "timestamp": r[4]
    } for r in rows]
    return render_template('history.html', history=items)

if __name__ == '__main__':
    app.run(port=5011, host='0.0.0.0')