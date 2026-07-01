import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const todayS=()=>new Date().toISOString().slice(0,10);
const thisMonthS=()=>new Date().toISOString().slice(0,7);
const getMondayS=()=>{const d=new Date(),day=d.getDay(),diff=d.getDate()-day+(day===0?-6:1);return new Date(d.setDate(diff)).toISOString().slice(0,10);};
const fmtMonth=iso=>iso?new Date(iso+'-01').toLocaleDateString('en-US',{month:'long',year:'numeric'}):'';
const fmtWeek=iso=>{if(!iso)return'';const mon=new Date(iso),sun=new Date(mon);sun.setDate(mon.getDate()+6);const f=d=>d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});return f(mon)+' – '+f(sun);};
const fmtDate=iso=>iso?new Date(iso+'T00:00').toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short'}):'';
const fmtDateFull=iso=>iso?new Date(iso+'T00:00').toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}):'';

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

const PRIORITY_CLR={high:'#ef4444',medium:'#f59e0b',low:'#10b981'};
const PRIORITY_BG={high:'rgba(239,68,68,0.1)',medium:'rgba(245,158,11,0.1)',low:'rgba(16,185,129,0.1)'};
const STATUS_CLR={'not_started':'#94a3b8','in_progress':'#0ea5e9','completed':'#10b981','deferred':'#f59e0b'};
const STATUS_LABEL={'not_started':'Not started','in_progress':'In progress','completed':'Completed','deferred':'Deferred'};

// ── Auth Screen
function AuthScreen({onAuth}){
  const [mode,setMode]=useState('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [name,setName]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  const handle=async()=>{
    if(!email||!password){setError('Please enter email and password');return;}
    setLoading(true);setError('');
    const fn=mode==='login'?supabase.auth.signInWithPassword:supabase.auth.signUp;
    const opts=mode==='signup'?{email,password,options:{data:{full_name:name}}}:{email,password};
    const {data,error:e}=await fn.call(supabase.auth,opts);
    setLoading(false);
    if(e){setError(e.message);return;}
    if(mode==='signup'&&!data.session){setError('Account created! Please log in.');setMode('login');return;}
    onAuth(data.session?.user||data.user);
  };

  const inp={width:'100%',border:'1px solid #d1d5db',borderRadius:8,padding:'10px 12px',fontSize:14,outline:'none',boxSizing:'border-box',color:'#1e293b',background:'#fff',fontFamily:'inherit',marginBottom:12};

  return(
    <div style={{minHeight:'100vh',background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:16,padding:32,width:'100%',maxWidth:380,boxShadow:'0 4px 24px rgba(0,0,0,0.08)'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:36,marginBottom:8}}>🎯</div>
          <div style={{fontSize:24,fontWeight:700,color:'#0f172a',letterSpacing:'-0.5px'}}>GoalFlow</div>
          <div style={{fontSize:13,color:'#64748b',marginTop:4}}>Your personal goal cascade</div>
        </div>
        <div style={{display:'flex',background:'#f1f5f9',borderRadius:8,padding:3,marginBottom:20}}>
          {['login','signup'].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError('');}} style={{flex:1,padding:'8px',border:'none',borderRadius:6,background:mode===m?'#fff':'transparent',color:mode===m?'#1e293b':'#64748b',fontSize:13,fontWeight:mode===m?600:400,cursor:'pointer',boxShadow:mode===m?'0 1px 3px rgba(0,0,0,0.1)':'none'}}>
              {m==='login'?'Log in':'Sign up'}
            </button>
          ))}
        </div>
        {mode==='signup'&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" type="text" style={inp}/>}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" style={inp}/>
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (min 6 characters)" type="password" style={{...inp,marginBottom:error?8:16}} onKeyDown={e=>e.key==='Enter'&&handle()}/>
        {error&&<div style={{fontSize:12,color:error.includes('created')?'#16a34a':'#ef4444',marginBottom:12,lineHeight:1.5}}>{error}</div>}
        <button onClick={handle} disabled={loading} style={{width:'100%',background:'#6366f1',color:'#fff',border:'none',borderRadius:8,padding:'11px',fontSize:14,fontWeight:600,cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1}}>
          {loading?'Please wait…':mode==='login'?'Log in':'Create account'}
        </button>
      </div>
    </div>
  );
}

