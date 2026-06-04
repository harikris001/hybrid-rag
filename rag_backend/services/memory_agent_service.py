from pydantic_ai import Agent
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from schemas.user_profile_update import UserProfileUpdate
from models.user_profile import UserProfile


memory_agent = Agent(
    model="google:gemini-2.5-flash",
    output_type=UserProfileUpdate,
    system_prompt=(
        "You are an expert profiling assistant. Analyze the conversation "
        "and determine if the user has expressed new interests, technologies they work with, "
        "or style preferences. Only extract persistent traits, not temporary debugging issues. "
        "Do NOT repeat interests/preferences already present in the existing profile. "
        "Set should_update to False if nothing new was learned."
    ),
)


class MemoryAgentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_profile(self, user_id: str) -> UserProfile | None:
        """Fetch the user's profile from the database."""
        result = await self.db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def analyze_and_update(self, user_id: str, user_message: str, ai_response: str):
        """Run the memory agent on a conversation turn and update the profile if needed."""
        try:
            existing = await self.get_profile(user_id)
            existing_interests = existing.interests if existing else []
            existing_preferences = existing.preferences if existing else []

            prompt = (
                f"Existing user profile:\n"
                f"  Interests: {existing_interests}\n"
                f"  Preferences: {existing_preferences}\n\n"
                f"Latest conversation turn:\n"
                f"  User: {user_message}\n"
                f"  Assistant: {ai_response}\n\n"
                f"Extract ONLY new interests and preferences not already in the profile."
            )

            result = await memory_agent.run(prompt)
            update: UserProfileUpdate = result.output

            if not update.should_update:
                print(f"[MemoryAgent] No profile update needed for user '{user_id}'")
                return

            # Merge and deduplicate
            merged_interests = list(set(existing_interests + update.interests))
            merged_preferences = list(set(existing_preferences + update.preferences))

            if existing:
                existing.interests = merged_interests
                existing.preferences = merged_preferences
                existing.updated_at = datetime.utcnow()
            else:
                new_profile = UserProfile(
                    user_id=user_id,
                    interests=merged_interests,
                    preferences=merged_preferences,
                )
                self.db.add(new_profile)

            await self.db.commit()
            print(f"[MemoryAgent] Profile updated for user '{user_id}': interests={merged_interests}, preferences={merged_preferences}")

        except Exception as e:
            print(f"[MemoryAgent] Error updating profile for user '{user_id}': {e}")