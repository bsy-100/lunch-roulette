"""테이블 생성 스크립트. 이미 있는 테이블은 건드리지 않는다.

실행: python create_tables.py
"""
from sqlalchemy import inspect

from database import engine
from models import Base

Base.metadata.create_all(engine)

for table in inspect(engine).get_table_names():
    print(table)
