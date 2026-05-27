---
changeKind: feature
packages:
  - "@typespec/pydantic"
---

Add new `@typespec/pydantic` emitter that generates Python pydantic model classes from TypeSpec definitions. Models are categorized by HTTP operation usage into separate modules (`input_types.py`, `output_types.py`, `roundtrip_types.py`). Includes support for constraints, enums, unions, inheritance, and configurable module names.
