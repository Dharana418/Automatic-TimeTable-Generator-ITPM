import React, { useEffect, useState } from 'react';
import schedulerApi from '../api/scheduler.js';

const types = ['halls','modules','instructors','lics'];

export default function Scheduler() {
  const [activeType, setActiveType] = useState('modules');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ fetchList(activeType); }, [activeType]);

  async function fetchList(t){
    try{
      const res = await schedulerApi.listItems(t);
      setItems(res.items || []);
    }catch(e){ console.error(e); setItems([]); }
  }

  async function handleAdd(e){
    e.preventDefault();
    try{
      await schedulerApi.addItem(activeType, form);
      setForm({});
      fetchList(activeType);
    }catch(err){ alert(err.message); }
  }

  async function handleRun(){
    setLoading(true); setResult(null);
    try{
      const res = await schedulerApi.runScheduler(['pso','ant','genetic','hybrid'], { iterations: 80 });
      setResult(res.results);
    }catch(err){ alert(err.message); }
    setLoading(false);
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header"><h1>Scheduler</h1></div>

      <div style={{display:'flex',gap:20}}>
        <div style={{width:320}}>
          <div style={{marginBottom:8}}>
            {types.map(t=> (
              <button key={t} onClick={()=>setActiveType(t)} className="dashboard-btn" style={{marginRight:6}}>{t}</button>
            ))}
          </div>

          <form onSubmit={handleAdd} style={{display:'flex',flexDirection:'column',gap:8}}>
            <label>JSON payload (simple):</label>
            <textarea rows={6} value={JSON.stringify(form,null,2)} onChange={e=>{ try{ setForm(JSON.parse(e.target.value)); }catch{ setForm({}); } }} />
            <button className="dashboard-btn" type="submit">Add {activeType.slice(0,-1)}</button>
          </form>

          <h3>Existing {activeType}</h3>
          <div style={{maxHeight:300,overflow:'auto',background:'#fff',padding:8}}>
            {items.map(it=> (<div key={it.id||it.name||Math.random()} style={{borderBottom:'1px solid #eee',padding:6}}>{it.name||it.code||it.id}</div>))}
          </div>
        </div>

        <div style={{flex:1}}>
          <div style={{marginBottom:12}}>
            <button className="dashboard-btn" onClick={handleRun} disabled={loading}>{loading? 'Running...':'Run Scheduler (all)'}</button>
          </div>

          <div>
            {result && Object.keys(result).map(k=> (
              <div key={k} style={{marginBottom:12,background:'#fff',padding:8}}>
                <h4>{k.toUpperCase()}</h4>
                <div>Coverage: {result[k].stats?.coverage?.toFixed?.(2) || '-' } ({result[k].stats?.scheduled}/{result[k].stats?.totalRequired})</div>
                <div>Conflicts: {result[k].conflicts?.length || 0}</div>
                <details>
                  <summary>Schedule preview ({result[k].schedule?.length || 0})</summary>
                  <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(result[k].schedule?.slice(0,100),null,2)}</pre>
                </details>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
