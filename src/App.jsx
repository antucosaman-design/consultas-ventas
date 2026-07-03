import React, { useState, useMemo, useEffect } from "react";
import { Search, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, Table2, BarChart3, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { DATA } from "./datos.js";

/* ============================================================
   CUADRO DE VENTAS · Humboldt Explorer · 2018–2026
   Tres vistas: Cuadro (como el Excel), Consultas, Resumen.
   El sistema NO calcula lógica de negocio: muestra los valores
   del Excel tal cual; los totales son sumas de lo mostrado.
   Registro = [0 año, 1 sem, 2 ini, 3 canal, 4 num, 5 grupo,
     6 pax, 7 grat, 8 precio, 9 cs, 10 promo, 11 neto, 12 vr,
     13 dep, 14 fdepISO, 15 fdepTexto, 16 saldo, 17 nres, 18 nsem]
   ============================================================ */

const R = DATA;

const C = {
  navy:"#0A2540", navyDeep:"#06192E", teal:"#0E8A94", tealSoft:"#E5F2F3",
  ink:"#1B2A38", slate:"#5E7087", grid:"#CFD8E0", gridSoft:"#E7ECF1",
  head:"#EEF2F6", paper:"#F4F7FA", white:"#FFFFFF",
  neg:"#B23A2E", amber:"#B9770F", ambSoft:"#FBF1E0", pos:"#0F7A53",
};
const mono = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";
const ANIOS = ["2018","2019","2020","2021","2022","2023","2024","2025","2026"];
const CANAL_ORDEN = ["EV","GALASAM","GIANNA","SAMIRA","VARIAS"];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const CAP = 16;

const money=(n)=>(n===null||n===undefined||isNaN(n))?"":(n<0?"-$":"$")+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const money0=(n)=>(n===null||n===undefined||isNaN(n))?"":(n<0?"-$":"$")+Math.abs(n).toLocaleString("en-US",{maximumFractionDigits:0});
const dmy=(iso)=>{if(!iso)return"";const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso);return m?`${m[3]}/${m[2]}/${m[1]}`:iso;};
const numFmt=(n)=>(n===null||n===undefined)?"":(Number.isInteger(n)?n:Number(n.toFixed(2)));
const hoyISO=()=>new Date().toISOString().slice(0,10);
const diasAtras=(n)=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10);};
const inicioMes=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`;};

function useMovil(){
  const [w,setW]=useState(typeof window!=="undefined"?window.innerWidth:1200);
  useEffect(()=>{const f=()=>setW(window.innerWidth);window.addEventListener("resize",f);return()=>window.removeEventListener("resize",f);},[]);
  return w<760;
}

// ===== agrupar registros en semanas (una vez) =====
function agrupar(){
  const porAnio={};
  for(const r of R){
    const yr=r[0], key=`${r[1]}|${r[2]}`;
    if(!porAnio[yr]) porAnio[yr]={};
    if(!porAnio[yr][key]) porAnio[yr][key]={sem:r[1],ini:r[2],bloques:{}};
    const cn=r[3];
    if(!porAnio[yr][key].bloques[cn]) porAnio[yr][key].bloques[cn]=[];
    porAnio[yr][key].bloques[cn].push(r);
  }
  const out={};
  for(const yr of Object.keys(porAnio)){
    out[yr]=Object.values(porAnio[yr]).sort((a,b)=>{
      if(a.ini&&b.ini) return a.ini<b.ini?-1:1;
      return (a.sem||0)-(b.sem||0);
    });
  }
  return out;
}
const SEMANAS = agrupar();

export default function App(){
  const movil=useMovil();
  const [vista,setVista]=useState("cuadro");
  const [anioC,setAnioC]=useState("2026");
  const [semIdx,setSemIdx]=useState(0);

  const irASemana=(yr,sem,ini)=>{
    const lista=SEMANAS[yr]||[];
    const i=lista.findIndex(s=>String(s.sem)===String(sem)&&s.ini===ini);
    setAnioC(yr); setSemIdx(i>=0?i:0); setVista("cuadro");
    window.scrollTo(0,0);
  };

  return(
  <div style={{background:C.paper,minHeight:"100vh",color:C.ink,fontFamily:"system-ui,-apple-system,sans-serif"}}>
    <header style={{background:C.navy,color:C.white}}>
      <div style={{maxWidth:1340,margin:"0 auto",padding:"14px 18px 0"}}>
        <div style={{fontSize:17,fontWeight:700}}>Cuadro de Ventas</div>
        <div style={{fontSize:11,color:"#9DB4C8",marginTop:2,letterSpacing:.5}}>HUMBOLDT EXPLORER · 2018–2026 · DATOS TAL CUAL DEL EXCEL</div>
        <nav style={{display:"flex",gap:2,marginTop:12}}>
          {[["cuadro","Cuadro",Table2],["consultas","Consultas",Search],["resumen","Resumen",BarChart3]].map(([id,label,Icon])=>{
            const on=vista===id;
            return(
            <button key={id} onClick={()=>setVista(id)}
              style={{display:"flex",alignItems:"center",gap:7,padding:"11px 16px",border:"none",cursor:"pointer",fontSize:13.5,fontWeight:600,
                background:on?C.paper:"transparent",color:on?C.navy:"#8FA9BE",borderRadius:"9px 9px 0 0"}}>
              <Icon size={15} strokeWidth={2.2}/>{label}
            </button>);
          })}
        </nav>
      </div>
    </header>

    {vista==="cuadro" && <VistaCuadro movil={movil} anio={anioC} setAnio={(a)=>{setAnioC(a);setSemIdx(0);}} semIdx={semIdx} setSemIdx={setSemIdx}/>}
    {vista==="consultas" && <VistaConsultas movil={movil} irASemana={irASemana}/>}
    {vista==="resumen" && <VistaResumen movil={movil}/>}
  </div>);
}

/* ============================================================
   VISTA 1 · CUADRO (como el Excel)
   ============================================================ */
function VistaCuadro({movil,anio,setAnio,semIdx,setSemIdx}){
  const semanas=SEMANAS[anio]||[];
  const sal=semanas[Math.min(semIdx,semanas.length-1)];

  return(
  <div style={{maxWidth:1340,margin:"0 auto",padding:"14px 18px 60px"}}>
    {/* selector de año */}
    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
      {ANIOS.map(a=>{const on=a===anio;return(
        <button key={a} onClick={()=>setAnio(a)}
          style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${on?C.teal:C.grid}`,cursor:"pointer",
            background:on?C.teal:C.white,color:on?C.white:C.slate,fontWeight:700,fontSize:13.5,fontFamily:mono}}>{a}</button>);})}
    </div>

    {/* selector de semana */}
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
      <button onClick={()=>setSemIdx(Math.max(0,semIdx-1))} disabled={semIdx===0} style={navBtn(semIdx===0)}><ChevronLeft size={18}/></button>
      <div style={{display:"flex",gap:5,overflowX:"auto",flex:1,paddingBottom:4}}>
        {semanas.map((s,i)=>{const on=i===Math.min(semIdx,semanas.length-1);return(
          <button key={i} onClick={()=>setSemIdx(i)}
            style={{padding:"6px 10px",borderRadius:7,border:`1px solid ${on?C.teal:C.grid}`,cursor:"pointer",flexShrink:0,
              background:on?C.teal:C.white,color:on?C.white:C.slate,fontWeight:600,fontSize:11.5,fontFamily:mono}}>
            S{numFmt(s.sem)}·{dmy(s.ini).slice(0,5)}
          </button>);})}
      </div>
      <button onClick={()=>setSemIdx(Math.min(semanas.length-1,semIdx+1))} disabled={semIdx>=semanas.length-1} style={navBtn(semIdx>=semanas.length-1)}><ChevronRight size={18}/></button>
    </div>

    {!sal ? <div style={{color:C.slate,textAlign:"center",padding:"40px 0"}}>Sin datos en {anio}.</div> : <Hoja sal={sal} movil={movil}/>}
  </div>);
}

const navBtn=(dis)=>({width:34,height:34,borderRadius:8,border:`1px solid ${C.grid}`,background:C.white,display:"grid",placeItems:"center",cursor:dis?"default":"pointer",color:dis?C.grid:C.slate,opacity:dis?.5:1,flexShrink:0});

function Hoja({sal,movil}){
  const tot=useMemo(()=>{
    let venta=0,dep=0,pax=0,grat=0;
    Object.values(sal.bloques).forEach(fs=>fs.forEach(r=>{
      if(r[12])venta+=r[12]; if(r[13])dep+=r[13]; if(r[6])pax+=r[6]; if(r[7])grat+=r[7];
    }));
    return {venta,dep,dif:venta+dep,pax,grat,porVender:CAP-pax};
  },[sal]);

  const canales=CANAL_ORDEN.filter(c=>sal.bloques[c]).concat(Object.keys(sal.bloques).filter(c=>!CANAL_ORDEN.includes(c)));

  return(
  <div style={{background:C.white,border:`1px solid ${C.grid}`,borderRadius:10,overflow:"hidden"}}>
    {/* cabecera de la semana */}
    <div style={{display:"flex",flexWrap:"wrap",borderBottom:`2px solid ${C.navy}`}}>
      <div style={{padding:"11px 16px",borderRight:`1px solid ${C.grid}`,minWidth:150,background:C.navy,color:C.white}}>
        <div style={{fontSize:10.5,color:"#9DB4C8",fontWeight:600,letterSpacing:.5}}>SEMANA</div>
        <div style={{fontSize:24,fontWeight:700,fontFamily:mono,lineHeight:1.1}}>{numFmt(sal.sem)||"—"}</div>
        <div style={{fontSize:11,color:"#B9CADA",marginTop:2,fontFamily:mono}}>{dmy(sal.ini)}</div>
      </div>
      <CabCifra label="TOTAL DE VENTA EN $" v={money(tot.venta)} neg/>
      <CabCifra label="TOTAL DE DEPÓSITO" v={money(tot.dep)}/>
      <CabCifra label="DIFERENCIA A RECIBIR" v={money(tot.dif)} acento={Math.abs(tot.dif)>0.5}/>
      <CabMini label="PAXS" v={numFmt(tot.pax)}/>
      <CabMini label="GRATIS" v={numFmt(tot.grat)}/>
      <CabMini label="POR VENDER" v={numFmt(tot.porVender)} acento={tot.porVender>0}/>
    </div>

    {/* bloques por canal */}
    <div style={{overflowX:"auto"}}>
      <table style={{borderCollapse:"collapse",width:"100%",minWidth:1080,fontSize:12.8}}>
        <thead>
          <tr style={{background:C.head}}>
            {["","Reserva","# Paxs","Gratitud","Precio","Desc CS","Promoción","% neto","Valor de Reserva","Depósito","Fecha Dep.","Saldo"].map((h,i)=>(
              <th key={i} style={{...thC,textAlign:i<=1?"left":i===10?"center":"right",width:i===0?22:"auto"}}>{h}</th>))}
          </tr>
        </thead>
        <tbody>
          {canales.map(cn=>(
            <BloqueCanal key={cn} canal={cn} filas={sal.bloques[cn]}/>
          ))}
        </tbody>
      </table>
    </div>
  </div>);
}

