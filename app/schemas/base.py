from pydantic import BaseModel, ConfigDict

def to_camel(string: str) -> str:
    components = string.split("_")
    return components[0] + "".join(x.capitalize() for x in components[1:])

class BaseCamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )