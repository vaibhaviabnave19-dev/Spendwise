import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Landmark, TrendingUp, Sparkles, Trash2, Calendar, PlusCircle, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

// Simple markdown-to-HTML parser for AI roommate responses
const renderMarkdown = (text) => {
  if (!text) return '';
  
  // Split lines
  const lines = text.split('\n');
  return lines.map((line, index) => {
    let trimmed = line.trim();
    
    // Headings
    if (trimmed.startsWith('### ')) {
      return <h4 key={index} style={{ color: 'var(--text-primary)', marginTop: '16px', marginBottom: '8px', fontWeight: '700' }}>{trimmed.replace('### ', '')}</h4>;
    }
    if (trimmed.startsWith('## ')) {
      return <h3 key={index} style={{ color: 'var(--accent-purple)', marginTop: '20px', marginBottom: '10px', fontWeight: '800' }}>{trimmed.replace('## ', '')}</h3>;
    }
    if (trimmed.startsWith('# ')) {
      return <h2 key={index} style={{ color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px', fontWeight: '800' }}>{trimmed.replace('# ', '')}</h2>;
    }
    
    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      return (
        <li key={index} style={{ marginLeft: '20px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
          {parseBoldText(content)}
        </li>
      );
    }
    
    // Bold parsing
    if (trimmed === '') {
      return <div key={index} style={{ height: '8px' }} />;
    }
    
    return <p key={index} style={{ marginBottom: '10px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{parseBoldText(line)}</p>;
  });
};

const parseBoldText = (text) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{part}</strong>;
    }
    // Inline code or highlighted variables
    const subParts = part.split(/`(.*?)`/g);
    return subParts.map((subPart, j) => {
      if (j % 2 === 1) {
        return <code key={j} style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-purple)', fontSize: '13px' }}>{subPart}</code>;
      }
      return subPart;
    });
  });
};