function BloqueCanal({canal,filas}){
  const local=canal!=="EV";
  return(<>
    <tr><td colSpan={12} style={{background:local?C.teal:C.navy,color:C.white,fontWeight:700,fontSize:12,padding:"5px 12px",letterSpacing:.5}}>VENTAS {canal}</td></tr>
    {filas.map((r,i)=>{
      const [yr,sem,ini,cn,num,grupo,pax,grat,precio,cs,promo,neto,vr,dep,fiso,ftxt,saldo,nres,nsem]=r;
      return(
      <tr key={i} style={{background:!num?"#FCFAF5":(i%2?C.white:"#FBFCFD")}}>
        <td style={tdC}></td>
        <td style={{...tdC,textAlign:"left",fontFamily:mono,fontWeight:600,fontStyle:num?"normal":"italic",color:num?C.ink:C.slate}}>
          {num?(nres&&String(nres)!==String(num)?`${num} \u2192 ${nres}`:num):(grupo?`\u21B3 ${grupo}`:"(ajuste)")}
          {num&&nsem?<span style={{fontSize:10,color:C.amber,marginLeft:6}}>reubicada {dmy(nsem)}</span>:null}
        </td>
        <td style={tdNC}>{numFmt(pax)}</td>
        <td style={tdNC}>{grat?numFmt(grat):""}</td>
        <td style={tdNC}>{money(precio)}</td>
        <td style={{...tdNC,color:C.neg}}>{money(cs)}</td>
        <td style={{...tdNC,color:promo?C.neg:C.ink}}>{money(promo)}</td>
        <td style={tdNC}>{(neto!==null&&neto!==undefined)?(neto*100).toFixed(0)+"%":""}</td>
        <td style={{...tdNC,color:vr<0?C.neg:C.ink,fontWeight:num?700:400}}>{money(vr)}</td>
        <td style={{...tdNC,color:C.pos}}>{money(dep)}</td>
        <td style={{...tdC,textAlign:"center",fontFamily:mono,fontSize:11.3,color:fiso?C.slate:C.slate,fontStyle:fiso?"normal":"italic"}}>{fiso?dmy(fiso):(ftxt||"")}</td>
        <td style={{...tdNC,color:Math.abs(saldo||0)>0.5?C.amber:C.slate,fontWeight:Math.abs(saldo||0)>0.5?700:400}}>{money(saldo)}</td>
      </tr>);
    })}
  </>);
}

