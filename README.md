# TcC-showzinho

Projeto front + backend (Node + Supabase) para gerenciamento de psicólogos/pacientes.

Como publicar este repositório com GitHub Desktop

1. Abra o GitHub Desktop.
2. File -> Add Local Repository -> Choose... -> selecione a pasta `TcC-showzinho`.
3. No painel Changes, revise os arquivos listados (inclui `.gitignore`, `README.md`).
4. Preencha um resumo do commit, por exemplo: "Initial project files + gitignore" e clique `Commit to main`.
5. Se o repositório ainda não tiver remoto, clique em `Publish repository` (no topo) — escolha name/description/visibility e confirme.
6. Se o repositório já existe no GitHub, clique em `Repository` -> `Repository Settings` -> adicione o remote (URL) e depois `Push`.

Como publicar usando linha de comando (opcional)

```bash
cd "c:/Users/Administrador/OneDrive/Desktop/TcC-showzinho"
# inicializar (se necessário)
git init
git add .
git commit -m "Initial commit"
# crie um repo no GitHub (via website) e então:
git remote add origin https://github.com/<seu-usuario>/<seu-repo>.git
git branch -M main
git push -u origin main
```