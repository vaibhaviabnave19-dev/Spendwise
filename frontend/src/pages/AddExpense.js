import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config';

function AddExpense() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  
  // Set default date to today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !category || !date) {
      setError('Amount, Category, and Date are required');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    setError('');
    setLoading(true);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE_URL}/expense/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: numAmount,
          category,
          note,
          date
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record expense');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fun helper that gives roommate-style comments as user types!
  const getRoommateLiveRoast = () => {
    const val = parseFloat(amount);
    if (!val || isNaN(val)) return 'Enter an amount to see my analysis...';
    if (category === 'Food') {
      if (val > 1000) return `💸 ₹${val} on food? Are you renting the restaurant, bro?`;
      if (val > 500) return `🍔 That's a premium meal. Say goodbye to mess food for 3 days.`;
      if (val > 200) return `🍟 Double cheese burger craving detected. Watch the scale and the wallet!`;
      return `☕ Simple snacking. Approved, but don't buy 5 of these today.`;
    }
    if (category === 'Shopping') {
      if (val > 2000) return `🛍️ ₹${val} on shopping?! Hide your credit cards immediately!`;
      if (val > 1000) return `👟 Impulse purchase? Do you really need this to study?`;
      return `📦 Amazon/Flipkart boxes arriving at the hostel gate...`;
    }
    if (category === 'Travel') {
      if (val > 800) return `✈️ Going out of town? Safe travels, pocket money is leaving too!`;
      if (val > 300) return `🚖 Ubers instead of local shared autos? Lazy roomie!`;
      return `🚶 Walking was free, but fine, autos are cheap enough.`;
    }
    if (category === 'Academics') {
      return `📚 Investing in your education! Roommate approved. Masterpiece choice.`;
    }
    if (val > 1500) return `💸 That's a huge bill! Prepare to eat dry Maggi next week.`;
    return 'Looks like a regular hostel expense.';
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.3s ease' }}>
      <button 
        onClick={() => navigate('/')} 
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '20px'
        }}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <div className="glass-card">
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Log New Expense</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          Record your spending to let the roommate AI keep track.
        </p>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--accent-rose-glow)',
            border: '1px solid var(--accent-rose)',
            color: 'var(--accent-rose)',
            padding: '12px',
            borderRadius: 'var(--border-radius-sm)',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--accent-green-glow)',
            border: '1px solid var(--accent-green)',
            color: 'var(--accent-green)',
            padding: '12px',
            borderRadius: 'var(--border-radius-sm)',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <Check size={18} />
            <span>Expense recorded successfully! Returning...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="amount">Amount (INR ₹)</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>₹</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="input-field"
                style={{ paddingLeft: '36px', fontSize: '20px', fontWeight: 'bold' }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={success}
              />
            </div>
          </div>

          <div className="expense-form-grid">
            <div className="input-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                className="input-field"
                style={{ cursor: 'pointer' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                disabled={success}
              >
                <option value="Food">Food / Snacks</option>
                <option value="Travel">Travel / Commute</option>
                <option value="Shopping">Shopping / Clothes</option>
                <option value="Academics">Academics / Printouts</option>
                <option value="Rent">Rent / PG Fees</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other / Miscellaneous</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="date">Date</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }} />
                <input
                  id="date"
                  type="date"
                  className="input-field"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  disabled={success}
                />
              </div>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="note">Notes / Description (Optional)</label>
            <div style={{ position: 'relative' }}>
              <FileText size={18} style={{
                position: 'absolute',
                left: '16px',
                top: '16px',
                color: 'var(--text-muted)'
              }} />
              <textarea
                id="note"
                placeholder="What did you buy? e.g., Late night tea with roommates, printouts for physics assignment"
                className="input-field"
                style={{ paddingLeft: '48px', minHeight: '80px', resize: 'vertical' }}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={success}
              />
            </div>
          </div>

          {/* Live roommate prompt feedback */}
          <div style={{
            display: 'flex',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed var(--card-border)',
            padding: '16px',
            borderRadius: 'var(--border-radius-sm)',
            marginBottom: '30px',
            alignItems: 'flex-start'
          }}>
            <Sparkles size={18} style={{ color: 'var(--accent-purple)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Roommate Reaction</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {getRoommateLiveRoast()}
              </p>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '14px' }} 
            disabled={loading || success}
          >
            {loading ? 'Logging transaction...' : 'Save Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddExpense;