function CabCifra({label,v,neg,acento}){return(
  <div style={{padding:"11px 16px",borderRight:`1px solid ${C.grid}`,flex:1,minWidth:135}}>
    <div style={{fontSize:10,color:C.slate,fontWeight:700,letterSpacing:.3}}>{label}</div>
    <div style={{fontSize:17,fontWeight:700,fontFamily:mono,marginTop:5,color:acento?C.amber:neg?C.neg:C.ink}}>{v}</div>
  </div>);}
function CabMini({label,v,acento}){return(
  <div style={{padding:"11px 14px",borderRight:`1px solid ${C.grid}`,minWidth:72}}>
    <div style={{fontSize:10,color:C.slate,fontWeight:700,letterSpacing:.3}}>{label}</div>
    <div style={{fontSize:19,fontWeight:700,fontFamily:mono,marginTop:3,color:acento?C.teal:C.ink}}>{v}</div>
  </div>);}

/* ============================================================
   VISTA 2 · CONSULTAS
   ============================================================ */
function VistaConsultas({movil,irASemana}){
  const [q,setQ]=useState("");
  const [f1,setF1]=useState("");
  const [f2,setF2]=useState("");
  const [anio,setAnio]=useState("");
  const [canal,setCanal]=useState("");
  const [soloSaldo,setSoloSaldo]=useState(false);
  const [orden,setOrden]=useState({col:null,dir:1});

  const activo = q.trim()!=="" || f1!=="" || f2!=="" || anio!=="" || canal!=="" || soloSaldo;

  const res=useMemo(()=>{
    if(!activo) return [];
    const qq=q.trim().toLowerCase();
    let out=R.filter((r)=>{
      const [yr,,,cn,num,grupo,,,,,,,,dep,fiso,ftxt,saldo]=r;
      if(anio&&yr!==anio) return false;
      if(canal&&cn!==canal) return false;
      if(soloSaldo&&!(Math.abs(saldo||0)>0.5)) return false;
      if(qq){
        const hayNum=num&&String(num).toLowerCase().includes(qq);
        const hayGrupo=grupo&&String(grupo).toLowerCase().includes(qq);
        const hayTxt=ftxt&&ftxt.toLowerCase().includes(qq);
        if(!hayNum&&!hayGrupo&&!hayTxt) return false;
      }
      if(f1||f2){
        if(!fiso) return false;
        if(f1&&fiso<f1) return false;
        if(f2&&fiso>f2) return false;
      }
      return true;
    });
    if(orden.col!==null){
      const c=orden.col,d=orden.dir;
      out=[...out].sort((a,b)=>{
        const va=a[c],vb=b[c];
        if(va===null||va===undefined) return 1;
        if(vb===null||vb===undefined) return -1;
        if(va<vb) return -d; if(va>vb) return d; return 0;
      });
    }
    return out;
  },[q,f1,f2,anio,canal,soloSaldo,orden,activo]);

  const totDep=useMemo(()=>res.reduce((a,r)=>a+(r[13]||0),0),[res]);
  const totPax=useMemo(()=>res.reduce((a,r)=>a+(r[6]||0),0),[res]);
  const limpiar=()=>{setQ("");setF1("");setF2("");setAnio("");setCanal("");setSoloSaldo(false);setOrden({col:null,dir:1});};
  const ordenar=(col)=>setOrden(o=>o.col===col?{col,dir:-o.dir}:{col,dir:1});
  const IconOrden=({col})=>orden.col!==col?<ArrowUpDown size={11} style={{opacity:.45}}/>:(orden.dir===1?<ArrowUp size={11}/>:<ArrowDown size={11}/>);

  return(
  <div style={{maxWidth:1340,margin:"0 auto",padding:"14px 18px 60px"}}>
    <div style={{background:C.white,border:`1px solid ${C.grid}`,borderRadius:12,padding:"14px 16px"}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:12,alignItems:"flex-end"}}>
        <Campo etiqueta="Buscar RES o texto" ancho={movil?"100%":230}>
          <div style={{position:"relative"}}>
            <Search size={15} color={C.slate} style={{position:"absolute",left:10,top:11}}/>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Ej. 37252 o Com banc" style={{...inp,paddingLeft:32,fontFamily:mono}}/>
          </div>
        </Campo>
        <Campo etiqueta="Depósito desde" ancho={movil?"47%":150}><input type="date" value={f1} onChange={(e)=>setF1(e.target.value)} style={inp}/></Campo>
        <Campo etiqueta="Depósito hasta" ancho={movil?"47%":150}><input type="date" value={f2} onChange={(e)=>setF2(e.target.value)} style={inp}/></Campo>
        <Campo etiqueta="Año" ancho={movil?"47%":110}>
          <select value={anio} onChange={(e)=>setAnio(e.target.value)} style={inp}>
            <option value="">Todos</option>{ANIOS.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Canal" ancho={movil?"47%":135}>
          <select value={canal} onChange={(e)=>setCanal(e.target.value)} style={inp}>
            <option value="">Todos</option>{CANAL_ORDEN.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </Campo>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:12,alignItems:"center"}}>
        <Atajo onClick={()=>{setF1(hoyISO());setF2(hoyISO());}}>Hoy</Atajo>
        <Atajo onClick={()=>{setF1(diasAtras(7));setF2(hoyISO());}}>Últimos 7 días</Atajo>
        <Atajo onClick={()=>{setF1(inicioMes());setF2(hoyISO());}}>Este mes</Atajo>
        <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12.5,color:C.ink,fontWeight:600,cursor:"pointer",padding:"6px 10px",borderRadius:8,background:soloSaldo?C.ambSoft:"transparent",border:`1px solid ${soloSaldo?"#EAD9B0":C.grid}`}}>
          <input type="checkbox" checked={soloSaldo} onChange={(e)=>setSoloSaldo(e.target.checked)} style={{accentColor:C.amber}}/>
          Solo con saldo pendiente
        </label>
        {activo&&<button onClick={limpiar} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 11px",borderRadius:8,border:`1px solid ${C.grid}`,background:C.white,color:C.slate,cursor:"pointer",fontSize:12.5,fontWeight:600,marginLeft:"auto"}}><X size={13}/> Limpiar</button>}
      </div>
    </div>

    <div style={{marginTop:12}}>
      {!activo?(
        <div style={{textAlign:"center",color:C.slate,padding:"48px 0"}}>
          <Filter size={34} color={C.grid} style={{marginBottom:10}}/>
          <div style={{fontSize:15,fontWeight:600}}>Haz una consulta</div>
          <div style={{fontSize:13,marginTop:4}}>Busca una RES, usa un atajo de fecha, o filtra por año, canal o saldo.</div>
        </div>
      ):(
      <>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"0 2px 10px",flexWrap:"wrap",gap:6}}>
          <div style={{fontSize:13,color:C.slate}}><b style={{color:C.ink}}>{res.length}</b> resultado{res.length!==1?"s":""} · <b style={{color:C.ink,fontFamily:mono}}>{numFmt(totPax)}</b> pax</div>
          {res.length>0&&<div style={{fontSize:13,color:C.slate}}>Depósitos mostrados: <b style={{fontFamily:mono,color:C.pos}}>{money(totDep)}</b></div>}
        </div>

        {movil?(
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {res.slice(0,200).map((r,i)=>{
              const [yr,sem,ini,cn,num,grupo,pax,grat,precio,cs,promo,neto,vr,dep,fiso,ftxt,saldo]=r;
              const pend=Math.abs(saldo||0)>0.5;
              return(
              <div key={i} style={{background:C.white,border:`1px solid ${pend?"#EAD9B0":C.grid}`,borderRadius:12,padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontFamily:mono,fontWeight:700,fontSize:15.5,fontStyle:num?"normal":"italic",color:num?C.ink:C.slate}}>{num||(grupo?"\u21B3 "+grupo:"(ajuste)")}</span>
                    <TagCanal cn={cn}/>
                  </div>
                  <button onClick={()=>irASemana(yr,sem,ini)} style={{border:"none",background:"transparent",color:C.teal,fontSize:11.5,fontFamily:mono,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
                    {yr}·S{numFmt(sem)} <ExternalLink size={11}/>
                  </button>
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
            {res.length>200&&<div style={{fontSize:12.5,color:C.slate,textAlign:"center",padding:"8px 0"}}>Mostrando 200 de {res.length}. Afina la consulta.</div>}
          </div>
        ):(
          <div style={{background:C.white,border:`1px solid ${C.grid}`,borderRadius:10,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{borderCollapse:"collapse",width:"100%",minWidth:1220,fontSize:12.8}}>
                <thead>
                  <tr style={{background:C.head}}>
                    <th style={{...thC,textAlign:"left"}}>Año</th>
                    <th style={{...thC,textAlign:"left"}}>Sem</th>
                    <th style={{...thC,textAlign:"left"}}>Salida</th>
                    <th style={{...thC,textAlign:"left"}}>Canal</th>
                    <th style={{...thC,textAlign:"left"}}>Reserva</th>
                    <th style={thC}>Paxs</th>
                    <th style={thC}>Grat</th>
                    <th style={thC}>Precio</th>
                    <th style={thC}>Desc CS</th>
                    <th style={thC}>Promoción</th>
                    <th style={thC}>% neto</th>
                    <th style={{...thC,cursor:"pointer"}} onClick={()=>ordenar(12)}>Valor Reserva <IconOrden col={12}/></th>
                    <th style={{...thC,cursor:"pointer"}} onClick={()=>ordenar(13)}>Depósito <IconOrden col={13}/></th>
                    <th style={{...thC,textAlign:"center",cursor:"pointer"}} onClick={()=>ordenar(14)}>Fecha Dep. <IconOrden col={14}/></th>
                    <th style={{...thC,cursor:"pointer"}} onClick={()=>ordenar(16)}>Saldo <IconOrden col={16}/></th>
                    <th style={thC}></th>
                  </tr>
                </thead>
                <tbody>
                  {res.slice(0,400).map((r,i)=>{
                    const [yr,sem,ini,cn,num,grupo,pax,grat,precio,cs,promo,neto,vr,dep,fiso,ftxt,saldo,nres]=r;
                    return(
                    <tr key={i} style={{background:i%2?C.white:"#FBFCFD"}}>
                      <td style={{...tdC,fontFamily:mono}}>{yr}</td>
                      <td style={{...tdC,fontFamily:mono}}>{numFmt(sem)}</td>
                      <td style={{...tdC,fontFamily:mono,fontSize:11.8,color:C.slate}}>{dmy(ini)}</td>
                      <td style={tdC}><TagCanal cn={cn}/></td>
                      <td style={{...tdC,fontFamily:mono,fontWeight:600,fontStyle:num?"normal":"italic",color:num?C.ink:C.slate}}>{num?(nres&&String(nres)!==String(num)?`${num} \u2192 ${nres}`:num):(grupo?`\u21B3 ${grupo}`:"(ajuste)")}</td>
                      <td style={tdNC}>{numFmt(pax)}</td>
                      <td style={tdNC}>{grat?numFmt(grat):""}</td>
                      <td style={tdNC}>{money(precio)}</td>
                      <td style={{...tdNC,color:C.neg}}>{money(cs)}</td>
                      <td style={{...tdNC,color:promo?C.neg:C.ink}}>{money(promo)}</td>
                      <td style={tdNC}>{(neto!==null&&neto!==undefined)?(neto*100).toFixed(0)+"%":""}</td>
                      <td style={{...tdNC,color:vr<0?C.neg:C.ink}}>{money(vr)}</td>
                      <td style={{...tdNC,color:C.pos}}>{money(dep)}</td>
                      <td style={{...tdC,textAlign:"center",fontFamily:mono,fontSize:11.5,color:fiso?C.ink:C.slate,fontStyle:fiso?"normal":"italic"}}>{fiso?dmy(fiso):(ftxt||"")}</td>
                      <td style={{...tdNC,color:Math.abs(saldo||0)>0.5?C.amber:C.slate,fontWeight:Math.abs(saldo||0)>0.5?700:400}}>{money(saldo)}</td>
                      <td style={tdC}><button onClick={()=>irASemana(yr,sem,ini)} title="Ver la semana en el cuadro" style={{border:"none",background:"transparent",color:C.teal,cursor:"pointer",padding:2}}><ExternalLink size={13}/></button></td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
            {res.length>400&&<div style={{padding:"10px 16px",fontSize:12.5,color:C.slate,borderTop:`1px solid ${C.gridSoft}`}}>Mostrando 400 de {res.length}. Afina la consulta.</div>}
          </div>
        )}
      </>)}
    </div>
  </div>);
}

/* ============================================================
   VISTA 3 · RESUMEN (ventas por año y por mes)
   Sumas de los valores del Excel, nada más.
   ============================================================ */
function VistaResumen({movil}){
  const [anioMes,setAnioMes]=useState("2026");

  const porAnio=useMemo(()=>{
    const m={};
    for(const r of R){
      const yr=r[0];
      if(!m[yr]) m[yr]={venta:0,dep:0,pax:0,semanas:new Set()};
      if(r[12]) m[yr].venta+=r[12];
      if(r[13]) m[yr].dep+=r[13];
      if(r[6])  m[yr].pax+=r[6];
      m[yr].semanas.add(`${r[1]}|${r[2]}`);
    }
    return m;
  },[]);

  const porMes=useMemo(()=>{
    const m=Array.from({length:12},()=>({venta:0,dep:0,pax:0,semanas:new Set()}));
    for(const r of R){
      if(r[0]!==anioMes||!r[2]) continue;
      const mes=parseInt(r[2].slice(5,7),10)-1;
      if(mes<0||mes>11) continue;
      if(r[12]) m[mes].venta+=r[12];
      if(r[13]) m[mes].dep+=r[13];
      if(r[6])  m[mes].pax+=r[6];
      m[mes].semanas.add(`${r[1]}|${r[2]}`);
    }
    return m;
  },[anioMes]);

  const maxAnio=Math.max(...ANIOS.map(a=>porAnio[a]?-porAnio[a].venta:0));
  const maxMes=Math.max(1,...porMes.map(x=>-x.venta));

  return(
  <div style={{maxWidth:1340,margin:"0 auto",padding:"14px 18px 60px"}}>
    {/* ventas por año */}
    <Seccion titulo="Ventas por año" nota="Suma de la columna Valor de Reserva del Excel (incluye ajustes).">
      <table style={{borderCollapse:"collapse",width:"100%",fontSize:13}}>
        <thead><tr style={{background:C.head}}>
          <th style={{...thC,textAlign:"left"}}>Año</th><th style={thC}>Venta</th>
          {!movil&&<th style={thC}>Depósitos</th>}
          <th style={thC}>Paxs</th>{!movil&&<th style={thC}>Semanas</th>}
          <th style={{...thC,textAlign:"left",width:"34%"}}></th>
        </tr></thead>
        <tbody>
          {ANIOS.map((a,i)=>{
            const d=porAnio[a]; if(!d) return null;
            const venta=-d.venta;
            return(
            <tr key={a} style={{background:i%2?C.white:"#FBFCFD"}}>
              <td style={{...tdC,fontFamily:mono,fontWeight:700}}>{a}</td>
              <td style={{...tdNC,fontWeight:700}}>{money0(venta)}</td>
              {!movil&&<td style={{...tdNC,color:C.pos}}>{money0(d.dep)}</td>}
              <td style={tdNC}>{numFmt(d.pax)}</td>
              {!movil&&<td style={tdNC}>{d.semanas.size}</td>}
              <td style={{...tdC,paddingRight:14}}>
                <div style={{height:13,borderRadius:3,background:C.teal,width:`${Math.max(2,venta/maxAnio*100)}%`,opacity:.85}}/>
              </td>
            </tr>);
          })}
        </tbody>
      </table>
    </Seccion>

    {/* ventas por mes */}
    <Seccion titulo="Ventas por mes" nota="Según la fecha de inicio de cada semana." extra={
      <select value={anioMes} onChange={(e)=>setAnioMes(e.target.value)} style={{...inp,width:110,fontFamily:mono,fontWeight:700}}>
        {ANIOS.map(a=><option key={a} value={a}>{a}</option>)}
      </select>}>
      <table style={{borderCollapse:"collapse",width:"100%",fontSize:13}}>
        <thead><tr style={{background:C.head}}>
          <th style={{...thC,textAlign:"left"}}>Mes</th><th style={thC}>Venta</th>
          {!movil&&<th style={thC}>Depósitos</th>}
          <th style={thC}>Paxs</th>{!movil&&<th style={thC}>Semanas</th>}
          <th style={{...thC,textAlign:"left",width:"34%"}}></th>
        </tr></thead>
        <tbody>
          {porMes.map((d,i)=>{
            const venta=-d.venta;
            return(
            <tr key={i} style={{background:i%2?C.white:"#FBFCFD"}}>
              <td style={{...tdC,fontWeight:600}}>{MESES[i]}</td>
              <td style={{...tdNC,fontWeight:700}}>{venta?money0(venta):""}</td>
              {!movil&&<td style={{...tdNC,color:C.pos}}>{d.dep?money0(d.dep):""}</td>}
              <td style={tdNC}>{d.pax?numFmt(d.pax):""}</td>
              {!movil&&<td style={tdNC}>{d.semanas.size||""}</td>}
              <td style={{...tdC,paddingRight:14}}>
                {venta>0&&<div style={{height:13,borderRadius:3,background:C.navy,width:`${Math.max(2,venta/maxMes*100)}%`,opacity:.85}}/>}
              </td>
            </tr>);
          })}
        </tbody>
      </table>
    </Seccion>
  </div>);
}

function Seccion({titulo,nota,extra,children}){
  return(
  <div style={{background:C.white,border:`1px solid ${C.grid}`,borderRadius:12,overflow:"hidden",marginBottom:16}}>
    <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.grid}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <div>
        <div style={{fontWeight:700,fontSize:15,color:C.navy}}>{titulo}</div>
        {nota&&<div style={{fontSize:11.5,color:C.slate,marginTop:2}}>{nota}</div>}
      </div>
      {extra}
    </div>
    {children}
  </div>);
}

/* ===== compartidos ===== */
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
const thC={padding:"9px 9px",fontSize:10.5,fontWeight:700,color:C.slate,borderRight:`1px solid ${C.grid}`,borderBottom:`1px solid ${C.grid}`,whiteSpace:"nowrap",letterSpacing:.2,textAlign:"right",userSelect:"none"};
const tdC={padding:"6px 9px",borderRight:`1px solid ${C.gridSoft}`,borderBottom:`1px solid ${C.gridSoft}`,whiteSpace:"nowrap"};
const tdNC={...tdC,textAlign:"right",fontFamily:mono};
