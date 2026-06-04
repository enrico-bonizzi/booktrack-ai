"""
Apaga o booktrack.db local e recria todas as tabelas a partir dos modelos.
Use somente em desenvolvimento.

Uso (com a venv ativa, do diretório backend/):
    python scripts/reset_db.py
"""

import os
import sys
from pathlib import Path

# Permite rodar como `python scripts/reset_db.py`
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


def main() -> None:
    db_path = ROOT / "booktrack.db"
    if db_path.exists():
        confirm = input(
            f"Vai apagar {db_path}. Todos os livros e logs serão perdidos. "
            "Confirma? [y/N]: "
        ).strip().lower()
        if confirm not in ("y", "yes", "s", "sim"):
            print("Cancelado.")
            return
        os.remove(db_path)
        print(f"Removido: {db_path}")
    else:
        print(f"Nada a remover (arquivo não existe): {db_path}")

    # Importa só depois para usar a config atual
    from app.core.database import Base, engine
    from app import models  # noqa: F401  garante registro dos mapeamentos

    Base.metadata.create_all(bind=engine)
    print("Tabelas recriadas com o schema atual.")


if __name__ == "__main__":
    main()
