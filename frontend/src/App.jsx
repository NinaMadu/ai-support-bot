import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Database, Loader2, Send } from 'lucide-react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000/api/knowledge';

function App() {
  const [knowledge, setKnowledge] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const response = await axios.get(API_BASE_URL);
      setKnowledge(response.data);
    } catch (error) {
      console.error('Error fetching knowledge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKnowledge = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const response = await axios.post(API_BASE_URL, { content });
      setKnowledge([response.data, ...knowledge]);
      setContent('');
    } catch (error) {
      console.error('Error adding knowledge:', error);
      alert('Failed to add knowledge. Make sure the backend is running and Gemini API key is valid.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this knowledge?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      setKnowledge(knowledge.filter((item) => item._id !== id));
    } catch (error) {
      console.error('Error deleting knowledge:', error);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Bot Knowledge Admin</h1>
        <p className="text-muted">Manage the information your support bot uses to answer questions.</p>
      </header>

      <div className="dashboard-grid">
        <div className="card">
          <form onSubmit={handleAddKnowledge}>
            <div className="input-group">
              <label htmlFor="content">Add New Information</label>
              <textarea
                id="content"
                placeholder="Enter facts, instructions, or FAQs here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={submitting}
              />
            </div>
            <button type="submit" disabled={submitting || !content.trim()}>
              {submitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Plus size={20} />
              )}
              {submitting ? 'Processing...' : 'Add to Knowledge Base'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Current Knowledge Base</h2>
          <br />
          {loading ? (
            <div className="loading">
              <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto' }} />
            </div>
          ) : knowledge.length === 0 ? (
            <div className="empty-state">
              <Database size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>No knowledge added yet. Start by adding some information above.</p>
            </div>
          ) : (
            <div className="knowledge-list">
              {knowledge.map((item) => (
                <div key={item._id} className="knowledge-item">
                  <div className="knowledge-content">{item.content}</div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(item._id)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
