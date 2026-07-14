# set-claude-env

CLI que copia o bloco `env` de um arquivo de settings para o `.claude/settings.json`
do diretório corrente, preservando as demais chaves locais. Útil para alternar
provedores/modelos do Claude Code entre projetos sem editar `settings.json` à mão.

## Instalação

```bash
npm install -g set-claude-env
```

Ou rodar sem instalar:

```bash
npx set-claude-env
```

## Uso

```bash
# aplica o env de um arquivo de settings no settings local (.claude/settings.json)
set-claude-env -f ~/claude-code-opts/default.json
set-claude-env -f ../meu-outro-projeto/.claude/settings.json

# lista as variáveis de env do settings local
set-claude-env

# ajuda
set-claude-env -h
```

### Comportamento

- Com `-f`: lê a chave `env` do arquivo informado e **substitui integralmente** o
  bloco `env` do settings local. As demais chaves locais (`permissions`, `hooks`,
  etc.) são preservadas, assim como a indentação original do arquivo.
- `env` vazio na origem ⇒ `env` vazio no destino (zerar provedor/token de propósito).
- Sem `-f`: lista `chave = valor` de cada variável em `env`.
- Se `.claude/` e/ou `.claude/settings.json` não existirem, são criados.
- O caminho da origem aceita `~` (expandido para o home do usuário).
- Aplicar `env` exige reiniciar a sessão Claude Code para que ela recarregue o
  `settings.json`.

### Versão do Node

Requer **Node 24+** (type stripping nativo de TypeScript — `.ts` roda direto, sem
build). Usa Node 24.13.0 (ver `.nvmrc`):

```bash
nvm use
```

## Desenvolvimento

```bash
npm install         # dev deps (typescript, @types/node)
node test.js        # self-check (8 checks)
npx tsc --noEmit    # typecheck
node index.ts       # lista env local
npm link            # expõe set-claude-env globalmente para teste
```

Veja [RELEASE.md](RELEASE.md) para empacotar e publicar no npm.

## Licença

MIT
