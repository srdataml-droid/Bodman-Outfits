import { NextResponse } from "next/server"; import { getProducts, upsertProduct } from "../../../lib/google-sheets";
export async function GET(){try{return NextResponse.json(await getProducts())}catch{return NextResponse.json([])}}
export async function POST(request:Request){try{return NextResponse.json(await upsertProduct(await request.json() as Record<string,unknown>),{status:201})}catch{return NextResponse.json({error:"unavailable"},{status:503})}}
