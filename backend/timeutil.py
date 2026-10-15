from datetime import date, datetime
from zoneinfo import ZoneInfo

KST = ZoneInfo("Asia/Seoul")


def today_kst() -> date:
    """'오늘'의 기준은 서버 시간대가 아니라 한국 시간으로 고정한다."""
    return datetime.now(KST).date()
