from __future__ import annotations

from fastapi import HTTPException, status


class AppError(HTTPException):
    def __init__(self, status_code: int, detail: str, code: str | None = None):
        super().__init__(status_code=status_code, detail=detail)
        self.code = code or "app_error"


class NotFound(AppError):
    def __init__(self, detail: str = "Not found"):
        super().__init__(status.HTTP_404_NOT_FOUND, detail, "not_found")


class Unauthorized(AppError):
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(status.HTTP_401_UNAUTHORIZED, detail, "unauthorized")


class Forbidden(AppError):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status.HTTP_403_FORBIDDEN, detail, "forbidden")


class Conflict(AppError):
    def __init__(self, detail: str = "Conflict"):
        super().__init__(status.HTTP_409_CONFLICT, detail, "conflict")


class ValidationError(AppError):
    def __init__(self, detail: str = "Invalid data"):
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, detail, "validation_error")
