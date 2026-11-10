import bcrypt

class Hash:
    @staticmethod
    def bcrypt(password: str) -> str:
        """
        Hashes password using native bcrypt with secure salt generation.
        Truncates to 72 bytes in accordance with bcrypt specification.
        """
        pwd_bytes = password.encode("utf-8")[:72]
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(pwd_bytes, salt)
        return hashed.decode("utf-8")

    @staticmethod
    def verify(hashed_password: str, plain_password: str) -> bool:
        """
        Verifies plain password against hashed bcrypt password.
        """
        try:
            pwd_bytes = plain_password.encode("utf-8")[:72]
            hash_bytes = hashed_password.encode("utf-8")
            return bcrypt.checkpw(pwd_bytes, hash_bytes)
        except Exception:
            return False
