import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axiosConfig';
import Modal from '../components/Modal'; // Using your existing Modal component

export default function TestManagement() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // UI State for Collapsible sections
  const [expandedTests, setExpandedTests] = useState(new Set());
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'test', 'category', 'parameter'
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit'
  const [parentId, setParentId] = useState(null);
  
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      // NOTE: Because axiosConfig baseURL is '/api', we only need '/tests' here
      const res = await api.get('/tests');
      setTests(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to fetch tests from database.' });
    }
    setLoading(false);
  };

  const showNotification = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // --------------------------------------------------------
  // SEARCH FILTERING
  // --------------------------------------------------------
  const filteredTests = useMemo(() => {
    if (!search) return tests;
    const query = search.toLowerCase();

    return tests.map(test => {
      const matchTest = test.testName?.toLowerCase().includes(query);
      
      const filteredCategories = (test.categories || []).map(cat => {
        const matchCat = cat.categoryName?.toLowerCase().includes(query);
        const filteredParams = (cat.parameters || []).filter(p => 
          p.paramName?.toLowerCase().includes(query)
        );
        
        if (matchCat || filteredParams.length > 0) {
          return { ...cat, parameters: filteredParams.length > 0 ? filteredParams : cat.parameters };
        }
        return null;
      }).filter(Boolean);

      if (matchTest || filteredCategories.length > 0) {
        return { ...test, categories: filteredCategories };
      }
      return null;
    }).filter(Boolean);
  }, [tests, search]);

  // --------------------------------------------------------
  // TOGGLE CONTROLS
  // --------------------------------------------------------
  const toggleTest = (id) => {
    const newSet = new Set(expandedTests);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedTests(newSet);
  };

  const toggleCategory = (id) => {
    const newSet = new Set(expandedCategories);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedCategories(newSet);
  };

  // --------------------------------------------------------
  // CRUD OPERATIONS
  // --------------------------------------------------------
  const openForm = (type, mode, data = null, parent = null) => {
    setModalType(type);
    setModalMode(mode);
    setParentId(parent);
    
    if (mode === 'edit' && data) {
      setFormData(data);
    } else {
      if (type === 'test') setFormData({ testName: '', description: '', displayOrder: 0, isActive: 1 });
      if (type === 'category') setFormData({ categoryName: '', amount: '', displayOrder: 0, isActive: true });
      if (type === 'parameter') setFormData({ paramName: '', unit: '', refMaleMin: '', refMaleMax: '', refFemaleMin: '', refFemaleMax: '', displayOrder: 0, isActive: true });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'test') {
        if (modalMode === 'add') await api.post('/tests', formData);
        // Note: Add PUT /tests/{id} endpoint if you want to edit TestMaster later
      } 
      else if (modalType === 'category') {
        const payload = { ...formData, testMaster: { testId: parentId } };
        if (modalMode === 'add') {
          await api.post('/tests/category', payload);
        } else {
          await api.put(`/tests/category/${formData.categoryId}`, payload);
        }
      } 
      else if (modalType === 'parameter') {
        const payload = { ...formData, testCategory: { categoryId: parentId } };
        if (modalMode === 'add') {
          await api.post('/tests/parameter', payload);
        } else {
          await api.put(`/tests/parameter/${formData.paramId}`, payload);
        }
      }
      
      showNotification(`${modalType} saved successfully!`);
      setShowModal(false);
      fetchTests();
    } catch (err) {
      showNotification('Operation failed. Please try again.', 'error');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await api.delete(`/tests/${type}/${id}`);
      showNotification(`${type} deleted successfully!`);
      fetchTests();
    } catch (err) {
      showNotification('Failed to delete item.', 'error');
    }
  };

  // --------------------------------------------------------
  // RENDER UI
  // --------------------------------------------------------
  return (
    <div className="card">
      <div style={styles.header}>
        <h2>Lab Tests & Parameters</h2>
        <button style={styles.btnPrimary} onClick={() => openForm('test', 'add')}>+ Add Master Test</button>
      </div>

      {message.text && (
        <div style={{...styles.alert, background: message.type === 'error' ? '#fee2e2' : '#dcfce3', color: message.type === 'error' ? '#991b1b' : '#166534'}}>
          {message.text}
        </div>
      )}

      <input style={styles.search} placeholder="Search Tests, Categories, Parameters..." onChange={e => setSearch(e.target.value)} />

      {loading ? (
        <p style={{ textAlign: 'center', padding: '20px' }}>Loading tests from database...</p>
      ) : (
        <div style={styles.listContainer}>
          {filteredTests.map((test) => {
            const isTestOpen = expandedTests.has(test.testId) || search.length > 0;

            return (
              <div key={test.testId} style={styles.testCard}>
                
                {/* LEVEL 1: TEST MASTER */}
                <div style={styles.testHeader} onClick={() => toggleTest(test.testId)}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#0284c7' }}>{test.testName}</h3>
                    <small style={{ color: '#64748b' }}>{test.description || 'No description'} | ID: #{test.testId}</small>
                  </div>
                  <div>
                    <button style={styles.btnOutline} onClick={(e) => { e.stopPropagation(); openForm('category', 'add', null, test.testId); }}>+ Add Category</button>
                    <span style={styles.icon}>{isTestOpen ? '▼' : '▶'}</span>
                  </div>
                </div>

                {/* LEVEL 2: CATEGORIES */}
                {isTestOpen && (
                  <div style={styles.categoryWrapper}>
                    {(!test.categories || test.categories.length === 0) ? (
                      <p style={styles.emptyText}>No categories found for this test.</p>
                    ) : (
                      test.categories.map(cat => {
                        const isCatOpen = expandedCategories.has(cat.categoryId) || search.length > 0;
                        
                        return (
                          <div key={cat.categoryId} style={styles.categoryCard}>
                            <div style={styles.categoryHeader} onClick={() => toggleCategory(cat.categoryId)}>
                              <div>
                                <strong>{cat.categoryName}</strong>
                                <span style={styles.badge}>₹{cat.amount?.toFixed(2)}</span>
                              </div>
                              <div>
                                <button style={styles.btnSm} onClick={(e) => { e.stopPropagation(); openForm('parameter', 'add', null, cat.categoryId); }}>+ Param</button>
                                <button style={styles.btnSm} onClick={(e) => { e.stopPropagation(); openForm('category', 'edit', cat, test.testId); }}>Edit</button>
                                <button style={{...styles.btnSm, color: 'red'}} onClick={(e) => { e.stopPropagation(); handleDelete('category', cat.categoryId); }}>Del</button>
                                <span style={styles.icon}>{isCatOpen ? '▼' : '▶'}</span>
                              </div>
                            </div>

                            {/* LEVEL 3: PARAMETERS */}
                            {isCatOpen && (
                              <div style={styles.tableWrapper}>
                                {(!cat.parameters || cat.parameters.length === 0) ? (
                                  <p style={styles.emptyText}>No parameters found.</p>
                                ) : (
                                  <table style={styles.table}>
                                    <thead>
                                      <tr style={styles.thRow}>
                                        <th>Parameter</th>
                                        <th>Unit</th>
                                        <th>Male Range</th>
                                        <th>Female Range</th>
                                        <th>Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {cat.parameters.map(p => (
                                        <tr key={p.paramId} style={styles.tr}>
                                          <td>{p.paramName}</td>
                                          <td>{p.unit || '-'}</td>
                                          <td>{p.refMaleMin} - {p.refMaleMax}</td>
                                          <td>{p.refFemaleMin} - {p.refFemaleMax}</td>
                                          <td>
                                            <button style={styles.actionBtn} onClick={() => openForm('parameter', 'edit', p, cat.categoryId)}>Edit</button>
                                            <button style={{...styles.actionBtn, color: 'red'}} onClick={() => handleDelete('parameter', p.paramId)}>Del</button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* REUSABLE FORM MODAL */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`${modalMode === 'add' ? 'Add' : 'Edit'} ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {modalType === 'test' && (
            <>
              <input required placeholder="Test Name" style={styles.input} value={formData.testName || ''} onChange={e => setFormData({...formData, testName: e.target.value})} />
              <input placeholder="Description" style={styles.input} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            </>
          )}

          {modalType === 'category' && (
            <>
              <input required placeholder="Category Name" style={styles.input} value={formData.categoryName || ''} onChange={e => setFormData({...formData, categoryName: e.target.value})} />
              <input required type="number" step="0.01" placeholder="Amount (₹)" style={styles.input} value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </>
          )}

          {modalType === 'parameter' && (
            <>
              <input required placeholder="Parameter Name" style={styles.input} value={formData.paramName || ''} onChange={e => setFormData({...formData, paramName: e.target.value})} />
              <input placeholder="Unit (e.g. g/dL)" style={styles.input} value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input placeholder="Male Min" style={styles.input} value={formData.refMaleMin || ''} onChange={e => setFormData({...formData, refMaleMin: e.target.value})} />
                <input placeholder="Male Max" style={styles.input} value={formData.refMaleMax || ''} onChange={e => setFormData({...formData, refMaleMax: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input placeholder="Female Min" style={styles.input} value={formData.refFemaleMin || ''} onChange={e => setFormData({...formData, refFemaleMin: e.target.value})} />
                <input placeholder="Female Max" style={styles.input} value={formData.refFemaleMax || ''} onChange={e => setFormData({...formData, refFemaleMax: e.target.value})} />
              </div>
            </>
          )}

          <button type="submit" style={styles.btnPrimary}>Save</button>
        </form>
      </Modal>

    </div>
  );
}

// --------------------------------------------------------
// INLINE STYLES (Matching DoctorManagement layout)
// --------------------------------------------------------
const styles = {
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  search: { padding: '10px', width: '100%', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' },
  alert: { padding: '10px', marginBottom: '20px', borderRadius: '6px' },
  
  listContainer: { display: 'flex', flexDirection: 'column', gap: '15px' },
  testCard: { border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff' },
  testHeader: { padding: '15px 20px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: '1px solid #e2e8f0' },
  
  categoryWrapper: { padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#fff' },
  categoryCard: { border: '1px solid #cbd5e1', borderRadius: '6px' },
  categoryHeader: { padding: '12px 15px', background: '#f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  
  tableWrapper: { padding: '10px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' },
  thRow: { borderBottom: '2px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #e2e8f0' },
  
  btnPrimary: { background: '#0284c7', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  btnOutline: { background: 'transparent', color: '#0284c7', border: '1px solid #0284c7', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' },
  btnSm: { background: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', padding: '0 5px', fontWeight: 'bold' },
  actionBtn: { background: 'transparent', border: 'none', color: '#0284c7', cursor: 'pointer', marginRight: '10px' },
  
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box' },
  badge: { marginLeft: '10px', background: '#dcfce3', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' },
  icon: { marginLeft: '15px', color: '#94a3b8', fontSize: '0.8rem' },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', padding: '10px', margin: 0, fontSize: '0.9rem' }
};