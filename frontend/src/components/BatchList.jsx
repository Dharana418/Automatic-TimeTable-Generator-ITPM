import React, { useMemo, useState } from 'react';
import batches from '../data/batches.js';

export default function BatchList({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return batches;
    return batches.filter(b => b.id.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="panel">
      <h4>Batches</h4>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <input className="search" placeholder="Search batch (e.g. Y2.S2)" value={query} onChange={e=>setQuery(e.target.value)} />
        <div style={{minWidth:120,alignSelf:'center',color:'#475569'}}>{list.length} shown</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8}}>
        {list.map(b => (
          <div key={b.id} style={{background:'#fff',padding:10,borderRadius:8,boxShadow:'0 4px 12px rgba(15,23,42,0.04)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700}}>{b.id}</div>
              <div style={{fontSize:12,color:'#64748b'}}>{b.capacity} cap</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