// ── Main App
export default function App(){
  const [user,setUser]=useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [db,setDb]=useState(EMPTY());
  const [loading,setLoading]=useState(false);
  const [view,setView]=useState('activity');
  const [planLevel,setPlanLevel]=useState('longTerm');
  const [planOpen,setPlanOpen]=useState(false);
  const [calMode,setCalMode]=useState('month');
  const [calDate,setCalDate]=useState(new Date());
  const [expanded,setExpanded]=useState({});
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const [dlg,setDlg]=useState(null);
  const [outlook,setOutlook]=useState(false);
  const [navOpen,setNavOpen]=useState(false);
  const [w,setW]=useState(window.innerWidth);

  useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h);},[]);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user||null);setAuthLoading(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>setUser(session?.user||null));
    return()=>subscription.unsubscribe();
  },[]);

  useEffect(()=>{if(user)loadAll();},[user]);

  const loadAll=async()=>{
    setLoading(true);
    const {data,error}=await supabase.from('items').select('*').eq('user_id',user.id);
    if(error){console.error(error);setLoading(false);return;}
    const grouped=EMPTY();
    (data||[]).forEach(row=>{
      const lvl=row.level;
      if(!grouped[lvl])return;
      grouped[lvl].push({
        id:row.id,title:row.title,notes:row.notes||'',
        done:row.done,parentId:row.parent_id||'',
        period:row.period||'',weekStart:row.week_start||'',
        date:row.date||'',tStart:row.t_start||'',tEnd:row.t_end||'',
        priority:row.priority||'medium',urgency:row.urgency||'normal',
        dueDate:row.due_date||'',status:row.status||'not_started',
        at:new Date(row.created_at).getTime()
      });
    });
    Object.keys(grouped).forEach(k=>grouped[k].sort((a,b)=>a.at-b.at));
    setDb(grouped);setLoading(false);
  };

  const toRow=(lvl,item)=>({
    user_id:user.id,level:lvl,
    title:item.title,notes:item.notes||null,
    done:item.done||false,parent_id:item.parentId||null,
    period:item.period||null,week_start:item.weekStart||null,
    date:item.date||null,t_start:item.tStart||null,t_end:item.tEnd||null,
    priority:item.priority||'medium',urgency:item.urgency||'normal',
    due_date:item.dueDate||null,status:item.status||'not_started',
  });

  const addI=async(lvl,item)=>{
    const row=toRow(lvl,{...item,done:false});
    const {data,error}=await supabase.from('items').insert(row).select().single();
    if(error){console.error(error);return;}
    const newItem={...item,id:data.id,done:false,at:new Date(data.created_at).getTime()};
    setDb(d=>({...d,[lvl]:[...d[lvl],newItem]}));
  };

  const updI=async(lvl,id,patch)=>{
    const dbPatch={};
    if(patch.title!==undefined)dbPatch.title=patch.title;
    if(patch.notes!==undefined)dbPatch.notes=patch.notes;
    if(patch.done!==undefined)dbPatch.done=patch.done;
    if(patch.parentId!==undefined)dbPatch.parent_id=patch.parentId||null;
    if(patch.period!==undefined)dbPatch.period=patch.period||null;
    if(patch.weekStart!==undefined)dbPatch.week_start=patch.weekStart||null;
    if(patch.date!==undefined)dbPatch.date=patch.date||null;
    if(patch.tStart!==undefined)dbPatch.t_start=patch.tStart||null;
    if(patch.tEnd!==undefined)dbPatch.t_end=patch.tEnd||null;
    if(patch.priority!==undefined)dbPatch.priority=patch.priority;
    if(patch.urgency!==undefined)dbPatch.urgency=patch.urgency;
    if(patch.dueDate!==undefined)dbPatch.due_date=patch.dueDate||null;
    if(patch.status!==undefined)dbPatch.status=patch.status;
    await supabase.from('items').update(dbPatch).eq('id',id);
    setDb(d=>({...d,[lvl]:d[lvl].map(i=>i.id===id?{...i,...patch}:i)}));
  };

  const delI=async(lvl,id)=>{
    await supabase.from('items').delete().eq('id',id);
    setDb(d=>({...d,[lvl]:d[lvl].filter(i=>i.id!==id)}));
  };

  const completeTask=(id)=>{
    updI('daily',id,{status:'completed',done:true});
  };

  const mkForm=(lvl,pid='')=>{
    const b={title:'',notes:'',parentId:pid,priority:'medium',urgency:'normal',status:'not_started',dueDate:''};
    if(lvl==='monthly')return{...b,period:thisMonthS()};
    if(lvl==='weekly')return{...b,weekStart:getMondayS()};
    if(lvl==='daily')return{...b,date:todayS(),tStart:'09:00',tEnd:'10:00'};
    return b;
  };
  const openAdd=(lvl,pid='')=>{setForm(mkForm(lvl,pid));setModal({mode:'add',lvl});};
  const openEdit=(lvl,item)=>{setForm({...item});setModal({mode:'edit',lvl,id:item.id});};
  const saveMdl=()=>{
    if(!form.title?.trim())return;
    if(modal.mode==='add')addI(modal.lvl,form);
    else updI(modal.lvl,modal.id,form);
    setModal(null);
  };

  const mob=w<640;
  const today=todayS();
  const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
  const tomorrowS=tomorrow.toISOString().slice(0,10);
  const nextWeek=new Date();nextWeek.setDate(nextWeek.getDate()+7);
  const nextWeekS=nextWeek.toISOString().slice(0,10);

  const dailyTasks=db.daily||[];
  const activeTasks=dailyTasks.filter(t=>t.status!=='completed');
  const overdue=activeTasks.filter(t=>t.date&&t.date<today).sort((a,b)=>a.date.localeCompare(b.date)||(a.tStart||'').localeCompare(b.tStart||''));
  
  // Group remaining tasks by date
  const byDate={};
  activeTasks.filter(t=>!t.date||t.date>=today).forEach(t=>{
    const d=t.date||'no-date';
    if(!byDate[d])byDate[d]=[];
    byDate[d].push(t);
  });
  Object.keys(byDate).forEach(d=>byDate[d].sort((a,b)=>(a.tStart||'').localeCompare(b.tStart||'')));
  const dateGroups=Object.keys(byDate).sort();

  const parentName=item=>{
    if(!item.parentId)return null;
    const pid=PARENT_OF['daily'];
    return pid?(db[pid]||[]).find(p=>p.id===item.parentId)?.title||null:null;
  };

  const doneCount=lvl=>(db[lvl]||[]).filter(i=>i.done).length;
  const childId=CHILD_OF[planLevel];
  const planItems=db[planLevel]||[];
  const childrenOf=pid=>childId?(db[childId]||[]).filter(i=>i.parentId===pid):[];
  const planParentName=item=>{const pid=PARENT_OF[planLevel];return pid&&item.parentId?(db[pid]||[]).find(p=>p.id===item.parentId)?.title||null:null;};
  const periodLbl=(item,lvl)=>{if(lvl==='monthly')return fmtMonth(item.period);if(lvl==='weekly')return fmtWeek(item.weekStart);if(lvl==='daily')return fmtDate(item.date);return null;};

  const signOut=async()=>{await supabase.auth.signOut();setDb(EMPTY());setUser(null);};

  // ── Task Card for Activity List
  const ActivityCard=({item})=>{
    const pn=parentName(item);
    const isOverdue=item.date&&item.date<today;
    return(
      <div style={{background:'#fff',border:`1px solid ${isOverdue?'#fecaca':'#e2e8f0'}`,borderRadius:12,marginBottom:8,padding:'12px 14px',display:'flex',gap:10,alignItems:'flex-start'}}>
        <div onClick={()=>completeTask(item.id)} style={{width:22,height:22,borderRadius:6,border:`2px solid ${item.status==='completed'?'#10b981':'#d1d5db'}`,background:item.status==='completed'?'#10b981':'transparent',cursor:'pointer',flexShrink:0,marginTop:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
          {item.status==='completed'&&<span style={{color:'#fff',fontSize:13,lineHeight:1}}>✓</span>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:500,color:item.status==='completed'?'#94a3b8':'#1e293b',textDecoration:item.status==='completed'?'line-through':'none',wordBreak:'break-word',lineHeight:1.4}}>{item.title}</div>
          {pn&&<div style={{fontSize:12,color:'#64748b',marginTop:2}}>↑ {pn}</div>}
          <div style={{display:'flex',gap:5,marginTop:6,flexWrap:'wrap',alignItems:'center'}}>
            {item.tStart&&<span style={{fontSize:11,background:'rgba(245,158,11,0.1)',color:'#b45309',borderRadius:5,padding:'2px 7px',fontWeight:600}}>⏰ {item.tStart}–{item.tEnd}</span>}
            {item.dueDate&&<span style={{fontSize:11,background:item.dueDate<today?'rgba(239,68,68,0.1)':'#f8fafc',color:item.dueDate<today?'#ef4444':'#64748b',borderRadius:5,padding:'2px 7px',border:'1px solid',borderColor:item.dueDate<today?'#fecaca':'#e2e8f0',fontWeight:600}}>Due {fmtDate(item.dueDate)}</span>}
            <span style={{fontSize:11,background:PRIORITY_BG[item.priority]||PRIORITY_BG.medium,color:PRIORITY_CLR[item.priority]||PRIORITY_CLR.medium,borderRadius:5,padding:'2px 7px',fontWeight:600,textTransform:'capitalize'}}>{item.priority||'medium'}</span>
            {item.urgency==='urgent'&&<span style={{fontSize:11,background:'rgba(239,68,68,0.1)',color:'#ef4444',borderRadius:5,padding:'2px 7px',fontWeight:600}}>🔥 Urgent</span>}
            <span style={{fontSize:11,background:'#f8fafc',color:STATUS_CLR[item.status]||'#94a3b8',borderRadius:5,padding:'2px 7px',border:'1px solid #e2e8f0',fontWeight:500}}>{STATUS_LABEL[item.status]||'Not started'}</span>
          </div>
        </div>
        <div style={{display:'flex',gap:0,flexShrink:0,marginTop:-2}}>
          {iBtn('✏️','Edit',undefined,()=>openEdit('daily',item))}
          {iBtn('🗑','Delete','#ef4444',()=>setDlg({lvl:'daily',id:item.id,title:item.title}))}
        </div>
      </div>
    );
  };

  // ── Date group header
  const DateHeader=({dateStr})=>{
    const isToday=dateStr===today;
    const isTomorrow=dateStr===tomorrowS;
    const label=isToday?'Today':isTomorrow?'Tomorrow':dateStr==='no-date'?'No date set':fmtDateFull(dateStr);
    return(
      <div style={{display:'flex',alignItems:'center',gap:8,margin:'16px 0 8px'}}>
        <div style={{fontSize:12,fontWeight:700,color:isToday?'#6366f1':'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</div>
        <div style={{flex:1,height:'1px',background:'#e2e8f0'}}/>
      </div>
    );
  };

  // ── Calendar helpers
  const getDaysInMonth=(year,month)=>new Date(year,month+1,0).getDate();
  const getFirstDay=(year,month)=>new Date(year,month,1).getDay();
  const taskDates=new Set(dailyTasks.map(t=>t.date).filter(Boolean));
  
  const calYear=calDate.getFullYear();
  const calMonth=calDate.getMonth();
  const calDay=calDate.getDate();

  const navCal=(dir)=>{
    const d=new Date(calDate);
    if(calMode==='year')d.setFullYear(calYear+dir);
    else if(calMode==='month')d.setMonth(calMonth+dir);
    else d.setDate(calDay+dir);
    setCalDate(d);
  };

  const calTitle=()=>{
    if(calMode==='year')return calYear.toString();
    if(calMode==='month')return calDate.toLocaleDateString('en-US',{month:'long',year:'numeric'});
    return fmtDateFull(calDate.toISOString().slice(0,10));
  };

  const iBtn=(icon,title,clr,onClick)=>(
    <button title={title} onClick={onClick} style={{background:'none',border:'none',cursor:'pointer',padding:'4px 5px',borderRadius:6,color:clr||'#9ca3af',display:'flex',alignItems:'center',fontSize:15}}>
      {icon}
    </button>
  );

  // ── Plan Card
  const PlanCard=({item,lvl})=>{
    const lc=L(lvl),isEx=expanded[item.id],kids=childrenOf(item.id),cL=L(childId);
    const pn=planParentName(item),pd=periodLbl(item,lvl);
    const tog=(l,id)=>updI(l,id,{done:!(db[l]||[]).find(i=>i.id===id)?.done});
    return(
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,marginBottom:10,opacity:item.done?0.55:1}}>
        <div style={{display:'flex',alignItems:'flex-start',padding:'13px 14px',gap:10}}>
          <div onClick={()=>tog(lvl,item.id)} style={{width:20,height:20,borderRadius:6,border:`2px solid ${item.done?lc.clr:'#d1d5db'}`,background:item.done?lc.clr:'transparent',cursor:'pointer',flexShrink:0,marginTop:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {item.done&&<span style={{color:'#fff',fontSize:12,lineHeight:1}}>✓</span>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:500,color:item.done?'#94a3b8':'#1e293b',textDecoration:item.done?'line-through':'none',wordBreak:'break-word',lineHeight:1.4}}>{item.title}</div>
            {item.notes&&<div style={{fontSize:13,color:'#64748b',marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.notes}</div>}
            <div style={{display:'flex',gap:5,marginTop:7,flexWrap:'wrap'}}>
              {pd&&<span style={{fontSize:11,background:lc.tint,color:lc.clr,borderRadius:5,padding:'2px 8px',fontWeight:600}}>{pd}</span>}
              {pn&&<span style={{fontSize:11,background:'#f8fafc',color:'#64748b',borderRadius:5,padding:'2px 8px',border:'1px solid #e2e8f0'}}>↑ {pn}</span>}
            </div>
          </div>
          <div style={{display:'flex',gap:0,flexShrink:0,marginTop:-2}}>
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
                <div onClick={()=>tog(childId,kid.id)} style={{width:16,height:16,borderRadius:4,border:`2px solid ${kid.done?cL.clr:'#d1d5db'}`,background:kid.done?cL.clr:'transparent',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {kid.done&&<span style={{color:'#fff',fontSize:9,lineHeight:1}}>✓</span>}
                </div>
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

  const NavItem=({id,icon,label,active,onClick})=>(
    <div onClick={onClick} style={{display:'flex',alignItems:'center',padding:'10px 18px',cursor:'pointer',background:active?'rgba(255,255,255,0.08)':'transparent',borderLeft:`3px solid ${active?'#6366f1':'transparent'}`}}>
      <span style={{fontSize:16,marginRight:10}}>{icon}</span>
      <span style={{fontSize:13,fontWeight:active?600:400,color:active?'#fff':'rgba(255,255,255,0.5)'}}>{label}</span>
    </div>
  );

  const sidebar=(
    <div style={{width:240,background:'#16213e',display:'flex',flexDirection:'column',height:'100%',overflowY:'auto',flexShrink:0}}>
      <div style={{padding:'18px 18px 14px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div style={{fontSize:18,fontWeight:700,color:'#fff',letterSpacing:'-0.3px'}}>🎯 GoalFlow</div>
        <div style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.7)',marginTop:4}}>{user?.user_metadata?.full_name||user?.email}</div>
        <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginTop:1}}>{user?.email}</div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
        <NavItem id="activity" icon="📋" label="Activity list" active={view==='activity'} onClick={()=>{setView('activity');setNavOpen(false);}}/>
        <NavItem id="calendar" icon="📅" label="Calendar" active={view==='calendar'} onClick={()=>{setView('calendar');setNavOpen(false);}}/>
        <div>
          <div onClick={()=>{setPlanOpen(p=>!p);if(!planOpen){setView('plan');setNavOpen(false);}}} style={{display:'flex',alignItems:'center',padding:'10px 18px',cursor:'pointer',background:view==='plan'?'rgba(255,255,255,0.08)':'transparent',borderLeft:`3px solid ${view==='plan'?'#6366f1':'transparent'}`}}>
            <span style={{fontSize:16,marginRight:10}}>🎯</span>
            <span style={{fontSize:13,fontWeight:view==='plan'?600:400,color:view==='plan'?'#fff':'rgba(255,255,255,0.5)',flex:1}}>Plan</span>
            <span style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>{planOpen?'▲':'▼'}</span>
          </div>
          {(planOpen||view==='plan')&&LEVELS.map(l=>{
            const tot=db[l.id]?.length||0,dn=doneCount(l.id),isA=view==='plan'&&planLevel===l.id;
            return(
              <div key={l.id} onClick={()=>{setView('plan');setPlanLevel(l.id);setNavOpen(false);}} style={{display:'flex',alignItems:'center',padding:'8px 18px 8px 36px',cursor:'pointer',background:isA?`${l.clr}22`:'transparent',borderLeft:`3px solid ${isA?l.clr:'transparent'}`}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:l.clr,marginRight:8,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:isA?600:400,color:isA?'#fff':'rgba(255,255,255,0.4)'}}>{l.label}</div>
                </div>
                {tot>0&&<span style={{fontSize:10,color:dn===tot?l.clr:'rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.07)',borderRadius:10,padding:'1px 6px'}}>{dn}/{tot}</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{padding:'10px 18px',borderTop:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <button onClick={()=>setOutlook(true)} style={{background:'none',border:'none',cursor:'pointer',color:'#0ea5e9',fontSize:11,padding:0}}>📧 Outlook</button>
        <button onClick={signOut} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',fontSize:11,padding:0}}>Sign out</button>
      </div>
    </div>
  );

  // ── Activity List View
  const ActivityView=()=>(
    <div style={{flex:1,display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',minWidth:0}}>
      <div style={{padding:'13px 20px',background:'#fff',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        {mob&&<button onClick={()=>setNavOpen(true)} style={{background:'none',border:'none',cursor:'pointer',padding:4,color:'#64748b',fontSize:20}}>☰</button>}
        <div style={{flex:1}}>
          <div style={{fontSize:mob?16:20,fontWeight:700,color:'#0f172a'}}>Activity list</div>
          <div style={{fontSize:11,color:'#6366f1',fontWeight:600,marginTop:1}}>{activeTasks.length} open tasks</div>
        </div>
        <button onClick={()=>openAdd('daily')} style={{background:'#f59e0b',color:'#fff',border:'none',borderRadius:8,padding:mob?'7px 14px':'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Add task</button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'14px 20px'}}>
        {loading&&<div style={{fontSize:13,color:'#64748b',padding:'20px 0'}}>Loading…</div>}
        {!loading&&activeTasks.length===0&&(
          <div style={{textAlign:'center',padding:'60px 20px'}}>
            <div style={{fontSize:48,marginBottom:12}}>✅</div>
            <div style={{fontSize:17,fontWeight:600,color:'#64748b',marginBottom:6}}>All clear!</div>
            <div style={{fontSize:13,color:'#94a3b8',marginBottom:22}}>No open tasks. Add one to get started.</div>
            <button onClick={()=>openAdd('daily')} style={{background:'#f59e0b',color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',fontSize:14,fontWeight:600,cursor:'pointer'}}>+ Add task</button>
          </div>
        )}
        {!loading&&overdue.length>0&&(
          <>
            <div style={{display:'flex',alignItems:'center',gap:8,margin:'0 0 8px'}}>
              <div style={{fontSize:12,fontWeight:700,color:'#ef4444',textTransform:'uppercase',letterSpacing:'0.5px'}}>🔴 Overdue</div>
              <div style={{flex:1,height:'1px',background:'#fecaca'}}/>
            </div>
            {overdue.map(t=><ActivityCard key={t.id} item={t}/>)}
          </>
        )}
        {!loading&&dateGroups.map(d=>(
          <div key={d}>
            <DateHeader dateStr={d}/>
            {byDate[d].map(t=><ActivityCard key={t.id} item={t}/>)}
          </div>
        ))}
      </div>
    </div>
  );

  // ── Calendar View
  const CalendarView=()=>{
    const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const YearView=()=>(
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,padding:'16px 20px'}}>
        {Array.from({length:12},(_,mi)=>{
          const daysInM=getDaysInMonth(calYear,mi);
          const firstDay=getFirstDay(calYear,mi);
          const cells=[];
          for(let i=0;i<firstDay;i++)cells.push(null);
          for(let d=1;d<=daysInM;d++)cells.push(d);
          const hasTasks=d=>{const iso=`${calYear}-${String(mi+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;return taskDates.has(iso);};
          return(
            <div key={mi} onClick={()=>{setCalDate(new Date(calYear,mi,1));setCalMode('month');}} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,padding:10,cursor:'pointer'}}>
              <div style={{fontSize:12,fontWeight:700,color:'#1e293b',marginBottom:6}}>{months[mi]}</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1}}>
                {cells.map((d,i)=>(
                  <div key={i} style={{width:'100%',aspectRatio:'1',display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:d?'#64748b':'transparent',position:'relative'}}>
                    {d||''}
                    {d&&hasTasks(d)&&<div style={{position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',width:3,height:3,borderRadius:'50%',background:'#6366f1'}}/>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );

    const MonthView=()=>{
      const daysInM=getDaysInMonth(calYear,calMonth);
      const firstDay=getFirstDay(calYear,calMonth);
      const cells=[];
      for(let i=0;i<firstDay;i++)cells.push(null);
      for(let d=1;d<=daysInM;d++)cells.push(d);
      return(
        <div style={{padding:'16px 20px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:4}}>
            {days.map(d=><div key={d} style={{fontSize:11,fontWeight:600,color:'#94a3b8',textAlign:'center',padding:'4px 0'}}>{d}</div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
            {cells.map((d,i)=>{
              const iso=d?`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`:'';
              const isToday=iso===today;
              const hasTasks=iso&&taskDates.has(iso);
              const dayTasks=iso?(db.daily||[]).filter(t=>t.date===iso):[];
              return(
                <div key={i} onClick={()=>{if(d){setCalDate(new Date(calYear,calMonth,d));setCalMode('day');}}} style={{minHeight:64,padding:4,background:d?'#fff':'transparent',border:d?`1px solid ${isToday?'#6366f1':'#e2e8f0'}`:'none',borderRadius:8,cursor:d?'pointer':'default',position:'relative'}}>
                  {d&&<div style={{fontSize:12,fontWeight:isToday?700:400,color:isToday?'#6366f1':'#1e293b',marginBottom:2}}>{d}</div>}
                  {dayTasks.slice(0,2).map(t=>(
                    <div key={t.id} style={{fontSize:9,background:PRIORITY_BG[t.priority],color:PRIORITY_CLR[t.priority],borderRadius:3,padding:'1px 4px',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                  ))}
                  {dayTasks.length>2&&<div style={{fontSize:9,color:'#94a3b8'}}>+{dayTasks.length-2} more</div>}
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    const DayView=()=>{
      const isoDay=calDate.toISOString().slice(0,10);
      const dayTasks=(db.daily||[]).filter(t=>t.date===isoDay).sort((a,b)=>(a.tStart||'').localeCompare(b.tStart||''));
      return(
        <div style={{padding:'16px 20px'}}>
          {dayTasks.length===0&&(
            <div style={{textAlign:'center',padding:'40px 20px'}}>
              <div style={{fontSize:36,marginBottom:8}}>📭</div>
              <div style={{fontSize:15,fontWeight:600,color:'#64748b',marginBottom:6}}>No tasks this day</div>
              <button onClick={()=>{setForm({...mkForm('daily'),date:isoDay});setModal({mode:'add',lvl:'daily'});}} style={{background:'#f59e0b',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Add task</button>
            </div>
          )}
          {dayTasks.map(t=><ActivityCard key={t.id} item={t}/>)}
        </div>
      );
    };

    return(
      <div style={{flex:1,display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',minWidth:0}}>
        <div style={{padding:'13px 20px',background:'#fff',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:8,flexShrink:0,flexWrap:'wrap'}}>
          {mob&&<button onClick={()=>setNavOpen(true)} style={{background:'none',border:'none',cursor:'pointer',padding:4,color:'#64748b',fontSize:20}}>☰</button>}
          <button onClick={()=>navCal(-1)} style={{background:'#f1f5f9',border:'none',borderRadius:6,padding:'6px 10px',cursor:'pointer',fontSize:14}}>‹</button>
          <div style={{flex:1,fontSize:mob?14:18,fontWeight:700,color:'#0f172a',textAlign:'center'}}>{calTitle()}</div>
          <button onClick={()=>navCal(1)} style={{background:'#f1f5f9',border:'none',borderRadius:6,padding:'6px 10px',cursor:'pointer',fontSize:14}}>›</button>
          <div style={{display:'flex',background:'#f1f5f9',borderRadius:8,padding:3,gap:2}}>
            {['year','month','day'].map(m=>(
              <button key={m} onClick={()=>setCalMode(m)} style={{padding:'5px 10px',border:'none',borderRadius:6,background:calMode===m?'#fff':'transparent',color:calMode===m?'#1e293b':'#64748b',fontSize:12,fontWeight:calMode===m?600:400,cursor:'pointer',textTransform:'capitalize'}}>
                {m}
              </button>
            ))}
          </div>
          <button onClick={()=>{setCalDate(new Date());}} style={{background:'#6366f1',color:'#fff',border:'none',borderRadius:6,padding:'6px 10px',fontSize:12,fontWeight:600,cursor:'pointer'}}>Today</button>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {calMode==='year'&&<YearView/>}
          {calMode==='month'&&<MonthView/>}
          {calMode==='day'&&<DayView/>}
        </div>
      </div>
    );
  };

  // ── Plan View
  const PlanView=()=>{
    const aL=L(planLevel);
    return(
      <div style={{flex:1,display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',minWidth:0}}>
        <div style={{padding:'13px 20px',background:'#fff',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
          {mob&&<button onClick={()=>setNavOpen(true)} style={{background:'none',border:'none',cursor:'pointer',padding:4,color:'#64748b',fontSize:20}}>☰</button>}
          <div style={{flex:1}}>
            <div style={{fontSize:mob?16:20,fontWeight:700,color:'#0f172a'}}>{aL.label}</div>
            <div style={{fontSize:11,color:aL.clr,fontWeight:600,marginTop:1}}>{aL.sub}</div>
          </div>
          <button onClick={()=>openAdd(planLevel)} style={{background:aL.clr,color:'#fff',border:'none',borderRadius:8,padding:mob?'7px 14px':'8px 18px',fontSize:13,fontWeight:600,cursor:'pointer'}}>+ Add</button>
        </div>
        {planItems.length>0&&(()=>{const d=planItems.filter(i=>i.done).length,pct=Math.round(d/planItems.length*100);return(
          <div style={{padding:'7px 20px',background:'#fff',borderBottom:'1px solid #f1f5f9',flexShrink:0}}>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#94a3b8',marginBottom:4}}>
              <span>{d} of {planItems.length} done</span><span>{pct}%</span>
            </div>
            <div style={{background:'#f1f5f9',borderRadius:3,height:3}}>
              <div style={{background:aL.clr,width:`${pct}%`,height:3,borderRadius:3,transition:'width 0.3s'}}/>
            </div>
          </div>
        );})()}
        <div style={{flex:1,overflowY:'auto',padding:'14px 20px'}}>
          {planItems.length===0?(
            <div style={{textAlign:'center',padding:'60px 20px'}}>
              <div style={{fontSize:48,marginBottom:12}}>📋</div>
              <div style={{fontSize:17,fontWeight:600,color:'#64748b',marginBottom:6}}>Nothing here yet</div>
              <button onClick={()=>openAdd(planLevel)} style={{background:aL.clr,color:'#fff',border:'none',borderRadius:8,padding:'10px 24px',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                + Add {aL.label.replace(/s$/,'')}
              </button>
            </div>
          ):planItems.map(item=><PlanCard key={item.id} item={item} lvl={planLevel}/>)}
        </div>
      </div>
    );
  };

  if(authLoading)return(<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f8fafc'}}><div style={{fontSize:14,color:'#64748b'}}>Loading…</div></div>);
  if(!user)return <AuthScreen onAuth={u=>setUser(u)}/>;

  return(
    <div style={{position:'relative',height:'100vh',display:'flex',fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',background:'#f8fafc',overflow:'hidden'}}>

      {!mob&&sidebar}

      {mob&&navOpen&&(
        <div style={{position:'absolute',inset:0,zIndex:60,display:'flex'}}>
          <div onClick={()=>setNavOpen(false)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)'}}/>
          <div style={{position:'relative',width:240,background:'#16213e',height:'100%',display:'flex',flexDirection:'column',zIndex:1,overflowY:'auto'}}>
            <div style={{padding:'16px 18px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:16,fontWeight:700,color:'#fff'}}>🎯 GoalFlow</div>
              <button onClick={()=>setNavOpen(false)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.5)',fontSize:18}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'6px 0'}}>
              <NavItem id="activity" icon="📋" label="Activity list" active={view==='activity'} onClick={()=>{setView('activity');setNavOpen(false);}}/>
              <NavItem id="calendar" icon="📅" label="Calendar" active={view==='calendar'} onClick={()=>{setView('calendar');setNavOpen(false);}}/>
              <div onClick={()=>setPlanOpen(p=>!p)} style={{display:'flex',alignItems:'center',padding:'10px 18px',cursor:'pointer'}}>
                <span style={{fontSize:16,marginRight:10}}>🎯</span>
                <span style={{fontSize:13,color:'rgba(255,255,255,0.5)',flex:1}}>Plan</span>
                <span style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>{planOpen?'▲':'▼'}</span>
              </div>
              {planOpen&&LEVELS.map(l=>(
                <div key={l.id} onClick={()=>{setView('plan');setPlanLevel(l.id);setNavOpen(false);}} style={{display:'flex',alignItems:'center',padding:'8px 18px 8px 36px',cursor:'pointer',background:view==='plan'&&planLevel===l.id?`${l.clr}22`:'transparent'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:l.clr,marginRight:8}}/>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>{l.label}</div>
                </div>
              ))}
            </div>
            <div style={{padding:'10px 18px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
              <button onClick={signOut} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.3)',fontSize:12,padding:0}}>Sign out</button>
            </div>
          </div>
        </div>
      )}

      {view==='activity'&&<ActivityView/>}
      {view==='calendar'&&<CalendarView/>}
      {view==='plan'&&<PlanView/>}

      {modal&&(
        <div onClick={e=>e.target===e.currentTarget&&setModal(null)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50,padding:16}}>
          <div style={{background:'#fff',borderRadius:14,width:'100%',maxWidth:460,boxShadow:'0 12px 40px rgba(0,0,0,0.2)',maxHeight:'92%',overflowY:'auto'}}>
            {(()=>{
              const lc=L(modal.lvl),mPid=PARENT_OF[modal.lvl],mPL=mPid?L(mPid):null,mPI=mPid?db[mPid]||[]:[];
              const isDaily=modal.lvl==='daily';
              return(<>
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
                  {isDaily&&<>
                    {lbl('Date')}
                    <input type="date" value={form.date||todayS()} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp}/>
                    {lbl('Due date')}
                    <input type="date" value={form.dueDate||''} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} style={inp}/>
                    <div style={{display:'flex',gap:12,marginTop:12}}>
                      <div style={{flex:1}}>{lbl('Start time')}<input type="time" value={form.tStart||'09:00'} onChange={e=>setForm(f=>({...f,tStart:e.target.value}))} style={inp}/></div>
                      <div style={{flex:1}}>{lbl('End time')}<input type="time" value={form.tEnd||'10:00'} onChange={e=>setForm(f=>({...f,tEnd:e.target.value}))} style={inp}/></div>
                    </div>
                    {lbl('Priority')}
                    <div style={{display:'flex',gap:8,marginTop:4}}>
                      {['high','medium','low'].map(p=>(
                        <button key={p} onClick={()=>setForm(f=>({...f,priority:p}))} style={{flex:1,padding:'7px',border:`2px solid ${form.priority===p?PRIORITY_CLR[p]:'#e2e8f0'}`,borderRadius:7,background:form.priority===p?PRIORITY_BG[p]:'#fff',color:form.priority===p?PRIORITY_CLR[p]:'#64748b',fontSize:12,fontWeight:600,cursor:'pointer',textTransform:'capitalize'}}>{p}</button>
                      ))}
                    </div>
                    {lbl('Urgency')}
                    <div style={{display:'flex',gap:8,marginTop:4}}>
                      {['normal','urgent'].map(u=>(
                        <button key={u} onClick={()=>setForm(f=>({...f,urgency:u}))} style={{flex:1,padding:'7px',border:`2px solid ${form.urgency===u?'#ef4444':'#e2e8f0'}`,borderRadius:7,background:form.urgency===u?'rgba(239,68,68,0.1)':'#fff',color:form.urgency===u?'#ef4444':'#64748b',fontSize:12,fontWeight:600,cursor:'pointer',textTransform:'capitalize'}}>{u==='urgent'?'🔥 Urgent':'Normal'}</button>
                      ))}
                    </div>
                    {lbl('Status')}
                    <select value={form.status||'not_started'} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={{...inp,marginTop:4}}>
                      <option value="not_started">Not started</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                      <option value="deferred">Deferred</option>
                    </select>
                  </>}
                  {mPL&&mPI.length>0&&<>
                    {lbl(`Link to ${mPL.label.replace(/s$/,'')} (optional)`)}
                    <select value={form.parentId||''} onChange={e=>setForm(f=>({...f,parentId:e.target.value}))} style={{...inp,marginTop:4}}>
                      <option value="">— Not linked —</option>
                      {mPI.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </>}
                  <div style={{display:'flex',gap:8,marginTop:16}}>
                    <button onClick={()=>setModal(null)} style={{background:'#f1f5f9',color:'#64748b',border:'none',borderRadius:8,padding:'9px 16px',fontSize:14,cursor:'pointer'}}>Cancel</button>
                    <button onClick={saveMdl} style={{flex:1,background:lc.clr,color:'#fff',border:'none',borderRadius:8,padding:'9px',fontSize:14,fontWeight:600,cursor:'pointer'}}>{modal.mode==='add'?'Save':'Update'}</button>
                  </div>
                </div>
              </>);
            })()}
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
            <div style={{padding:'18px',fontSize:13,color:'#64748b',lineHeight:1.7}}>
              Full Outlook sync setup guide coming soon. For now, note your task times and block them manually in Outlook.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}