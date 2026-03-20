import pypyodbc as odbc # pip install pypyodbc

DRIVER_NAME = 'SQL SERVER'
SERVER_NAME = 'ccse-mip-server'
DATABASE_NAME = 'ccse-mip-db'

connection_string = f"""
    DRIVER={{{DRIVER_NAME}}};
    SERVER={SERVER_NAME};
    DATABASE={DATABASE_NAME};
    Trust_Connection=yes;
    uid=jsmi1518@students.kennesaw.edu;
    pwd=MIP-Capstone2026!;
"""

conn = odbc.connect(connection_string)
print(conn)