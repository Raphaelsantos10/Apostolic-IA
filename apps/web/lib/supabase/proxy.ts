import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedAppPath } from "../app-navigation.mjs";
import { getSupabaseEnv } from "./env";

export async function updateSession(
  request: NextRequest,
  requestHeaders = new Headers(request.headers)
) {
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const { url, publishableKey } = getSupabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user && isProtectedAppPath(request.nextUrl.pathname)) {
    const urlToLogin = request.nextUrl.clone();
    urlToLogin.pathname = "/entrar";
    urlToLogin.searchParams.set("mensagem", "Entre para acessar a sua conta.");
    return NextResponse.redirect(urlToLogin);
  }

  return response;
}
