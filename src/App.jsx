import { useState, useEffect } from "react";

const SK='gf_v2';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const todayS=()=>new Date().toISOString().slice(0,10);
const thisMonthS=()=>new Date().toISOString().slice(0,7);
const getMondayS=()=>{const d=new Date(),day=d.getDay(),diff=d.getDate()-day+(day===0?-6:1);return new Date(d.setDate(diff)).toISOString().slice(0,10);};
const fmtMonth=iso=>iso?new Date(iso+'-01').toLocaleDateString('en-US',{month:'long',year:'numeric'}):'';
const fmtWeek=iso=>{if(!iso)return'';const mon=new Date(iso),sun=new Date(mon);sun.setDate(mon.getDate()+6);const f=d=>d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});return f(mon)+' – '+f(sun);};
const fmtDate=iso=>iso?new Date(iso+'T00:00').toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short'}):'';

const LEVELS=[
  {id:'longTerm', label:'Long-term goals', sub:'1–5 years',     clr:'#6366f1',tint:'rgba(99,102,241,0.1)'},
  {id:'midTerm',  label:'Mid-term goals',  sub:'3–12 months',   clr:'#8b5cf6',tint:'rgba(139,92,246,0.1)'},
  {id:'shortTerm',label:'Short-term goals',sub:'1–3 months',    clr:'#ec4899',tint:'rgba(236,72,153,0.1)'},
  {id:'monthly',  label:'Monthly plans',   sub:'Month by month',clr:'#0ea5e9',tint:'rgba(14,165,233,0.1)'},
  {id:'weekly',   label:'Weekly plans',    sub:'Week by week',  clr:'#10b981',tint:'rgba(16,185,129,0.1)'},
  {id:'daily',    label:'Daily tasks',     sub:'Day by day',    clr:'#f59e0b',tint:'rgba(245,158,11,0.1)'},
];
const PARENT_OF={midTerm:'longTerm',shortTerm:'midTerm',monthly:'shortTerm',weekly:'monthly',daily:'weekly'};
const CHILD_OF=Object.fromEntries(Object.entries(PARENT_OF).map(([k,v])=>[v,k]));
const L=id=>LEVELS.find(l=>l.id===id);
const EMPTY=()=>({longTerm:[],midTerm:[],shortTerm:[],monthly:[],weekly:[],daily:[]});

