
from getpass import getpass

from argon2 import PasswordHasher
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import User


def set_qc_password():
    db: Session = SessionLocal()

    try:
        user = db.query(User).filter(
            User.email == "qc@example.com"
        ).first()

        if not user:
            print("QC user not found.")
            return

        password = getpass("Enter new QC password: ")
        confirm_password = getpass("Confirm new QC password: ")

        if len(password) < 12:
            print("Password must contain at least 12 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        user.password_hash = PasswordHasher().hash(password)

        db.commit()

        print("\nQC password updated successfully!")
        print("Email: qc@example.com")
        print("Role:", user.role)

    except Exception:
        db.rollback()
        print("Could not update QC password.")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    set_qc_password()
