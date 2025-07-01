from flask import Flask, jsonify, request
from flask_cors import CORS  # To allow frontend to access API
import sqlite3
import base64
from rapidfuzz import fuzz, process

app = Flask(__name__)
CORS(app)

DATABASE = 'user_data_access.db'

def get_db_cursor():
    conn = sqlite3.connect(DATABASE)
    return conn

def searchByName(name, cursor):
    keys = ("versionCode","version","package_name","icon","collect","share","collect_discr","share_discr","name","greek_name","downloads","type","mode")
    try:
        name = name.replace("ή","η").replace("ί","ι").replace("ύ","υ").replace("έ","ε").replace("ό","ο").replace("ώ","ω").lower()

        qry = "SELECT name, greek_name FROM Data_Accessed"         
        cursor.execute(qry)
        data = cursor.fetchall()
        
        names = set([elem for tpl in data for elem in tpl])
        query = name.lower()

        # Get best matches (limit 1) Make it more later
        matches = process.extract(query, names, scorer=fuzz.ratio, limit=5)

        candidate_names = []
        for item in matches:
            # if item[1] > 40:
            candidate_names.append(item[0])

        placeholders = ','.join('?' for _ in candidate_names)
        # print(placeholders, candidate_names)


        qry = f"SELECT * FROM Data_Accessed WHERE name IN ({placeholders}) OR greek_name IN ({placeholders})"  
        cursor.execute(qry, candidate_names+candidate_names)
        data = cursor.fetchall()
        
        c=0
        lst = []
        for candidate_name in candidate_names:
            for item in data:
                if candidate_name==item[8] or candidate_name==item[9]:
                    result = dict(zip(keys, item))
                    result["icon"] = base64.b64encode(result["icon"]).decode('utf-8')
                    lst.append(result)
        
        results = lst

        if candidate_names==[]:
            results = [{"versionCode": "-", "version":"-", "package_name":"-","icon":"-","collect":"-", "share":"-", "collect_discr":"-", "share_discr":"-", "name":"-", "downloads":"-","type":"-", "mode":"-"}]

    except sqlite3.Error as e:
        results = [{"versionCode": "-", "version":"-", "package_name":"-","icon":"-","collect":"-", "share":"-", "collect_discr":"-", "share_discr":"-", "name":"-", "downloads":"-","type":"-", "mode":"-"}]

    return results


@app.route('/search/<string:package_name>', methods=['GET'])
def get_app(package_name):
    conn = get_db_cursor()
    cursor = conn.cursor()
    keys = ("versionCode","version","package_name","icon","collect","share","collect_discr","share_discr","name","greek_name","downloads","type","mode")
    try:
        qry = "SELECT * FROM Data_Accessed WHERE package_name=?"
        cursor.execute(qry, (package_name, ))
        data = cursor.fetchone()

        if data != None:
            result = dict(zip(keys, data))
            result["icon"] = base64.b64encode(result["icon"]).decode('utf-8')
            result = [result]
        else:
            result = searchByName(package_name, cursor)

    except sqlite3.Error as e:
        result = [{"versionCode": "-", "version":"-", "package_name":"-","icon":"-","collect":"-", "share":"-", "collect_discr":"-", "share_discr":"-", "name":"-", "downloads":"-","type":"-", "mode":"-"}]

    conn.commit()
    conn.close()

    return jsonify(result)

@app.route('/', methods=['GET'])
def get_default():
    return jsonify([{"versionCode": "-", "version":"-", "package_name":"-","icon":"-","collect":"-", "share":"-", "collect_discr":"-", "share_discr":"-", "name":"-", "downloads":"-","type":"-", "mode":"-"}])


@app.route('/list/', methods=['GET'])
def get_all():
    conn = get_db_cursor()
    cursor = conn.cursor()
    keys = ("versionCode","version","package_name","icon","collect","share","collect_discr","share_discr","name","greek_name","downloads","type","mode")
    try:
        qry = "SELECT * FROM Data_Accessed LIMIT 100"
        cursor.execute(qry)
        data = cursor.fetchall()

        results = []

        if data != None:
            for item in data:
                result = dict(zip(keys, item))
                result["icon"] = base64.b64encode(result["icon"]).decode('utf-8')
                results.append(result)

    except sqlite3.Error as e:
        results = [{"versionCode": "-", "version":"-", "package_name":"-","icon":"-","collect":"-", "share":"-", "collect_discr":"-", "share_discr":"-", "name":"-", "downloads":"-","type":"-", "mode":"-"}]

    conn.commit()
    conn.close()

    return jsonify(results)
@app.route('/top_downloads', methods=['GET'])
def get_top_downloads():
    conn = get_db_cursor()
    cursor = conn.cursor()
    keys = ("versionCode","version","package_name","icon","collect","share","collect_discr","share_discr","name","greek_name","downloads","type","mode")

    # Optional query param 'limit' to control how many top apps to return, default 5
    limit = request.args.get('limit', default=5, type=int)

    try:
        qry = f'''
            SELECT * FROM Data_Accessed 
            ORDER BY CAST(downloads AS INTEGER) DESC
            LIMIT ?
        '''
        cursor.execute(qry, (limit,))
        data = cursor.fetchall()

        results = []
        for item in data:
            result = dict(zip(keys, item))
            # Encode icon binary to base64 string
            result["icon"] = base64.b64encode(result["icon"]).decode('utf-8')
            results.append(result)

        if not results:
            results = [{"versionCode": "-", "version":"-", "package_name":"-","icon":"-","collect":"-", "share":"-", 
                        "collect_discr":"-", "share_discr":"-", "name":"-", "downloads":"-","type":"-", "mode":"-"}]

    except sqlite3.Error as e:
        results = [{"versionCode": "-", "version":"-", "package_name":"-","icon":"-","collect":"-", "share":"-", 
                    "collect_discr":"-", "share_discr":"-", "name":"-", "downloads":"-","type":"-", "mode":"-"}]

    conn.commit()
    conn.close()

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
