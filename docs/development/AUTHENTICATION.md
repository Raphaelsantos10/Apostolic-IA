# Autenticação e gestão de conta

## Fluxos implementados

- Cadastro com nome, e-mail, senha e aceite explícito.
- Confirmação de e-mail por callback PKCE ou token hash.
- Login por e-mail e senha.
- Renovação de sessão por cookies no proxy do Next.js.
- Logout.
- Solicitação e conclusão de recuperação de senha.
- Página protegida da conta.
- Exclusão da própria conta com confirmação textual.

## Ambiente local

Com o Supabase em execução, copie os valores públicos mostrados por `supabase
status` para `apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<chave pública local>
```

Não utilize a chave `Secret`, `service_role`, senha do banco ou chaves de S3 no
cliente. O arquivo `.env.local` é ignorado pelo Git.

## Executar

```bash
pnpm dlx supabase@latest start
pnpm dev:web
```

- Aplicação: `http://localhost:3000`
- E-mails locais: `http://127.0.0.1:54324`
- Supabase Studio: `http://127.0.0.1:54323`

## Segurança

- A sessão é validada com `getUser()`, não apenas dados locais do token.
- Cookies são atualizados no proxy.
- Rotas de conta redirecionam visitantes para login.
- Mensagens de recuperação não revelam se uma conta existe.
- A exclusão usa `auth.uid()` no banco e não aceita um ID enviado pelo cliente.
- Senhas e tokens nunca são registrados no repositório.

## Produção

Antes de produção serão necessários domínio, URLs de redirecionamento,
templates de e-mail, política de privacidade publicada, proteção contra abuso,
monitorização e revisão jurídica.
