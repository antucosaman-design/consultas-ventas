import React, { useState, useMemo } from "react";
import { Search, Calendar, Filter, X } from "lucide-react";
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
  navy:"#0A2540", navyDeep:"#06192E", teal:"#0E8A94", tealSoft:"#E5F2F3",
  ink:"#1B2A38", slate:"#5E7087", grid:"#CFD8E0", gridSoft:"#E7ECF1",
  head:"#EEF2F6", paper:"#F4F7FA", white:"#FFFFFF",
  neg:"#B23A2E", amber:"#B9770F", pos:"#0F7A53",
};
const mono = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";
const ANIOS = ["2022","2023","2024","2025","2026"];
const CANALES = ["EV","GALASAM","GIANNA","SAMIRA","VARIAS","BLOQUE1","BLOQUE2","BLOQUE3","BLOQUE4","BLOQUE5"];

const money=(n)=>(n===null||n===undefined||isNaN(n))?"":(n<0?"-$":"$")+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const dmy=(iso)=>{if(!iso)return"";const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso);return m?`${m[3]}/${m[2]}/${m[1]}`:iso;};
const numFmt=(n)=>(n===null||n===undefined)?"":(Number.isInteger(n)?n:Number(n.toFixed(2)));

export default function App(){
  const [q,setQ]=useState("");
  const [f1,setF1]=useState("");   // fecha depósito desde
  const [f2,setF2]=useState("");   // hasta
  const [anio,setAnio]=useState("");
  const [canal,setCanal]=useState("");

  const activo = q.trim()!=="" || f1!=="" || f2!=="" || anio!=="" || canal!=="";

  const res = useMemo(()=>{
    if(!activo) return [];
    const qq=q.trim().toLowerCase();
    return R.filter((r)=>{
      const [yr,sem,ini,cn,num,pax,grat,precio,cs,promo,neto,vr,dep,fiso,ftxt,saldo]=r;
      if(anio && yr!==anio) return false;
      if(canal && cn!==canal) return false;
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
  },[q,f1,f2,anio,canal,activo]);

  const totDep = useMemo(()=>res.reduce((a,r)=>a+(r[12]||0),0),[res]);

  const limpiar=()=>{setQ("");setF1("");setF2("");setAnio("");setCanal("");};

  return(
  <div style={{background:C.paper,minHeight:"100vh",color:C.ink,fontFamily:"system-ui,-apple-system,sans-serif"}}>
    <header style={{background:C.navy,color:C.white}}>
      <div style={{maxWidth:1320,margin:"0 auto",padding:"16px 22px"}}>
        <div style={{fontSize:18,fontWeight:700}}>Consultas · Cuadro de Ventas</div>
        <div style={{fontSize:11.5,color:"#9DB4C8",marginTop:2,letterSpacing:.5}}>HUMBOLDT EXPLORER · DATOS 2022–2026 TAL CUAL DEL EXCEL</div>
      </div>
    </header>

    {/* Panel de consulta */}
    <div style={{maxWidth:1320,margin:"0 auto",padding:"18px 22px 0"}}>
      <div style={{background:C.white,border:`1px solid ${C.grid}`,borderRadius:12,padding:"16px 18px",display:"flex",flexWrap:"wrap",gap:14,alignItems:"flex-end"}}>
        <Campo etiqueta="Buscar RES o texto" ancho={230}>
          <div style={{position:"relative"}}>
            <Search size={15} color={C.slate} style={{position:"absolute",left:10,top:10}}/>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Ej. 37252 o Com banc"
              style={{...inp,paddingLeft:32,fontFamily:mono}}/>
          </div>
        </Campo>
        <Campo etiqueta="Depósito desde" ancho={160}>
          <input type="date" value={f1} onChange={(e)=>setF1(e.target.value)} style={inp}/>
        </Campo>
        <Campo etiqueta="Depósito hasta" ancho={160}>
          <input type="date" value={f2} onChange={(e)=>setF2(e.target.value)} style={inp}/>
        </Campo>
        <Campo etiqueta="Año (pestaña)" ancho={120}>
          <select value={anio} onChange={(e)=>setAnio(e.target.value)} style={inp}>
            <option value="">Todos</option>
            {ANIOS.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Canal" ancho={140}>
          <select value={canal} onChange={(e)=>setCanal(e.target.value)} style={inp}>
            <option value="">Todos</option>
            {CANALES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </Campo>
        {activo && (
          <button onClick={limpiar} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 14px",borderRadius:8,border:`1px solid ${C.grid}`,background:C.white,color:C.slate,cursor:"pointer",fontSize:13,fontWeight:600}}>
            <X size={14}/> Limpiar
          </button>
        )}
      </div>

      {/* Atajo: para consultar un día puntual, mismo valor en desde y hasta */}
      <div style={{fontSize:12,color:C.slate,marginTop:8}}>
        Tip: para "¿qué RES se pagaron el 02/07/2026?", pon esa fecha en <b>desde</b> y <b>hasta</b>.
      </div>
    </div>

    {/* Resultados */}
    <main style={{maxWidth:1320,margin:"0 auto",padding:"14px 22px 60px"}}>
      {!activo ? (
        <div style={{textAlign:"center",color:C.slate,padding:"60px 0"}}>
          <Filter size={36} color={C.grid} style={{marginBottom:10}}/>
          <div style={{fontSize:15,fontWeight:600}}>Haz una consulta</div>
          <div style={{fontSize:13,marginTop:4}}>Busca una RES, filtra por fecha de depósito, año o canal.</div>
        </div>
      ) : (
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"4px 2px 10px",flexWrap:"wrap",gap:8}}>
            <div style={{fontSize:13.5,color:C.slate}}>
              <b style={{color:C.ink}}>{res.length}</b> resultado{res.length!==1?"s":""}
            </div>
            {res.length>0 && (
              <div style={{fontSize:13.5,color:C.slate}}>
                Suma de depósitos mostrados: <b style={{fontFamily:mono,color:C.pos}}>{money(totDep)}</b>
              </div>
            )}
          </div>

          <div style={{background:C.white,border:`1px solid ${C.grid}`,borderRadius:10,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{borderCollapse:"collapse",width:"100%",minWidth:1180,fontSize:12.8}}>
                <thead>
                  <tr style={{background:C.head}}>
                    {["Año","Sem","Salida","Canal","Reserva","Paxs","Grat","Precio","Desc CS","Promoción","% neto","Valor Reserva","Depósito","Fecha Dep.","Saldo"].map((h,i)=>(
                      <th key={i} style={{...th,textAlign:i<=4?"left":i===13?"center":"right"}}>{h}</th>))}
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
                      <td style={td}><span style={{fontSize:10.5,fontWeight:700,padding:"2px 7px",borderRadius:4,background:cn==="EV"?C.navy:C.tealSoft,color:cn==="EV"?C.white:C.teal}}>{cn}</span></td>
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
                      <td style={{...tdN,color:Math.abs(saldo||0)>0.5?C.amber:C.slate}}>{money(saldo)}</td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
            {res.length>400 && <div style={{padding:"10px 16px",fontSize:12.5,color:C.slate,borderTop:`1px solid ${C.gridSoft}`}}>Mostrando 400 de {res.length}. Afina la consulta para ver menos resultados.</div>}
          </div>
        </>
      )}
    </main>
  </div>);
}

function Campo({etiqueta,ancho,children}){
  return(<div style={{width:ancho}}>
    <div style={{fontSize:11,fontWeight:700,color:C.slate,letterSpacing:.3,marginBottom:5}}>{etiqueta}</div>
    {children}
  </div>);
}
const inp={width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${C.grid}`,fontSize:13.5,outline:"none",background:C.white,boxSizing:"border-box",color:C.ink};
const th={padding:"9px 9px",fontSize:10.5,fontWeight:700,color:C.slate,borderRight:`1px solid ${C.grid}`,borderBottom:`1px solid ${C.grid}`,whiteSpace:"nowrap",letterSpacing:.2};
const td={padding:"6px 9px",borderRight:`1px solid ${C.gridSoft}`,borderBottom:`1px solid ${C.gridSoft}`,whiteSpace:"nowrap"};
const tdN={...td,textAlign:"right",fontFamily:mono};
