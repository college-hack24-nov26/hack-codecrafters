
from . import models
from .database import Base, engine


def initialize_database():
    print("Creating DairySync database tables...")

    Base.metadata.create_all(bind=engine)

    print("Database initialization successful!")
    print("Created tables:")

    for table_name in Base.metadata.tables:
        print(f"- {table_name}")


if __name__ == "__main__":
    initialize_database()
