import re
from typing import Tuple

class VideoLinkVerifier:
    YOUTUBE_REGEX = r"^(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/)([\w-]{11})"
    GDRIVE_REGEX = r"^(https?://)?(drive\.google\.com/)(file/d/|open\?id=)([\w-]+)"

    @classmethod
    def verify_and_detect_platform(cls, url: str) -> Tuple[bool, str]:
        clean_url = url.strip()
        if re.search(cls.YOUTUBE_REGEX, clean_url):
            return True, "youtube"
        elif re.search(cls.GDRIVE_REGEX, clean_url):
            return True, "google_drive"
        return False, "unknown"