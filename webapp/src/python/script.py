import pymysql
from pymysql.err import OperationalError

def connect_to_database(host, user, password, database):
    try:
        connection = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=database,
            port=3306, 
            cursorclass=pymysql.cursors.DictCursor 
        )
        print("Connection established successfully.")
        return connection
    except OperationalError as e:
        print(f"Error connecting to the database: {e}")
        return None

if __name__ == "__main__":
    host = ""
    user = ""
    password = ""
    database = ""
    db_connection = connect_to_database(host, user, password, database)

    if db_connection:
        db_connection.close()