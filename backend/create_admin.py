
from getpass import getpass

from argon2 import PasswordHasher
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models import User


def create_admin():
    db = SessionLocal()

    try:
        email = "admin@dairysync.local"

        existing_user = db.query(User).filter(
            User.email == email
        ).first()

        if existing_user:
            print("Admin account already exists.")
            return

        password = getpass("Create Admin password: ")
        confirm_password = getpass("Confirm Admin password: ")

        if len(password) < 12:
            print("Password must contain at least 12 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        admin = User(
            full_name="DairySync Admin",
            email=email,
            password_hash=PasswordHasher().hash(password),
            role="Admin",
            is_active=True
        )

        db.add(admin)
        db.commit()

        print("\nAdmin account created successfully!")
        print("Email:", email)
        print("Role: Admin")

    except IntegrityError:
        db.rollback()
        print("Could not create Admin account.")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
