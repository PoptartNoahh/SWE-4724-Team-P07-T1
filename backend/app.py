import os
from dotenv import load_dotenv
import pyodbc
load_dotenv()  

conn = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    f"SERVER={os.getenv('DB_SERVER')};"
    f"DATABASE={os.getenv('DB_NAME')};"
    f"UID={os.getenv('DB_USER')};"
    f"PWD={os.getenv('DB_PASSWORD')};"
    "Encrypt=yes;"
    "TrustServerCertificate=yes;"
)

#conn = pyodbc.connect(os.getenv("DB_CONN_STR"))


cursor = conn.cursor()
cursor.execute("""
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA, TABLE_NAME;
""")
print([row.TABLE_NAME for row in cursor.fetchall()])