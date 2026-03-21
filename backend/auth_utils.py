import bcrypt


def hash_password(password: str) -> str:
    """
    Hash a user password for storage.

    NOTE: We intentionally avoid passlib+Ultra-old bcrypt integration here because
    the currently-installed `bcrypt` module is not compatible with passlib's
    version-detection path in this environment.
    """
    pw_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed_bytes = bcrypt.hashpw(pw_bytes, salt)
    # DB column `user_password` expects a string value.
    return hashed_bytes.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    pw_bytes = plain_password.encode("utf-8")
    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(pw_bytes, hashed_bytes)