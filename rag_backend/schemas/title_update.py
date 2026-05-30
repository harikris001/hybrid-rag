from pydantic import BaseModel


class TitleUpdate(BaseModel):
    title: str
    