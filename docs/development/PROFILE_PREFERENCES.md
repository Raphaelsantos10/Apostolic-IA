# Perfil e preferências

A Sprint 014 permite ao utilizador editar nome, idioma, fuso horário, tema,
tamanho do texto, contraste, redução de movimento e comunicações.

Os dados são persistidos nas tabelas `profiles` e `preferences`, protegidas pelas
políticas RLS da Sprint 012. A identidade é sempre obtida pela sessão validada.

## Valores iniciais

- Idiomas: português de Portugal e português do Brasil.
- Fusos: Lisboa, Açores e Brasília.
- Temas: sistema, claro, escuro e sépia.
- Escala do texto: 80% a 200%.

As opções de acessibilidade são aplicadas imediatamente como pré-visualização e
guardadas no banco quando o formulário é enviado.
