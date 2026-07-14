# Empacotar e publicar o `set-claude-env` no npm

## Pré-requisitos

- **Node 24+** (type stripping nativo — `.ts` roda direto, sem build). Usa 24.13.0 (`.nvmrc`):
  ```bash
  nvm use
  ```
- `typescript` e `@types/node` são devDependencies (só para typecheck; não entram
  no pacote publicado).
- Conta no npm (faça login uma vez):
  ```bash
  npm login
  ```
- O nome do pacote `set-claude-env` precisa estar disponível no registry. Se já
  existir, troque `name` em `package.json` (ex.: `@seu-usuario/set-claude-env`).

## 1. Verificar antes de publicar

Rode o self-check e valide o conteúdo que será empacotado:

```bash
npm install             # instala dev deps (typescript, @types/node)
node test.js            # self-check — deve imprimir "ok (8 checks)"
npx tsc --noEmit        # typecheck — sem erros
npm pack --dry-run      # mostra os arquivos que irão para o tarball
```

O `package.json` declara `"files": ["index.ts"]`, então só `index.ts` entra no
pacote (sem `test.js`, `tsconfig.json`, etc.). `package.json` e `README.md`
sempre são incluídos pelo npm. O `bin` aponta para `index.ts` — Node 24+ faz o
type stripping ao executar; não há passo de build nem `.js` publicado.

## 2. Versionar

Sempre incremente a versão antes de publicar. Use um dos:

```bash
npm version patch     # 0.1.0 -> 0.1.1  (correções)
npm version minor     # 0.1.0 -> 0.2.0  (funcionalidade compatível)
npm version major     # 0.1.0 -> 1.0.0  (quebra de compat)
```

Isso cria uma tag git `v<versão>`.

## 3. Publicar

```bash
npm publish
```

Para um pacote com escopo (`@usuario/set-claude-env`) público:

```bash
npm publish --access public
```

## 4. Validar a publicação

```bash
npm view set-claude-env version          # versão no registry
npx set-claude-env -h                    # rodar direto do registry
```

## 5. Instalar localmente para uso

```bash
npm install -g set-claude-env
set-claude-env -h
```

## Notas

- Reverter uma versão problemática:
  ```bash
  npm deprecate set-claude-env@<versão> "use a versão X"
  npm unpublish set-claude-env@<versão>   # só até 72h após publicar
  ```
- A cada nova versão, repita os passos 2 a 4.
- O binário precisa do bit de execução: `chmod +x index.ts` (já incluído no repo).
- **Requisito de runtime do usuário:** Node 24+. Sem isso, o `.ts` não roda (não há
  build para `.js`). Documente isso no README (já incluído).
