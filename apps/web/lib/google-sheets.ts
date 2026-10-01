import { createSign } from "node:crypto";

const REQUESTS_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const PRODUCTS_SHEET_ID = process.env.GOOGLE_PRODUCTS_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

export type SheetKind = "commission" | "fitting";
type Cell = string | number | boolean | null;

function configured() {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) throw new Error("Google Sheets credentials are not configured.");
}
function b64url(value: string | Buffer) { return Buffer.from(value).toString("base64url"); }
async function accessToken(): Promise<string> {
  configured();
  const now = Math.floor(Date.now()/1000);
  const header=b64url(JSON.stringify({alg:"RS256",typ:"JWT"}));
  const claim=b64url(JSON.stringify({iss:CLIENT_EMAIL,scope:"https://www.googleapis.com/auth/spreadsheets",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600}));
  const unsigned=`${header}.${claim}`;
  const signer=createSign("RSA-SHA256"); signer.update(unsigned); signer.end();
  const assertion=`${unsigned}.${b64url(signer.sign(PRIVATE_KEY!))}`;
  const response=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion}),cache:"no-store"});
  if(!response.ok) throw new Error("Google authentication failed.");
  const body=await response.json() as {access_token?:string};
  if(!body.access_token) throw new Error("Google authentication returned no token.");
  return body.access_token;
}
async function sheetsFetch(sheetId:string,path:string,init?:RequestInit){
  const token=await accessToken();
  const r=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/${path}`,{...init,headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json",...init?.headers},cache:"no-store"});
  if(!r.ok) throw new Error(`Google Sheets request failed (${r.status}).`);
  return r;
}
async function values(sheetId:string,range:string):Promise<Cell[][]>{
  const r=await sheetsFetch(sheetId,`values/${encodeURIComponent(range)}`);
  const b=await r.json() as {values?:Cell[][]}; return b.values??[];
}
async function append(sheetId:string,range:string,row:Cell[]){
  await sheetsFetch(sheetId,`values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,{method:"POST",body:JSON.stringify({values:[row]})});
}
async function update(sheetId:string,range:string,row:Cell[]){
  await sheetsFetch(sheetId,`values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,{method:"PUT",body:JSON.stringify({values:[row]})});
}
export async function appendToOperationsSheet(kind:SheetKind,data:Record<string,unknown>){
  if(!REQUESTS_SHEET_ID) throw new Error("Requests sheet is not configured.");
  const id=crypto.randomUUID(), now=new Date().toISOString();
  if(kind==="commission") await append(REQUESTS_SHEET_ID,"Commissions!A:K",[now,id,String(data.name??""),String(data.email??""),String(data.phone??""),String(data.category??""),String(data.occasion??""),String(data.neededBy??""),String(data.description??""),"pending_review",""]);
  else await append(REQUESTS_SHEET_ID,"Fittings!A:J",[now,id,String(data.name??""),String(data.email??""),String(data.phone??""),String(data.preferredDate??""),String(data.preferredTime??""),String(data.category??""),String(data.notes??""),"pending"]);
  return id;
}
export async function getRequests(){
  if(!REQUESTS_SHEET_ID) throw new Error("Requests sheet is not configured.");
  const [c,f]=await Promise.all([values(REQUESTS_SHEET_ID,"Commissions!A2:K"),values(REQUESTS_SHEET_ID,"Fittings!A2:J")]);
  return [...c.filter(r=>r[1]).map(r=>({type:"commission",createdAt:String(r[0]??""),id:String(r[1]),name:String(r[2]??""),email:String(r[3]??""),phone:String(r[4]??""),category:String(r[5]??""),occasion:String(r[6]??""),neededBy:String(r[7]??""),description:String(r[8]??""),status:String(r[9]??"pending_review"),notes:String(r[10]??"")})),...f.filter(r=>r[1]).map(r=>({type:"fitting",createdAt:String(r[0]??""),id:String(r[1]),name:String(r[2]??""),email:String(r[3]??""),phone:String(r[4]??""),preferredDate:String(r[5]??""),preferredTime:String(r[6]??""),category:String(r[7]??""),notes:String(r[8]??""),status:String(r[9]??"pending")}))].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export async function setRequestStatus(type:"commission"|"fitting",id:string,status:string){
  if(!REQUESTS_SHEET_ID) throw new Error("Requests sheet is not configured.");
  const tab=type==="commission"?"Commissions":"Fittings", rows=await values(REQUESTS_SHEET_ID,`${tab}!A2:K`);
  const index=rows.findIndex(r=>String(r[1]??"")===id); if(index<0) throw new Error("Request not found.");
  const row=rows[index]; row[9]=status; await update(REQUESTS_SHEET_ID,`${tab}!A${index+2}:${type==="commission"?"K":"J"}${index+2}`,row); return true;
}
export async function getProducts(){
  if(!PRODUCTS_SHEET_ID) throw new Error("Products sheet is not configured.");
  const rows=await values(PRODUCTS_SHEET_ID,"Products!A2:N");
  return rows.filter(r=>r[0]).map(r=>({id:String(r[0]),slug:String(r[1]??""),category:String(r[2]??""),name:String(r[3]??""),detail:String(r[4]??""),description:String(r[5]??""),imageFlat:String(r[6]??""),imageOnForm:String(r[7]??""),altFlat:String(r[8]??""),altOnForm:String(r[9]??""),startingPrice:r[10]===""||r[10]==null?null:Number(r[10]),active:String(r[11]).toLowerCase()!=="false",sortOrder:Number(r[12]??0)}));
}
export async function upsertProduct(data:Record<string,unknown>){
  if(!PRODUCTS_SHEET_ID) throw new Error("Products sheet is not configured.");
  const id=String(data.id??crypto.randomUUID()), rows=await values(PRODUCTS_SHEET_ID,"Products!A2:N"), index=rows.findIndex(r=>String(r[0])===id);
  const row:Cell[]=[id,String(data.slug??""),String(data.category??""),String(data.name??""),String(data.detail??""),String(data.description??""),String(data.imageFlat??""),String(data.imageOnForm??""),String(data.altFlat??""),String(data.altOnForm??""),data.startingPrice==null?"":Number(data.startingPrice),data.active!==false,Number(data.sortOrder??0),new Date().toISOString()];
  if(index<0) await append(PRODUCTS_SHEET_ID,"Products!A:N",row); else await update(PRODUCTS_SHEET_ID,`Products!A${index+2}:N${index+2}`,row);
  return {...data,id};
}
