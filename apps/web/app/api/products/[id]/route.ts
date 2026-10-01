import { NextResponse } from "next/server"; import { upsertProduct } from "../../../../lib/google-sheets";
export async function PUT(request:Request,context:{params:Promise<{id:string}>}){try{const {id}=await context.params;return NextResponse.json(await upsertProduct({...await request.json() as Record<string,unknown>,id}))}catch{return NextResponse.json({error:"unavailable"},{status:503})}}
