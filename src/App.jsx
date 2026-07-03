import React, { useState, useMemo, useEffect } from "react";
import { Search, Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { DATA } from "./datos.js";

/* ============================================================
   CONSULTAS · Cuadro de Ventas Humboldt (datos 2022–2026)
   El sistema NO calcula nada: muestra la información del Excel
   tal cual y permite consultarla.
   Registro = [año, sem, iniSalida, canal, num, pax, grat, precio,
               cs, promo, neto, vr, dep, fdepISO, fdepTexto, saldo]
   ============================================================ */

const R = DATA;

const C = {
  navy:"#0A2540", teal:"#0E8A94", tealSoft:"#E5F2F3",
  ink:"#1B2A38", slate:"#5E7087", grid:"#CFD8E0", gridSoft:"#E7ECF1",
  head:"#EEF2F6", paper:"#F4F7FA", white:"#FFFFFF",
  neg:"#B23A2E", amber:"#B9770F", ambSoft:"#FBF1E0", pos:"#0F7A53",
};
const mono = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";
const ANIOS = ["2022","2023","2024","2025","2026"];
const CANALES = ["EV","GALASAM","GIANNA","SAMIRA","VARIAS","BLOQUE1","BLOQUE2","BLOQUE3","BLOQUE4","BLOQUE5"];

const money=(n)=>(n===null||n===undefined||isNaN(n))?"":(n<0?"-$":"$")+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const dmy=(iso)=>{if(!iso)return"";const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso);return m?`${m[3]}/${m[2]}/${m[1]}`:iso;};
const numFmt=(n)=>(n===null||n===undefined)?"":(Number.isInteger(n)?n:Number(n.toFixed(2)));
const hoyISO=()=>new Date().toISOString().slice(0,10);
const diasAtras=(n)=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10);};
const inicioMes=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`;};

// hook simple: ¿pantalla angosta? (iPhone)
function useMovil(){
  const [w,setW]=useState(typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(()=>{const f=()=>setW(window.innerWidth);window.addEventListener("resize",f);return()=>window.removeEventListener("resize",f);},[]);
  return w<760;
}

export default function App(){
  const movil=useMovil();
  const [q,setQ]=useState("");
  const [f1,setF1]=useState("");
  const [f2,setF2]=useState("");
  const [anio,setAnio]=useState("");
  const [canal,setCanal]=useState("");
  const [soloSaldo,setSoloSaldo]=useState(false);
  const [orden,setOrden]=useState({col:null,dir:1}); // col: 13=fechaDep 12=dep 15=saldo 11=vr

  const activo = q.trim()!=="" || f1!=="" || f2!=="" || anio!=="" || canal!=="" || soloSaldo;

  const res = useMemo(()=>{
    if(!activo) return [];
    const qq=q.trim().toLowerCase();
    let out = R.filter((r)=>{
      const [yr,,,cn,num,,,,,,,,dep,fiso,ftxt,saldo]=r;
      if(anio && yr!==anio) return false;
      if(canal && cn!==canal) return false;
      if(soloSaldo && !(Math.abs(saldo||0)>0.5)) return false;
      if(qq){
        const hayNum = num && String(num).toLowerCase().includes(qq);
        const hayTxt = ftxt && ftxt.toLowerCase().includes(qq);
        if(!hayNum && !hayTxt) return false;
      }
      if(f1 || f2){
        if(!fiso) return false;
        if(f1 && fiso<f1) return false;
        if(f2 && fiso>f2) return false;
      }
      return true;
    });
    if(orden.col!==null){
      const c=orden.col, d=orden.dir;
      out=[...out].sort((a,b)=>{
        const va=a[c], vb=b[c];
        if(va===null||va===undefined) return 1;
        if(vb===null||vb===undefined) return -1;
        if(va<vb) return -d;
        if(va>vb) return d;
        return 0;
      });
    }
    return out;
  },[q,f1,f2,anio,canal,soloSaldo,orden,activo]);

  const totDep = useMemo(()=>res.reduce((a,r)=>a+(r[12]||0),0),[res]);
  const totPax = useMemo(()=>res.reduce((a,r)=>a+(r[5]||0),0),[res]);

  const limpiar=()=>{setQ("");setF1("");setF2("");setAnio("");setCanal("");setSoloSaldo(false);setOrden({col:null,dir:1});};
  const ordenar=(col)=>setOrden(o=>o.col===col?{col,dir:-o.dir}:{col,dir:1});

  const IconOrden=({col})=>orden.col!==col?<ArrowUpDown size={11} style={{opacity:.45}}/>:(orden.dir===1?<ArrowUp size={11}/>:<ArrowDown size={11}/>);

  return(
  <div style={{background:C.paper,minHeight:"100vh",color:C.ink,fontFamily:"system-ui,-apple-system,sans-serif"}}>
    <header style={{background:C.navy,color:C.white}}>
      <div style={{maxWidth:1320,margin:"0 auto",padding:"14px 18px"}}>
        <div style={{fontSize:17,fontWeight:700}}>Consultas · Cuadro de Ventas</div>
        <div style={{fontSize:11,color:"#9DB4C8",marginTop:2,letterSpacing:.5}}>HUMBOLDT EXPLORER · 2022–2026 · DATOS TAL CUAL DEL EXCEL</div>
      </div>
    </header>

    {/* Panel de consulta */}
    <div style={{maxWidth:1320,margin:"0 auto",padding:"14px 18px 0"}}>
      <div style={{background:C.white,border:`1px solid ${C.grid}`,borderRadius:12,padding:"14px 16px"}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"flex-end"}}>
          <Campo etiqueta="Buscar RES o texto" ancho={movil?"100%":230}>
            <div style={{position:"relative"}}>
              <Search size={15} color={C.slate} style={{position:"absolute",left:10,top:11}}/>
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Ej. 37252 o Com banc"
                style={{...inp,paddingLeft:32,fontFamily:mono}}/>
            </div>
          </Campo>
          <Campo etiqueta="Depósito desde" ancho={movil?"47%":150}>
            <input type="date" value={f1} onChange={(e)=>setF1(e.target.value)} style={inp}/>
          </Campo>
          <Campo etiqueta="Depósito hasta" ancho={movil?"47%":150}>
            <input type="date" value={f2} onChange={(e)=>setF2(e.target.value)} style={inp}/>
          </Campo>
          <Campo etiqueta="Año" ancho={movil?"47%":110}>
            <select value={anio} onChange={(e)=>setAnio(e.target.value)} style={inp}>
              <option value="">Todos</option>
              {ANIOS.map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Canal" ancho={movil?"47%":135}>
            <select value={canal} onChange={(e)=>setCanal(e.target.value)} style={inp}>
              <option value="">Todos</option>
              {CANALES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </Campo>
        </div>

        {/* atajos y opciones */}
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:12,alignItems:"center"}}>
          <Atajo onClick={()=>{setF1(hoyISO());setF2(hoyISO());}}>Hoy</Atajo>
          <Atajo onClick={()=>{setF1(diasAtras(7));setF2(hoyISO());}}>Últimos 7 días</Atajo>
          <Atajo onClick={()=>{setF1(inicioMes());setF2(hoyISO());}}>Este mes</Atajo>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12.5,color:C.ink,fontWeight:600,cursor:"pointer",padding:"6px 10px",borderRadius:8,background:soloSaldo?C.ambSoft:"transparent",border:`1px solid ${soloSaldo?"#EAD9B0":C.grid}`}}>
            <input type="checkbox" checked={soloSaldo} onChange={(e)=>setSoloSaldo(e.target.checked)} style={{accentColor:C.amber}}/>
            Solo con saldo pendiente
          </label>
          {activo && (
            <button onClick={limpiar} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 11px",borderRadius:8,border:`1px solid ${C.grid}`,background:C.white,color:C.slate,cursor:"pointer",fontSize:12.5,fontWeight:600,marginLeft:"auto"}}>
              <X size={13}/> Limpiar
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Resultados */}
    <main style={{maxWidth:1320,margin:"0 auto",padding:"12px 18px 60px"}}>
      {!activo ? (
        <div style={{textAlign:"center",color:C.slate,padding:"56px 0"}}>
          <Filter size={34} color={C.grid} style={{marginBottom:10}}/>
          <div style={{fontSize:15,fontWeight:600}}>Haz una consulta</div>
          <div style={{fontSize:13,marginTop:4}}>Busca una RES, usa un atajo de fecha, o filtra por año, canal o saldo.</div>
        </div>
      ) : (
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"2px 2px 10px",flexWrap:"wrap",gap:6}}>
            <div style={{fontSize:13,color:C.slate}}><b style={{color:C.ink}}>{res.length}</b> resultado{res.length!==1?"s":""} · <b style={{color:C.ink,fontFamily:mono}}>{numFmt(totPax)}</b> pax</div>
            {res.length>0 && <div style={{fontSize:13,color:C.slate}}>Depósitos mostrados: <b style={{fontFamily:mono,color:C.pos}}>{money(totDep)}</b></div>}
          </div>

          {movil ? (
            /* ===== Vista de tarjetas (iPhone) ===== */
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {res.slice(0,200).map((r,i)=>{
                const [yr,sem,ini,cn,num,pax,grat,precio,cs,promo,neto,vr,dep,fiso,ftxt,saldo]=r;
                const pend=Math.abs(saldo||0)>0.5;
                return(
                <div key={i} style={{background:C.white,border:`1px solid ${pend?"#EAD9B0":C.grid}`,borderRadius:12,padding:"12px 14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontFamily:mono,fontWeight:700,fontSize:15.5,fontStyle:num?"normal":"italic",color:num?C.ink:C.slate}}>{num||"(ajuste)"}</span>
                      <TagCanal cn={cn}/>
                    </div>
                    <span style={{fontSize:11.5,fontFamily:mono,color:C.slate}}>{yr} · S{numFmt(sem)}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px 12px",fontSize:12.5}}>
                    <Mini l="Paxs" v={`${numFmt(pax)}${grat?` (+${numFmt(grat)} grat)`:""}`}/>
                    <Mini l="Precio" v={money(precio)}/>
                    <Mini l="Valor Reserva" v={money(vr)} c={vr<0?C.neg:C.ink}/>
                    <Mini l="Depósito" v={money(dep)} c={C.pos}/>
                    <Mini l="Fecha dep." v={fiso?dmy(fiso):(ftxt||"—")} it={!fiso&&!!ftxt}/>
                    <Mini l="Saldo" v={money(saldo)} c={pend?C.amber:C.slate} b={pend}/>
                  </div>
                </div>);
              })}
              {res.length>200 && <div style={{fontSize:12.5,color:C.slate,textAlign:"center",padding:"8px 0"}}>Mostrando 200 de {res.length}. Afina la consulta.</div>}
            </div>
          ) : (
            /* ===== Vista de tabla (escritorio) ===== */
            <div style={{background:C.white,border:`1px solid ${C.grid}`,borderRadius:10,overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{borderCollapse:"collapse",width:"100%",minWidth:1180,fontSize:12.8}}>
                  <thead>
                    <tr style={{background:C.head}}>
                      <th style={{...th,textAlign:"left"}}>Año</th>
                      <th style={{...th,textAlign:"left"}}>Sem</th>
                      <th style={{...th,textAlign:"left"}}>Salida</th>
                      <th style={{...th,textAlign:"left"}}>Canal</th>
                      <th style={{...th,textAlign:"left"}}>Reserva</th>
                      <th style={th}>Paxs</th>
                      <th style={th}>Grat</th>
                      <th style={th}>Precio</th>
                      <th style={th}>Desc CS</th>
                      <th style={th}>Promoción</th>
                      <th style={th}>% neto</th>
                      <th style={{...th,cursor:"pointer"}} onClick={()=>ordenar(11)}>Valor Reserva <IconOrden col={11}/></th>
                      <th style={{...th,cursor:"pointer"}} onClick={()=>ordenar(12)}>Depósito <IconOrden col={12}/></th>
                      <th style={{...th,textAlign:"center",cursor:"pointer"}} onClick={()=>ordenar(13)}>Fecha Dep. <IconOrden col={13}/></th>
                      <th style={{...th,cursor:"pointer"}} onClick={()=>ordenar(15)}>Saldo <IconOrden col={15}/></th>
                    </tr>
                  </thead>
                  <tbody>
                    {res.slice(0,400).map((r,i)=>{
                      const [yr,sem,ini,cn,num,pax,grat,precio,cs,promo,neto,vr,dep,fiso,ftxt,saldo]=r;
                      return(
                      <tr key={i} style={{background:i%2?C.white:"#FBFCFD"}}>
                        <td style={{...td,fontFamily:mono}}>{yr}</td>
                        <td style={{...td,fontFamily:mono}}>{numFmt(sem)}</td>
                        <td style={{...td,fontFamily:mono,fontSize:11.8,color:C.slate}}>{dmy(ini)}</td>
                        <td style={td}><TagCanal cn={cn}/></td>
                        <td style={{...td,fontFamily:mono,fontWeight:600,fontStyle:num?"normal":"italic",color:num?C.ink:C.slate}}>{num||"(ajuste)"}</td>
                        <td style={tdN}>{numFmt(pax)}</td>
                        <td style={tdN}>{grat?numFmt(grat):""}</td>
                        <td style={tdN}>{money(precio)}</td>
                        <td style={{...tdN,color:C.neg}}>{money(cs)}</td>
                        <td style={{...tdN,color:promo?C.neg:C.ink}}>{money(promo)}</td>
                        <td style={tdN}>{(neto!==null&&neto!==undefined)?(neto*100).toFixed(0)+"%":""}</td>
                        <td style={{...tdN,color:vr<0?C.neg:C.ink}}>{money(vr)}</td>
                        <td style={{...tdN,color:C.pos}}>{money(dep)}</td>
                        <td style={{...td,textAlign:"center",fontFamily:mono,fontSize:11.5,color:fiso?C.ink:C.slate,fontStyle:fiso?"normal":"italic"}}>{fiso?dmy(fiso):(ftxt||"")}</td>
                        <td style={{...tdN,color:Math.abs(saldo||0)>0.5?C.amber:C.slate,fontWeight:Math.abs(saldo||0)>0.5?700:400}}>{money(saldo)}</td>
                      </tr>);
                    })}
                  </tbody>
                </table>
              </div>
              {res.length>400 && <div style={{padding:"10px 16px",fontSize:12.5,color:C.slate,borderTop:`1px solid ${C.gridSoft}`}}>Mostrando 400 de {res.length}. Afina la consulta.</div>}
            </div>
          )}
        </>
      )}
    </main>
  </div>);
}

function TagCanal({cn}){
  return <span style={{fontSize:10.5,fontWeight:700,padding:"2px 7px",borderRadius:4,background:cn==="EV"?C.navy:C.tealSoft,color:cn==="EV"?C.white:C.teal}}>{cn}</span>;
}
function Mini({l,v,c,b,it}){
  return(<div>
    <div style={{fontSize:10.5,color:C.slate,fontWeight:700}}>{l}</div>
    <div style={{fontFamily:mono,fontSize:13,color:c||C.ink,fontWeight:b?700:500,fontStyle:it?"italic":"normal",marginTop:1}}>{v}</div>
  </div>);
}
function Campo({etiqueta,ancho,children}){
  return(<div style={{width:ancho,flexGrow:typeof ancho==="string"?1:0}}>
    <div style={{fontSize:11,fontWeight:700,color:C.slate,letterSpacing:.3,marginBottom:5}}>{etiqueta}</div>
    {children}
  </div>);
}
function Atajo({children,onClick}){
  return <button onClick={onClick} style={{padding:"6px 11px",borderRadius:8,border:`1px solid ${C.grid}`,background:C.white,color:C.teal,cursor:"pointer",fontSize:12.5,fontWeight:700}}>{children}</button>;
}
const inp={width:"100%",padding:"9px 10px",borderRadius:8,border:`1px solid ${C.grid}`,fontSize:14,outline:"none",background:C.white,boxSizing:"border-box",color:C.ink};
const th={padding:"9px 9px",fontSize:10.5,fontWeight:700,color:C.slate,borderRight:`1px solid ${C.grid}`,borderBottom:`1px solid ${C.grid}`,whiteSpace:"nowrap",letterSpacing:.2,textAlign:"right",userSelect:"none"};
const td={padding:"6px 9px",borderRight:`1px solid ${C.gridSoft}`,borderBottom:`1px solid ${C.gridSoft}`,whiteSpace:"nowrap"};
const tdN={...td,textAlign:"right",fontFamily:mono};
