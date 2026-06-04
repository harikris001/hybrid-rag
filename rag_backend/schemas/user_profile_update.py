from pydantic import BaseModel, Field


class UserProfileUpdate(BaseModel):
    interests: list[str] = Field(description="New technical or general topics the user is interested in")
    preferences: list[str] = Field(description="Coding guidelines or behavioral preferences (e.g., 'prefers TS', 'concise', 'professional')")
    should_update: bool = Field(description="True if there are actual new insights worth saving, False if the conversation had no profiling value")