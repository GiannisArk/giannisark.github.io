from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import sqlite3
import base64
from rapidfuzz import fuzz, process

app = Flask(__name__)
CORS(app)

DATABASE = 'user_data_access.db'

def get_db_cursor():
    return sqlite3.connect(DATABASE)

def searchByName(name, cursor):
    keys = ("versionCode","version","package_name","icon","collect","share","collect_discr","share_discr","name","greek_name","downloads","type","mode")
    try:
        name = name.lower().translate(str.maketrans("ήίύέόώ", "ηιυεοω"))
        cursor.execute("SELECT name, greek_name FROM Data_Accessed")
        data = cursor.fetchall()
        names = set([elem for tpl in data for elem in tpl])
        matches = process.extract(name, names, scorer=fuzz.ratio, limit=5)
        candidate_names = [item[0] for item in matches]
        if not candidate_names:
            return default_result()

        placeholders = ','.join('?' for _ in candidate_names)
        cursor.execute(f"""
            SELECT * FROM Data_Accessed 
            WHERE name IN ({placeholders}) OR greek_name IN ({placeholders})
        """, candidate_names + candidate_names)

        data = cursor.fetchall()
        lst = []
        for cname in candidate_names:
            for item in data:
                if cname == item[8] or cname == item[9]:
                    result = dict(zip(keys, item))
                    result["icon"] = base64.b64encode(result["icon"]).decode('utf-8')
                    lst.append(result)
        return lst or default_result()
    except:
        return default_result()

def default_result():
    return [{
        "versionCode": "-", "version": "-", "package_name": "-", "icon": "-", 
        "collect": "-", "share": "-", "collect_discr": "-", "share_discr": "-", 
        "name": "-", "downloads": "-", "type": "-", "mode": "-"
    }]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search/<string:package_name>', methods=['GET'])
def get_app(package_name):
    conn = get_db_cursor()
    cursor = conn.cursor()
    keys = ("versionCode","version","package_name","icon","collect","share","collect_discr","share_discr","name","greek_name","downloads","type","mode")
    try:
        cursor.execute("SELECT * FROM Data_Accessed WHERE package_name=?", (package_name,))
        data = cursor.fetchone()
        if data:
            result = dict(zip(keys, data))
            result["icon"] = base64.b64encode(result["icon"]).decode('utf-8')
            return jsonify([result])
        return jsonify(searchByName(package_name, cursor))
    except:
        return jsonify(default_result())
    finally:
        conn.commit()
        conn.close()

@app.route('/top_downloads', methods=['GET'])
def get_top_downloads():
    conn = get_db_cursor()
    cursor = conn.cursor()
    keys = ("versionCode","version","package_name","icon","collect","share","collect_discr","share_discr","name","greek_name","downloads","type","mode")
    limit = request.args.get('limit', default=5, type=int)
    try:
        cursor.execute("""
            SELECT * FROM Data_Accessed 
            ORDER BY CAST(downloads AS INTEGER) DESC
            LIMIT ?
        """, (limit,))
        data = cursor.fetchall()
        results = []
        for item in data:
            result = dict(zip(keys, item))
            result["icon"] = base64.b64encode(result["icon"]).decode('utf-8')
            results.append(result)
        return jsonify(results or default_result())
    except:
        return jsonify(default_result())
    finally:
        conn.commit()
        conn.close()

if __name__ == '__main__':
    app.run(debug=True)
