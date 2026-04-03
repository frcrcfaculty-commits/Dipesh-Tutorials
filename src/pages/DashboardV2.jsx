import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getStudents, getDashboardStats, getFeeSummary, getStudentAttendance, getTests, getTestResults } from '../lib/api';
import { Users, CalendarCheck, IndianRupee, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils';

const COLORS = ['#0A2351','#B6922E','#10B981','#3B82F6','#EF4444'];

// Light navy to gold gradient banner for parent/student
function GradientBanner({ title, subtitle, accent='#B6922E' }) {
  return (
    <div style={{ marginBottom:24, padding:'20px 24px', background:'linear-gradient(135deg, #0A2351 0%, #1a3a6b 60%, #2a5a9b 100%)', borderRadius:16, color:'white', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-20, right:-20, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.05)', zIndex:0 }} />
      <div style={{ position:'relative', zIndex:1 }}>
        <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'1.5rem', marginBottom:4 }}>{title}</h2>
        <p style={{ opacity:0.85, fontSize:'0.9rem' }}>{subtitle}</p>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({ totalStudents:0, attendancePercent:0, totalCollected:0, pendingFees:0 });
  const [stdData, setStdData] = useState([]);
  const [feeData, setFeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getDashboardStats(), getStudents(), getFeeSummary()]).then(([s, students, fees]) => {
      setStats({ totalStudents:s?.totalStudents||0, attendancePercent:s?.attendancePercent||0, totalCollected:s?.totalCollected||0, pendingFees:s?.pendingFees||0 });
      const byStd={};
      (students||[]).forEach(st => { const n=st.standards?.name||'Unknown'; byStd[n]=(byStd[n]||0)+1; });
      setStdData(Object.entries(byStd).map(([name,students])=>({name,students})));
      const paid=(fees||[]).filter(f=>f.status==='paid').length;
      const pending=(fees||[]).filter(f=>f.status==='pending').length;
      const overdue=(fees||[]).filter(f=>f.status==='overdue').length;
      setFeeData([{name:'Paid',value:paid},{name:'Pending',value:pending},{name:'Overdue',value:overdue}].filter(d=>d.value>0));
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'60vh'}}><div className='loading-spinner'/></div>;

  return (
    <div style={{padding:'0 0 40px'}}>
      <GradientBanner title='Control Center' subtitle='Everything at a glance' accent='#B6922E' />
      <div className='stats-grid' style={{marginBottom:24}}>
        <div className='stat-card navy' style={{cursor:'pointer'}} onClick={()=>navigate('/students')}><div className='stat-icon navy'><Users size={24}/></div><div className='stat-info'><h4>Total Students</h4><div className='stat-value'>{stats.totalStudents}</div></div></div>
        <div className='stat-card green'><div className='stat-icon green'><CalendarCheck size={24}/></div><div className='stat-info'><h4>Attendance</h4><div className='stat-value'>{stats.attendancePercent}%</div></div></div>
        <div className='stat-card gold' style={{cursor:'pointer'}} onClick={()=>navigate('/billing')}><div className='stat-icon gold'><IndianRupee size={24}/></div><div className='stat-info'><h4>Collected</h4><div className='stat-value'>₹{(stats.totalCollected/1000).toFixed(0)}K</div></div></div>
        <div className='stat-card red'><div className='stat-icon red'><AlertCircle size={24}/></div><div className='stat-info'><h4>Pending Fees</h4><div className='stat-value'>₹{(stats.pendingFees/1000).toFixed(0)}K</div></div></div>
      </div>
      <div className='grid-2'>
        <div className='card'>
          <div className='card-header' style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h3>Students by Standard</h3>
            <button className='btn-secondary btn-small' onClick={()=>navigate('/students')}>Manage</button>
          </div>
          <div className='card-body'>
            <ResponsiveContainer width='100%' height={220}>
              <BarChart data={stdData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#E5E7EB'/>
                <XAxis dataKey='name' fontSize={11} angle={-30} textAnchor='end' height={60}/>
                <YAxis fontSize={12}/>
                <Tooltip/>
                <Bar dataKey='students' fill='#0A2351' radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className='card'>
          <div className='card-header' style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h3>Fee Collection</h3>
            <button className='btn-secondary btn-small' onClick={()=>navigate('/billing')}>Billing</button>
          </div>
          <div className='card-body'>
            {feeData.length>0 ? (
              <ResponsiveContainer width='100%' height={220}>
                <PieChart>
                  <Pie data={feeData} cx='50%' cy='50%' innerRadius={55} outerRadius={85} paddingAngle={3} dataKey='value' label={({name,value})=>`${name}: ${value}`}>
                    {feeData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            ) : <p style={{textAlign:'center',color:'var(--text-muted)',padding:40}}>No fee data yet</p>}
          </div>
        </div>
      </div>
      <div className='card' style={{marginTop:24}}>
        <div className='card-header' style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3>Quick Actions</h3>
        </div>
        <div className='card-body' style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <button className='btn-primary' onClick={()=>navigate('/walk-in')}><Users size={16} style={{marginRight:6}}/>Walk-In Lookup</button>
          <button className='btn-gold' onClick={()=>navigate('/attendance')}><CalendarCheck size={16} style={{marginRight:6}}/>Mark Attendance</button>
          <button className='btn-secondary' onClick={()=>navigate('/test-results')}><BarChart3 size={16} style={{marginRight:6}}/>Enter Marks</button>
        </div>
      </div>
    </div>
  );
}

function ParentDashboard({user}) {
  const [att, setAtt]=useState([]);
  const [testAvg, setTestAvg]=useState(null);
  const [feeBalance, setFeeBalance]=useState(null);
  const navigate=useNavigate();
  const studentId=user?.students?.[0]?.id;

  useEffect(()=>{
    if(!studentId) return;
    Promise.all([getStudentAttendance(studentId,7), getTests(), getTestResults({studentId}), getFeeSummary()]).then(([attendance,tests,results,fees])=>{
      const present=(attendance||[]).filter(a=>a.status==='present').length;
      setAtt(attendance||[]);
      const latest=(tests||[])[0];
      if(latest){const r=(results||[]).filter(r=>r.test_id===latest.id);const avg=r.length>0?Math.round(r.reduce((s,r)=>s+(r.marks_obtained/r.max_marks)*100,0)/r.length):0;setTestAvg(avg);}
      const linkedFee=(fees||[]).find(f=>f.student_id===studentId);
      setFeeBalance(linkedFee?linkedFee.balance:0);
    });
  },[studentId]);

  const present=att.filter(a=>a.status==='present').length;
  const pct=att.length>0?Math.round(present/att.length*100):0;
  const last7=att.slice(-7).map(a=>({date:(a.date||'').slice(5),status:a.status==='present'?1:a.status==='late'?0.5:0}));

  return (
    <div style={{padding:'0 0 40px'}}>
      <GradientBanner title={`Welcome, ${user.name}!`} subtitle={`${user.students?.[0]?.name} — ${user.students?.[0]?.standards?.name||''}`} accent='#10B981' />
      <div className='stats-grid' style={{marginBottom:24}}>
        <div className='stat-card navy'><div className='stat-icon navy'><CalendarCheck size={24}/></div><div className='stat-info'><h4>Attendance (7d)</h4><div className='stat-value' style={{color:pct>=75?'#10B981':pct>=50?'#F59E0B':'#EF4444'}}>{pct}%</div></div></div>
        <div className='stat-card gold'><div className='stat-icon gold'><BarChart3 size={24}/></div><div className='stat-info'><h4>Latest Test</h4><div className='stat-value'>{testAvg!==null ? testAvg+'%' : '—'}</div></div></div>
      </div>
      {feeBalance!==null&&(
        <div className='card' style={{marginBottom:24,borderLeft:'4px solid '+(feeBalance>0?'#EF4444':'#10B981')}}>
          <div className='card-header'><h3>Fee Status</h3></div>
          <div className='card-body' style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>Outstanding Balance</div>
              <div style={{fontSize:'1.8rem',fontWeight:700,color:feeBalance>0?'#EF4444':'#10B981'}}>₹{parseFloat(feeBalance||0).toLocaleString('en-IN')}</div>
            </div>
            <button className='btn-gold btn-small' onClick={()=>navigate('/billing')}><IndianRupee size={14}/>View Billing</button>
          </div>
        </div>
      )}
      {last7.length>0&&(
        <div className='card' style={{marginBottom:24}}>
          <div className='card-header'><h3>This Week</h3></div>
          <div className='card-body'>
            <ResponsiveContainer width='100%' height={180}>
              <BarChart data={last7}>
                <CartesianGrid strokeDasharray='3 3' stroke='#E5E7EB'/>
                <XAxis dataKey='date' fontSize={12}/>
                <YAxis domain={[0,1]} ticks={[0,0.5,1]} tickFormatter={v=>v===1?'P':v===0.5?'L':'A'} fontSize={12}/>
                <Tooltip formatter={v=>v===1?'Present':v===0.5?'Late':'Absent'}/>
                <Bar dataKey='status' fill='#0A2351' radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentDashboard({user}) {
  const [att,setAtt]=useState([]);
  const [testAvg,setTestAvg]=useState(null);
  const navigate=useNavigate();
  const studentId=user?.students?.[0]?.id;

  useEffect(()=>{
    if(!studentId) return;
    Promise.all([getStudentAttendance(studentId,28),getTests(),getTestResults({studentId})]).then(([attendance,tests,results])=>{
      setAtt(attendance||[]);
      const latest=(tests||[])[0];
      if(latest){const r=(results||[]).filter(r=>r.test_id===latest.id);const avg=r.length>0?Math.round(r.reduce((s,r)=>s+(r.marks_obtained/r.max_marks)*100,0)/r.length):0;setTestAvg(avg);}
    });
  },[studentId]);

  const present=att.filter(a=>a.status==='present').length;
  const pct=att.length>0?Math.round(present/att.length*100):0;

  return (
    <div style={{padding:'0 0 40px'}}>
      <GradientBanner title={`Hello, ${user.name}!`} subtitle='Student Dashboard — Keep up the great work' accent='#B6922E' />
      <div className='stats-grid' style={{marginBottom:24}}>
        <div className='stat-card navy'><div className='stat-icon navy'><CalendarCheck size={24}/></div><div className='stat-info'><h4>Attendance</h4><div className='stat-value' style={{color:pct>=75?'#10B981':'#EF4444'}}>{pct}%</div></div></div>
        <div className='stat-card gold'><div className='stat-icon gold'><BarChart3 size={24}/></div><div className='stat-info'><h4>Latest Test</h4><div className='stat-value'>{testAvg!==null ? testAvg+'%' : '—'}</div></div></div>
      </div>
      <div className='card' style={{marginBottom:24}}>
        <div className='card-header'><h3>Resources</h3></div>
        <div className='card-body' style={{textAlign:'center',padding:24}}>
          <button className='btn-primary' onClick={()=>navigate('/resources')}>Browse Study Materials</button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const {user}=useAuth();
  if(!user) return null;
  if(user.role==='parent') return <ParentDashboard user={user}/>;
  if(user.role==='student') return <StudentDashboard user={user}/>;
  return <AdminDashboard/>;
}
