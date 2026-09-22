import re
from typing import List
from app.schemas.intelligence import SkillTagResult

KNOWN_SKILLS = ["python", "fastapi", "react", "docker", "sql", "aws", "kubernetes", "nlp", "machine learning"]

class SignalExtractor:
    @staticmethod
    def extract_skills_from_text(text: str) -> List[SkillTagResult]:
        found_tags: List[SkillTagResult] = []
        lowered = text.lower()
        for skill in KNOWN_SKILLS:
            if re.search(rf"\b{re.escape(skill)}\b", lowered):
                found_tags.append(
                    SkillTagResult(
                        tagged_skill=skill.title(),
                        tagged_role="Software Engineering",
                        tagged_location="National",
                        proficiency_level="Intermediate",
                        confidence_score=0.92,
                    )
                )
        return found_tags