export default function App(){
  const [db,setDb]=useState(()=>{try{return JSON.parse(localStorage.getItem(SK))||EMPTY();}catch{return EMPTY();}});
  const [active,setActive]=useState('longTerm');
  const [expanded,setExpanded]=useState({});
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const [dlg,setDlg]=useState(null);
  const [outlook,setOutlook]=useState(false);
  const [navOpen,setNavOpen]=useState(false);
  const [w,setW]=useState(window.innerWidth);

  useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h);},[]);
  useEffect(()=>{localStorage.setItem(SK,JSON.stringify(db));},[db]);
  const mob=w<640;

  const addI=(lvl,item)=>setDb(d=>({...d,[lvl]:[...d[lvl],{...item,id:uid(),done:false,at:Date.now()}]}));
  const updI=(lvl,id,p)=>setDb(d=>({...d,[lvl]:d[lvl].map(i=>i.id===id?{...i,...p}:i)}));
  const delI=(lvl,id)=>setDb(d=>({...d,[lvl]:d[lvl].filter(i=>i.id!==id)}));
  const tog=(lvl,id)=>setDb(d=>({...d,[lvl]:d[lvl].map(i=>i.id===id?{...i,done:!i.done}:i)}));

  const mkForm=(lvl,pid='')=>{
    const b={title:'',notes:'',parentId:pid};
    if(lvl==='monthly')return{...b,period:thisMonthS()};
    if(lvl==='weekly')return{...b,weekStart:getMondayS()};
    if(lvl==='daily')return{...b,date:todayS(),tStart:'09:00',tEnd:'10:00'};
    return b;
  };
  const openAdd=(lvl,pid='')=>{setForm(mkForm(lvl,pid));setModal({mode:'add',lvl});};
  const openEdit=(lvl,item)=>{setForm({...item});setModal({mode:'edit',lvl,id:item.id});};
  const saveMdl=()=>{if(!form.title?.trim())return;if(modal.mode==='add')addI(modal.lvl,form);else updI(modal.lvl,modal.id,form);setModal(null);};

  const aL=L(active);
  const items=db[active]||[];
  const childId=CHILD_OF[active];
  const childrenOf=pid=>childId?(db[childId]||[]).filter(i=>i.parentId===pid):[];
  const parentName=item=>{const pid=PARENT_OF[active];return pid&&item.parentId?(db[pid]||[]).find(p=>p.id===item.parentId)?.title||null:null;};
  const periodLbl=(item,lvl)=>{if(lvl==='monthly')return fmtMonth(item.period);if(lvl==='weekly')return fmtWeek(item.weekStart);if(lvl==='daily')return fmtDate(item.date);return null;};
  const doneCount=lvl=>(db[lvl]||[]).filter(i=>i.done).length;

  const chk=(done,clr,size,onT)=>(
    <div onClick={onT} style={{width:size,height:size,borderRadius:size*0.28,border:`2px solid ${done?clr:'#d1d5db'}`,background:done?clr:'transparent',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
      {done&&<span style={{color:'#fff',fontSize:size*0.6,lineHeight:1}}>✓</span>}
    </div>
  );

  const iBtn=(icon,title,clr,onClick)=>(
    <button title={title} onClick={onClick} style={{background:'none',border:'none',cursor:'pointer',padding:'4px 5px',borderRadius:6,color:clr||'#9ca3af',display:'flex',alignItems:'center',fontSize:15}}>
      {icon}
    </button>
  );

  const NavItems=()=>LEVELS.map(l=>{
    const tot=db[l.id]?.length||0,dn=doneCount(l.id),isA=active===l.id;
    return(
      <div key={l.id} onClick={()=>{setActive(l.id);setNavOpen(false);}} style={{display:'flex',alignItems:'center',padding:'10px 18px',cursor:'pointer',background:isA?`${l.clr}22`:'transparent',borderLeft:`3px solid ${isA?l.clr:'transparent'}`}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:l.clr,marginRight:10,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:isA?600:400,color:isA?'#fff':'rgba(255,255,255,0.45)'}}>{l.label}</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:1}}>{l.sub}</div>
        </div>
        {tot>0&&<span style={{fontSize:11,color:dn===tot?l.clr:'rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.07)',borderRadius:10,padding:'1px 8px'}}>{dn}/{tot}</span>}
      </div>
    );
  });

  const Card=({item,lvl})=>{
    const lc=L(lvl),isEx=expanded[item.id],kids=childrenOf(item.id),cL=L(childId);
    const pn=parentName(item),pd=periodLbl(item,lvl);
    return(
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,marginBottom:10,opacity:item.done?0.55:1}}>
        <div style={{display:'flex',alignItems:'flex-start',padding:'13px 14px',gap:10}}>
          {chk(item.done,lc.clr,20,()=>tog(lvl,item.id))}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:500,color:item.done?'#94a3b8':'#1e293b',textDecoration:item.done?'line-through':'none',wordBreak:'break-word',lineHeight:1.4}}>{item.title}</div>
            {item.notes&&<div style={{fontSize:13,color:'#64748b',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.notes}</div>}
            <div style={{display:'flex',gap:5,marginTop:7,flexWrap:'wrap'}}>
              {pd&&<span style={{fontSize:11,background:lc.tint,color:lc.clr,borderRadius:5,padding:'2px 8px',fontWeight:600}}>{pd}</span>}
              {lvl==='daily'&&item.tStart&&<span style={{fontSize:11,background:'rgba(245,158,11,0.1)',color:'#b45309',borderRadius:5,padding:'2px 8px',fontWeight:600}}>⏰ {item.tStart}–{item.tEnd}</span>}
              {pn&&<span style={{fontSize:11,background:'#f8fafc',color:'#64748b',borderRadius:5,padding:'2px 8px',border:'1px solid #e2e8f0'}}>↑ {pn}</span>}
            </div>
          </div>
          <div style={{display:'flex',gap:0,flexShrink:0,marginTop:-2}}>
            {lvl==='daily'&&iBtn('📧','Sync to Outlook','#0ea5e9',()=>setOutlook(true))}
            {cL&&iBtn(isEx?'▲':'▼',`Linked ${cL.label}`,undefined,()=>setExpanded(e=>({...e,[item.id]:!e[item.id]})))}
            {iBtn('✏️','Edit',undefined,()=>openEdit(lvl,item))}
            {iBtn('🗑','Delete','#ef4444',()=>setDlg({lvl,id:item.id,title:item.title}))}
          </div>
        </div>
        {isEx&&cL&&(
          <div style={{borderTop:'1px solid #f1f5f9',padding:'12px 14px',background:'#fafafa',borderRadius:'0 0 12px 12px'}}>
            <div style={{fontSize:11,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.6px',marginBottom:9}}>Linked {cL.label}</div>
            {kids.length===0&&<div style={{fontSize:13,color:'#94a3b8',marginBottom:8}}>None linked yet.</div>}
            {kids.map(kid=>(
              <div key={kid.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid #f1f5f9'}}>
                {chk(kid.done,cL.clr,16,()=>tog(childId,kid.id))}
                <div style={{flex:1,fontSize:13,color:kid.done?'#94a3b8':'#334155',textDecoration:kid.done?'line-through':'none',wordBreak:'break-word'}}>{kid.title}</div>
                {iBtn('✏️','Edit',undefined,()=>openEdit(childId,kid))}
                {iBtn('🗑','Delete','#ef4444',()=>setDlg({lvl:childId,id:kid.id,title:kid.title}))}
              </div>
            ))}
            <button onClick={()=>openAdd(childId,item.id)} style={{background:'none',border:'1px dashed #cbd5e1',borderRadius:6,color:cL.clr,padding:'5px 12px',fontSize:12,fontWeight:600,cursor:'pointer',marginTop:9,display:'flex',alignItems:'center',gap:4}}>
              + Add linked {cL.label.replace(/s$/,'').replace(' plan','').replace(' task','').replace(' goal','')}
            </button>
          </div>
        )}
      </div>
    );
  };

  const inp={width:'100%',border:'1px solid #d1d5db',borderRadius:8,padding:'8px 11px',fontSize:14,outline:'none',boxSizing:'border-box',color:'#1e293b',background:'#fff',fontFamily:'inherit',marginBottom:0};
  const lbl=txt=><label style={{fontSize:13,fontWeight:600,color:'#374151',marginBottom:5,display:'block',marginTop:12}}>{txt}</label>;

  const steps=[
    ['Register a free Azure app','Go to portal.azure.com → App registrations → New registration. Name it "GoalFlow". Set redirect URI type to Single-page application and enter your Vercel URL.'],
    ['Grant calendar permission','In your app → API permissions → Add → Microsoft Graph → Delegated → Calendars.ReadWrite. Grant consent when prompted.'],
    ['Copy your client ID','From the app Overview, copy the Application (client) ID — a GUID like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.'],
    ['Deploy to Vercel','Push code to GitHub and import at vercel.com. Add environment variable: VITE_MS_CLIENT_ID = your client ID.'],
    ['Sign in and sync','Open your deployed app and click Connect Outlook. After one-time consent, the 📧 icon on daily tasks creates a Busy event in Outlook.'],
  ];

  const sidebar=(
    <div style={{width:240,background:'#16213e',display:'flex',flexDirection:'column',height:'100%',overflowY:'auto',flexShrink:0}}>
      <div style={{padding:'18px 18px 14px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div style={{fontSize:18,fontWeight:700,color:'#fff',letterSpacing:'-0.3px'}}>🎯 GoalFlow</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:2}}>Your personal goal cascade</div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'6px 0'}}><NavItems/></div>
      <div style={{padding:'10px 18px',borderTop:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:11,color:'rgba(255,255,255,0.22)'}}>Auto-saved locally</span>
        <button onClick={()=>setOutlook(true)} style={{background:'none',border:'none',cursor:'pointer',color:'#0ea5e9',fontSize:11,display:'flex',alignItems:'center',gap:3,padding:0}}>📧 Outlook</button>
      </div>
    </div>
  );

  return(
    <div style={{position:'relative',height:'100vh',display:'flex',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',background:'#f8fafc',overflow:'hidden'}}>

      {!mob&&sidebar}

      {mob&&navOpen&&(
        <div style={{position:'absolute',inset:0,zIndex:60,display:'flex'}}>
          <div onClick={()=>setNavOpen(false)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)'}}/>
          <div style={{position:'relative',width:220,background:'#16213e',height:'100%',display:'flex',flexDirection:'column',zIndex:1,overflowY:'auto'}}>
            <div style={{padding:'16px 18px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:16,fontWeight:700,color:'#fff'}}>🎯 GoalFlow</div>
              <button onClick={()=>setNavOpen(false)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)',fontSize:18}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'6px 0'}}><NavItems/></div>
          </div>
        </div>
      )}

      <div style={{flex:1,display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',minWidth:0}}>
        <div style={{padding:'13px 20px',background:'#fff',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
          {mob&&(
            <button onClick={()=>setNavOpen(true)} style={{background:'none',border:'none',cursor:'pointer',padding:4,color:'#64748b',fontSize:20}}>☰</button>
          )}
          <div style={{flex:1}}>
            <div style={{fontSize:mob?16:20,fontWeight:700,color:'#0f172a'}}>{aL.label}</div>
            <div style={{fontSize:11,color:aL.clr,fontWeight:600,marginTop:1}}>{aL.sub}</div>
          </div>
          <button onClick={()=>openAdd(active)} style={{background:aL.clr,color:'#fff',border:'none',borderRadius:8,padding:mob?'7px 14px':'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer'}}>
            + Add
          </button>
        </div>

        {items.length>0&&(()=>{const d=items.filter(i=>i.done).length,pct=Math.round(d/items.length*100);return(
          <div style={{padding:'7px 20px',background:'#fff',borderBottom:'1px solid #f1f5f9',flexShrink:0}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#94a3b8',marginBottom:4}}>
              <span>{d} of {items.length} done</span><span>{pct}%</span>
            </div>
            <div style={{background:'#f1f5f9',borderRadius:3,height:3}}>
              <div style={{background:aL.clr,width:`${pct}%`,height:3,borderRadius:3,transition:'width 0.3s'}}/>
            </div>
          </div>
        );})()}

        <div style={{flex:1,overflowY:'auto',padding:'14px 20px'}}>
          {items.length===0?(
            <div style={{textAlign:'center',padding:'60px 20px'}}>
              <div style={{fontSize:48,marginBottom:12}}>📋</div>
              <div style={{fontSize:17,fontWeight:600,color:'#64748b',marginBottom:6}}>Nothing here yet</div>
              <div style={{fontSize:13,color:'#94a3b8',marginBottom:22}}>Add your first {aL.label.replace(/s$/,'').toLowerCase()} to get started</div>
              <button onClick={()=>openAdd(active)} style={{background:aL.clr,color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                + Add {aL.label.replace(/s$/,'')}
              </button>
            </div>
          ):items.map(item=><Card key={item.id} item={item} lvl={active}/>)}
        </div>

        {mob&&(
          <div style={{display:'flex',background:'#16213e',borderTop:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>
            {LEVELS.map(l=>(
              <button key={l.id} onClick={()=>setActive(l.id)} style={{flex:1,padding:'9px 4px',background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                <div style={{width:5,height:5,borderRadius:'50%',background:active===l.id?l.clr:'rgba(255,255,255,0.2)'}}/>
                <div style={{fontSize:8,color:active===l.id?l.clr:'rgba(255,255,255,0.3)',fontWeight:active===l.id?600:400,textAlign:'center'}}>{l.label.split(' ')[0]}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {modal&&(
        <div onClick={e=>e.target===e.currentTarget&&setModal(null)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:16}}>
          <div style={{background:'#fff',borderRadius:14,width:'100%',maxWidth:440,boxShadow:'0 12px 40px rgba(0,0,0,0.2)',maxHeight:'90%',overflowY:'auto'}}>
            {(()=>{const lc=L(modal.lvl),mPid=PARENT_OF[modal.lvl],mPL=mPid?L(mPid):null,mPI=mPid?db[mPid]||[]:[];return(<>
              <div style={{padding:'15px 18px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:'#1e293b'}}>{modal.mode==='add'?'New ':'Edit '}{lc.label.replace(/s$/,'')}</div>
                  <div style={{fontSize:11,color:lc.clr,marginTop:1}}>{lc.sub}</div>
                </div>
                <button onClick={()=>setModal(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#94a3b8'}}>✕</button>
              </div>
              <div style={{padding:'16px 18px'}}>
                {lbl('Title')}
                <input autoFocus value={form.title||''} onChange={e=>setForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&saveMdl()} placeholder={lc.label.replace(/s$/,'')+' title…'} style={inp}/>
                {lbl('Notes')}
                <textarea value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional details…" style={{...inp,resize:'vertical',minHeight:64}}/>
                {modal.lvl==='monthly'&&<>{lbl('Month')}<input type="month" value={form.period||thisMonthS()} onChange={e=>setForm(f=>({...f,period:e.target.value}))} style={inp}/></>}
                {modal.lvl==='weekly'&&<>{lbl('Week starting (Monday)')}<input type="date" value={form.weekStart||getMondayS()} onChange={e=>setForm(f=>({...f,weekStart:e.target.value}))} style={inp}/></>}
                {modal.lvl==='daily'&&<>
                  {lbl('Date')}<input type="date" value={form.date||todayS()} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp}/>
                  <div style={{display:'flex',gap:12,marginTop:12}}>
                    <div style={{flex:1}}>{lbl('Start time')}<input type="time" value={form.tStart||'09:00'} onChange={e=>setForm(f=>({...f,tStart:e.target.value}))} style={inp}/></div>
                    <div style={{flex:1}}>{lbl('End time')}<input type="time" value={form.tEnd||'10:00'} onChange={e=>setForm(f=>({...f,tEnd:e.target.value}))} style={inp}/></div>
                  </div>
                  <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'9px 12px',marginTop:12,fontSize:12,color:'#1d4ed8',lineHeight:1.6}}>
                    📧 After saving, tap the 📧 icon on the task card to sync it as Busy in Outlook.
                  </div>
                </>}
                {mPL&&mPI.length>0&&<>
                  {lbl(`Link to ${mPL.label.replace(/s$/,'')} (optional)`)}
                  <select value={form.parentId||''} onChange={e=>setForm(f=>({...f,parentId:e.target.value}))} style={inp}>
                    <option value="">— Not linked —</option>
                    {mPI.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </>}
                <div style={{display:'flex',gap:8,marginTop:16}}>
                  <button onClick={()=>setModal(null)} style={{background:'#f1f5f9',color:'#64748b',border:'none',borderRadius:8,padding:'9px 16px',fontSize:14,cursor:'pointer'}}>Cancel</button>
                  <button onClick={saveMdl} style={{flex:1,background:lc.clr,color:'#fff',border:'none',borderRadius:8,padding:'9px',fontSize:14,fontWeight:600,cursor:'pointer'}}>{modal.mode==='add'?'Save':'Update'}</button>
                </div>
              </div>
            </>);})()}
          </div>
        </div>
      )}

      {dlg&&(
        <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:16}}>
          <div style={{background:'#fff',borderRadius:14,padding:22,maxWidth:320,width:'100%',boxShadow:'0 12px 40px rgba(0,0,0,0.2)'}}>
            <div style={{fontSize:15,fontWeight:700,color:'#1e293b',marginBottom:8}}>Delete item?</div>
            <div style={{fontSize:13,color:'#64748b',marginBottom:20,lineHeight:1.5}}>"{dlg.title}" will be permanently removed.</div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setDlg(null)} style={{flex:1,background:'#f1f5f9',color:'#64748b',border:'none',borderRadius:8,padding:'8px',fontSize:14,cursor:'pointer'}}>Cancel</button>
              <button onClick={()=>{delI(dlg.lvl,dlg.id);setDlg(null);}} style={{flex:1,background:'#ef4444',color:'#fff',border:'none',borderRadius:8,padding:'8px',fontSize:14,fontWeight:600,cursor:'pointer'}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {outlook&&(
        <div onClick={e=>e.target===e.currentTarget&&setOutlook(false)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:16}}>
          <div style={{background:'#fff',borderRadius:14,width:'100%',maxWidth:480,boxShadow:'0 12px 40px rgba(0,0,0,0.2)',maxHeight:'90%',overflowY:'auto'}}>
            <div style={{padding:'15px 18px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:16,fontWeight:700,color:'#1e293b'}}>Outlook calendar sync</div>
              <button onClick={()=>setOutlook(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#94a3b8'}}>✕</button>
            </div>
            <div style={{padding:'18px'}}>
              <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:10,padding:12,marginBottom:18,fontSize:13,color:'#1e40af',lineHeight:1.7}}>
                Creates events in your personal Outlook / Hotmail marked as <strong>Busy</strong> — so Outlook's scheduling assistant blocks those slots for people trying to book you.
              </div>
              <div style={{fontSize:13,fontWeight:700,color:'#1e293b',marginBottom:14}}>One-time setup (~15 min, $0 cost)</div>
              {steps.map(([t,b],i)=>(
                <div key={i} style={{display:'flex',gap:12,marginBottom:14}}>
                  <div style={{width:24,height:24,borderRadius:'50%',background:'#6366f1',color:'#fff',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'#1e293b',marginBottom:2}}>{t}</div>
                    <div style={{fontSize:13,color:'#64748b',lineHeight:1.6}}>{b}</div>
                  </div>
                </div>
              ))}
              <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'10px 12px',fontSize:13,color:'#166534',lineHeight:1.6}}>
                📱 <strong>Mobile:</strong> Open your Vercel URL on your phone → tap Share → Add to Home Screen. Works offline like a native app.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}