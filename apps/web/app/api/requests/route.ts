import { NextResponse } from "next/server"; import { getRequests } from "../../../lib/google-sheets";
export async function GET(){try{return NextResponse.json(await getRequests())}catch{return NextResponse.json([])}}
