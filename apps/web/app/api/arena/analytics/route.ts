import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function GET(request:Request){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Não autorizado."},{status:401});
 const days=Math.max(1,Math.min(365,Number(new URL(request.url).searchParams.get("days")??30)||30));
 const {data,error}=await supabase.rpc("arena_get_economy_analytics",{p_days:days});
 if(error)return NextResponse.json({error:"Acesso administrativo necessário."},{status:403});
 return NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});
}
