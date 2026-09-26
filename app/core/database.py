from sqlalchemy import create_engine, event
from sqlalchemy import inspect
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

    @event.listens_for(engine, "connect")
    def enable_sqlite_foreign_keys(connection, _connection_record):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    raise ValueError(
        "This project is configured for SQLite. Set DATABASE_URL to "
        "'sqlite:///./kaushal.db'."
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def migrate_sqlite_schema():
    if not inspect(engine).has_table("training_capacity"):
        return
    columns = {
        column["name"]
        for column in inspect(engine).get_columns("training_capacity")
    }
    if "trainer_capabilities" not in columns:
        with engine.begin() as connection:
            connection.exec_driver_sql(
                "ALTER TABLE training_capacity "
                "ADD COLUMN trainer_capabilities JSON NOT NULL DEFAULT '[]'"
            )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()