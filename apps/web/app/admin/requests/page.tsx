"use client";
import { useEffect, useState } from "react";
import { Notice, PageTitle, Panel } from "../../../components/admin/admin-ui";

type RequestRow = { id:string; type:"commission"|"fitting"; createdAt:string; name:string; email:string; phone?:string; category?:string; status:string; description?:string; preferredDate?:string; preferredTime?:string; neededBy?:string; notes?:string };

export default function RequestsPage() {
  const [rows,setRows]=useState<RequestRow[]|null>(null);
  const [busy,setBusy]=useState<string|null>(null);
  const load=()=>fetch("/api/requests",{cache:"no-store"}).then(r=>r.json()).then(setRows).catch(()=>setRows([]));
  useEffect(()=>{ void load(); },[]);
  async function changeStatus(row:RequestRow,status:string){setBusy(row.id);await fetch(`/api/requests/${row.type}/${row.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});setBusy(null);await load();}
  return <>
    <PageTitle title="Requests" description="Fittings and commission enquiries from the website, newest first." />
    <Panel className="overflow-hidden">
      {rows===null?<Notice>Loading…</Notice>:rows.length===0?<Notice>No requests yet.</Notice>:
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left">{["Type","Customer","Contact","Details","Received","Status"].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.type+r.id} className="border-b align-top"><td className="px-4 py-3 capitalize">{r.type}</td><td className="px-4 py-3 font-medium">{r.name}</td><td className="px-4 py-3"><a className="underline" href={`mailto:${r.email}`}>{r.email}</a>{r.phone?<div>{r.phone}</div>:null}</td><td className="max-w-sm px-4 py-3">{r.type==="commission"?(r.description||"—"):`${r.preferredDate||"—"} · ${r.preferredTime||"—"}`}</td><td className="whitespace-nowrap px-4 py-3">{r.createdAt?new Date(r.createdAt).toLocaleString():"—"}</td><td className="px-4 py-3"><select disabled={busy===r.id} value={r.status} onChange={e=>void changeStatus(r,e.target.value)} className="rounded border px-2 py-1">{(r.type==="commission"?["pending_review","accepted","declined"]:["pending","confirmed","declined"]).map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}</select></td></tr>)}</tbody></table></div>}
    </Panel>
  </>;
}
