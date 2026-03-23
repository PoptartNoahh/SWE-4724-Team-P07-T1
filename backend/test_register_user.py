import os
import sys
from pathlib import Path

from dotenv import load_dotenv
import pyodbc


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

    from backend.auth_utils import hash_password

    load_dotenv()

    required = ["DB_SERVER", "DB_NAME", "DB_USER", "DB_PASSWORD"]
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        raise RuntimeError(f"Missing required env vars: {missing}")

    def get_db_connection() -> pyodbc.Connection:
        return pyodbc.connect(
            "DRIVER={ODBC Driver 18 for SQL Server};"
            f"SERVER={os.getenv('DB_SERVER')};"
            f"DATABASE={os.getenv('DB_NAME')};"
            f"UID={os.getenv('DB_USER')};"
            f"PWD={os.getenv('DB_PASSWORD')};"
            "Encrypt=yes;"
            "TrustServerCertificate=yes;"
        )

    username = "tadmin"
    email = "tadmin@kennesaw.edu"
    password = "Password_1"
    role = 1

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM USERS WHERE user_name = ?", username)
        if cursor.fetchone():
            print("Username already exists; no insert performed.")
            return

        hashed_pw = hash_password(password)
        cursor.execute(
            """
            INSERT INTO Users (user_name, user_email, user_password, user_role)
            VALUES (?, ?, ?, ?)
            """,
            username,
            email,
            hashed_pw,
            role,
        )
        conn.commit()

        print("OK: User Created")
    except Exception as e:
        print("ERROR:", type(e).__name__, str(e))
        raise
    finally:
        try:
            conn.close()
        except Exception:
            pass


if __name__ == "__main__":
    main()