function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    total_spending: 0,
    monthly_spending: 0,
    category_breakdown: {},
    daily_breakdown: []
  });
  const [expenses, setExpenses] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      setError('');
      
      // Fetch summary
      const summaryRes = await fetch(`${API_BASE_URL}/expense/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const summaryData = await summaryRes.json();
      
      // Fetch expenses
      const expensesRes = await fetch(`${API_BASE_URL}/expense/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const expensesData = await expensesRes.json();

      // Fetch latest insight
      const insightsRes = await fetch(`${API_BASE_URL}/ai/insights`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const insightsData = await insightsRes.json();

      if (summaryRes.ok && expensesRes.ok) {
        setSummary(summaryData);
        setExpenses(expensesData);
        if (insightsRes.ok && insightsData.length > 0) {
          setInsight(insightsData[0]);
        }
      } else {
        throw new Error(summaryData.error || expensesData.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Could not sync with local database server. Is backend running?');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense? Your roommate might notice!')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/expense/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        // Refresh
        fetchDashboardData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete expense');
      }
    } catch (err) {
      alert('Network error. Failed to delete.');
    }
  };

  const handleTriggerAnalysis = async () => {
    setInsightLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok) {
        setInsight({
          insight_text: data.analysis,
          created_at: data.created_at
        });
      } else {
        alert(data.error || 'Failed to analyze spending');
      }
    } catch (err) {
      alert('Connection error while generating AI advice.');
    } finally {
      setInsightLoading(false);
    }
  };

  // Helper to categorize badge styles
  const getCategoryClass = (category) => {
    const cat = category.toLowerCase();
    if (['food', 'canteen', 'mess'].includes(cat)) return 'badge-food';
    if (['travel', 'auto', 'uber', 'bus', 'train'].includes(cat)) return 'badge-travel';
    if (['shopping', 'clothes', 'amazon', 'flipkart'].includes(cat)) return 'badge-shopping';
    if (['academics', 'books', 'printout', 'course'].includes(cat)) return 'badge-academics';
    if (['rent', 'hostel', 'pg'].includes(cat)) return 'badge-rent';
    return 'badge-other';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column', gap: '15px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-purple)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading SpendWise database...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Calculate highest spent day to scale SVG chart
  const maxDailyAmount = summary.daily_breakdown.length > 0
    ? Math.max(...summary.daily_breakdown.map(d => d.amount))
    : 100;

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Hostel Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Track your money and see what your roommate thinks.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/add-expense')}>
          <PlusCircle size={18} />
          <span>Add Expense</span>
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--accent-rose-glow)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '16px', borderRadius: 'var(--border-radius-md)', marginBottom: '24px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="dashboard-grid">
        <div className="col-4 glass-card stat-card">
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>Total Spending</p>
            <h3 style={{ fontSize: '26px', fontWeight: '800', marginTop: '6px' }}>₹{summary.total_spending.toLocaleString('en-IN')}</h3>
          </div>
          <div className="stat-icon purple"><Wallet size={24} /></div>
        </div>

        <div className="col-4 glass-card stat-card">
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>This Month</p>
            <h3 style={{ fontSize: '26px', fontWeight: '800', marginTop: '6px' }}>₹{summary.monthly_spending.toLocaleString('en-IN')}</h3>
          </div>
          <div className="stat-icon green"><Landmark size={24} /></div>
        </div>

        <div className="col-4 glass-card stat-card">
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>Hostel Grade</p>
            <h3 style={{ fontSize: '26px', fontWeight: '800', marginTop: '6px', color: summary.total_spending > 4000 ? 'var(--accent-rose)' : summary.total_spending > 2000 ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>
              {summary.total_spending > 4000 ? 'F (Broke)' : summary.total_spending > 2000 ? 'C (Surviving)' : 'A (Legend)'}
            </h3>
          </div>
          <div className="stat-icon rose"><TrendingUp size={24} /></div>
        </div>
      </div>

      {/* Main Panel and Side Panel */}
      <div className="dashboard-grid">
        {/* Left: SVG Chart + Expenses */}
        <div className="col-8" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Chart Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Spending Trend (Last 30 Days)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>Interactive view of daily hostel expenditures</p>

            {summary.daily_breakdown.length === 0 ? (
              <div style={{ height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '8px' }}>
                <AlertCircle size={32} />
                <span>No expense data logged for this period.</span>
              </div>
            ) : (
              <div className="chart-container">
                {summary.daily_breakdown.map((day, idx) => {
                  const heightPercent = maxDailyAmount > 0 ? (day.amount / maxDailyAmount) * 80 : 0; // max height 80%
                  // Extract day name / date
                  const dateObj = new Date(day.date);
                  const label = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                  
                  return (
                    <div key={idx} className="chart-bar-wrapper">
                      <div className="chart-bar-tooltip">
                        ₹{day.amount.toFixed(0)} ({label})
                      </div>
                      <div 
                        className={`chart-bar ${idx === summary.daily_breakdown.length - 1 ? 'active' : ''}`}
                        style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      />
                      <div className="chart-label">{dateObj.getDate()}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Expenses */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Recent Expenditures</h3>
            {expenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <p>No expenses found. Put your first expense down!</p>
              </div>
            ) : (
              <div className="expense-list">
                {expenses.map((expense) => (
                  <div key={expense.id} className="expense-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div className={`badge ${getCategoryClass(expense.category)}`}>
                        {expense.category}
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '15px' }}>{expense.note || 'Miscellaneous Item'}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                          <Calendar size={12} />
                          {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: '700', fontSize: '16px' }}>₹{expense.amount.toLocaleString('en-IN')}</span>
                      <button 
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="delete-btn"
                        title="Delete expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Insights and Categories */}
        <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* AI Roommate Advisor */}
          <div className="glass-card" style={{ borderLeft: '3px solid var(--accent-purple)', background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, rgba(30, 41, 59, 0.6) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Sparkles size={20} style={{ color: 'var(--accent-purple)' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Roommate AI Advisor</h3>
            </div>

            {insightLoading ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-purple)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ fontSize: '13px' }}>Roommate is looking at your receipts...</p>
              </div>
            ) : insight ? (
              <div>
                <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px', fontSize: '14px' }}>
                  {renderMarkdown(insight.insight_text)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--card-border)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Audited: {new Date(insight.created_at).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button onClick={handleTriggerAnalysis} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    Re-audit
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                  You haven't gotten a financial audit from your roommate yet.
                </p>
                <button onClick={handleTriggerAnalysis} className="btn-primary" style={{ padding: '10px 16px', fontSize: '13px' }}>
                  Run Roommate Audit 📊
                </button>
              </div>
            )}
          </div>

          {/* Category breakdown progress bars */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Category Breakdown</h3>
            {Object.keys(summary.category_breakdown).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>No categories logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {Object.entries(summary.category_breakdown).map(([category, amount]) => {
                  const pct = summary.total_spending > 0 ? (amount / summary.total_spending) * 100 : 0;
                  return (
                    <div key={category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '500' }}>{category}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          ₹{amount.toLocaleString('en-IN')} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          borderRadius: '3px',
                          background: category.toLowerCase() === 'food' ? 'var(--accent-yellow)' :
                                      category.toLowerCase() === 'travel' ? 'var(--accent-cyan)' :
                                      category.toLowerCase() === 'shopping' ? 'var(--accent-purple)' :
                                      category.toLowerCase() === 'academics' ? 'var(--accent-green)' : 'var(--text-secondary)'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
