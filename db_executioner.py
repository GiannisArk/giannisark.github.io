import os
import sqlite3
import base64

def convertToBinaryData(filename):
    # Convert digital data to binary format
    with open(filename, 'rb') as file:
        blobData = file.read()
    return blobData

# Connect to SQLite and create a database file
conn = sqlite3.connect('./user_data_access.db')

# Create a cursor object using the connection
cursor = conn.cursor()

def getAppDataShared(package_name):
	try:
		qry = "SELECT * FROM Shared_Data WHERE package_name=?"         
		cursor.execute(qry, (package_name, ))
		results = list(cursor.fetchall()[0])
		print(results[0],",",results[1],",",base64.b64encode(results[2]),",",results[3])

	except sqlite3.Error as e:
		print (e)

getAppDataShared("aceviral.dragoncraft")

# Save (commit) the changes
conn.commit()

# Close the connection to the database
conn.close()

