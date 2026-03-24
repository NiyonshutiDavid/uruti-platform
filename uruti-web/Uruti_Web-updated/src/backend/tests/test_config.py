from app.config import Settings


def test_parse_cors_origins_from_comma_string() -> None:
    parsed = Settings.parse_cors_origins(
        "https://uruti.rw, http://localhost:5173, https://www.uruti.rw"
    )

    assert parsed == [
        "https://uruti.rw",
        "http://localhost:5173",
        "https://www.uruti.rw",
    ]


def test_parse_cors_origins_passthrough_list() -> None:
    value = ["http://localhost:3000"]

    parsed = Settings.parse_cors_origins(value)

    assert parsed == value
