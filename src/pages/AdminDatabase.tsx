import React, { useState, useEffect } from 'react';
import { Database, Trash2, RefreshCw, ChevronRight, ChevronDown, Table as TableIcon, Edit2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import PageShell from '../components/PageShell';

interface TableStat {
  name: string;
  count: number;
}

export default function AdminDatabase() {
  const { user, token } = useAuth();
  const [tables, setTables] = useState<TableStat[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: any, tableName: string } | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [seedConfirm, setSeedConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [creatingRecord, setCreatingRecord] = useState(false);
  const [newRecordData, setNewRecordData] = useState<any>({});

  useEffect(() => {
    if (token && user?.id) {
      fetchTables();
    }
  }, [token, user?.id]);

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'x-user-id': user?.id.toString() || ''
  });

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/database/tables', {
        headers: getHeaders()
      });
      const data = await res.json();
      setTables(data);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName: string) => {
    try {
      setDataLoading(true);
      setSelectedTable(tableName);
      const res = await fetch(`/api/admin/database/table/${tableName}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      setTableData(data);
    } catch (err) {
      console.error('Failed to fetch table data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { id, tableName } = deleteConfirm;
    
    try {
      const res = await fetch(`/api/admin/database/table/${tableName}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setTableData(tableData.filter(row => row.id !== id));
        fetchTables(); // Update counts
      }
    } catch (err) {
      console.error('Failed to delete record:', err);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch('/api/data/reset', { 
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchTables();
        setSelectedTable(null);
        setTableData([]);
      }
    } catch (err) {
      console.error('Failed to reset database:', err);
    } finally {
      setResetConfirm(false);
    }
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await fetch('/api/data/seed', { 
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchTables();
        setSelectedTable(null);
        setTableData([]);
      }
    } catch (err) {
      console.error('Failed to seed database:', err);
    } finally {
      setSeeding(false);
      setSeedConfirm(false);
    }
  };

  const handleEditClick = (record: any) => {
    setEditingRecord(record);
    setEditData({ ...record });
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord || !selectedTable) return;
    
    try {
      const changes: any = {};
      Object.keys(editData).forEach(key => {
        if (editData[key] !== editingRecord[key]) {
          changes[key] = editData[key];
        }
      });

      if (Object.keys(changes).length === 0) {
        setEditingRecord(null);
        return;
      }

      const res = await fetch(`/api/admin/database/table/${selectedTable}/${editingRecord.id}`, {
        method: 'PUT',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(changes)
      });
      
      if (res.ok) {
        const updatedTableData = tableData.map(row => 
          row.id === editingRecord.id ? editData : row
        );
        setTableData(updatedTableData);
        setEditingRecord(null);
      }
    } catch (err) {
      console.error('Failed to update record:', err);
    }
  };

  const handleCreateRecord = async () => {
    if (!selectedTable || Object.keys(newRecordData).length === 0) return;
    
    try {
      const res = await fetch(`/api/admin/database/table/${selectedTable}`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRecordData)
      });
      
      if (res.ok) {
        const result = await res.json();
        setTableData([...tableData, result.record]);
        setNewRecordData({});
        setCreatingRecord(false);
        fetchTables();
      }
    } catch (err) {
      console.error('Failed to create record:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <PageShell
      title="Database Management"
      subtitle="Inspect tables, seed data, and reset the platform state with confidence."
      maxWidth="max-w-7xl"
    >
      <div className="space-y-8">
        {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-neon-dark rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-neon-cyan mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 dark:text-neon-light mb-8">Are you sure you want to delete this record from <span className="font-bold text-indigo-600 dark:text-neon-cyan">{deleteConfirm.tableName}</span>? This action cannot be undone.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-neon-dark rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-neon-cyan">Edit Record</h3>
                <button onClick={() => setEditingRecord(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-neon-gray rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 mb-6">
                {Object.keys(editData).map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-bold text-gray-700 dark:text-neon-light mb-2 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="text"
                      value={editData[key] ?? ''}
                      onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-neon-gray border border-gray-200 dark:border-neon-teal rounded-lg text-gray-900 dark:text-neon-light focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-neon-gray text-gray-700 dark:text-neon-light rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateRecord}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {creatingRecord && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-neon-dark rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-neon-cyan">Create Record in {selectedTable}</h3>
                <button onClick={() => { setCreatingRecord(false); setNewRecordData({}); }} className="p-1 hover:bg-gray-100 dark:hover:bg-neon-gray rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 mb-6">
                <p className="text-sm text-gray-600 dark:text-neon-light">Fill in the fields for the new record. Fields are optional and can be added incrementally.</p>
                {Object.entries(newRecordData).map(([key, value]) => (
                  <div key={key} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 font-bold mb-1">Field</label>
                      <input type="text" value={key} disabled className="w-full px-3 py-2 bg-gray-100 dark:bg-neon-gray border border-gray-200 dark:border-neon-teal rounded-lg text-gray-600 dark:text-neon-light" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 font-bold mb-1">Value</label>
                      <input type="text" value={String(value)} onChange={(e) => setNewRecordData({ ...newRecordData, [key]: e.target.value })} className="w-full px-3 py-2 bg-gray-50 dark:bg-neon-gray border border-gray-200 dark:border-neon-teal rounded-lg text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <button onClick={() => { const copy = { ...newRecordData }; delete copy[key]; setNewRecordData(copy); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const fieldName = prompt('Field name:');
                    if (fieldName && !newRecordData[fieldName]) {
                      setNewRecordData({ ...newRecordData, [fieldName]: '' });
                    }
                  }}
                  className="w-full py-2 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-lg text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  + Add Field
                </button>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => { setCreatingRecord(false); setNewRecordData({}); }}
                  className="flex-1 py-3 bg-gray-100 dark:bg-neon-gray text-gray-700 dark:text-neon-light rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateRecord}
                  disabled={Object.keys(newRecordData).length === 0}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resetConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-neon-dark rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-red-100 dark:border-red-900"
            >
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 uppercase tracking-wider">Danger Zone</h3>
              <p className="text-gray-600 dark:text-neon-light mb-8 font-medium">Are you sure you want to <span className="font-bold text-red-600 dark:text-red-400">RESET THE ENTIRE DATABASE</span>? This will delete all users, jobs, and applications. This action is permanent.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setResetConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReset}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                  Reset All Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {seedConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-neon-dark rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-indigo-100 dark:border-indigo-900"
            >
              <h3 className="text-xl font-bold text-indigo-600 dark:text-neon-cyan mb-4 uppercase tracking-wider">Seed Database</h3>
              <p className="text-gray-600 dark:text-neon-light mb-8 font-medium">This will clear existing data and generate <span className="font-bold text-indigo-600 dark:text-neon-cyan">1000+ dummy records</span> (Users, Jobs, Applications, etc.) for testing. This may take a few seconds.</p>
              <div className="flex gap-4">
                <button 
                  disabled={seeding}
                  onClick={() => setSeedConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  disabled={seeding}
                  onClick={handleSeed}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {seeding ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    'Seed 1000+ Records'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-neon-cyan">Database Management</h1>
          <p className="text-gray-500 dark:text-neon-light mt-2">Full control over all platform data tables.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setSeedConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-neon-cyan border border-indigo-100 dark:border-indigo-900 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-bold"
          >
            <Database className="w-4 h-4" />
            Seed Data
          </button>
          <button 
            onClick={() => setResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors font-bold"
          >
            <Trash2 className="w-4 h-4" />
            Reset Database
          </button>
          <button 
            onClick={fetchTables}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neon-dark border border-gray-200 dark:border-neon-teal rounded-xl hover:bg-gray-50 dark:hover:bg-neon-gray transition-colors font-bold text-gray-900 dark:text-neon-light"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Stats
          </button>
          {selectedTable && (
            <button 
              onClick={() => setCreatingRecord(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors font-bold"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Table List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-neon-cyan flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-indigo-600 dark:text-neon-cyan" />
            Tables
          </h2>
          <div className="bg-white dark:bg-neon-dark border border-gray-200 dark:border-neon-teal rounded-2xl overflow-hidden shadow-sm">
            {tables.map((table) => (
              <button
                key={table.name}
                onClick={() => fetchTableData(table.name)}
                className={`w-full flex items-center justify-between p-4 text-left border-b border-gray-100 dark:border-neon-teal last:border-0 transition-colors ${
                  selectedTable === table.name ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-neon-cyan' : 'hover:bg-gray-50 dark:hover:bg-neon-gray'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className={`w-4 h-4 ${selectedTable === table.name ? 'text-indigo-600 dark:text-neon-cyan' : 'text-gray-400 dark:text-gray-600'}`} />
                  <span className="font-medium capitalize text-gray-900 dark:text-neon-light">{table.name.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedTable === table.name ? 'bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-neon-cyan' : 'bg-gray-100 dark:bg-neon-gray text-gray-600 dark:text-neon-light'
                  }`}>
                    {table.count}
                  </span>
                  <ChevronRight className={`w-4 h-4 ${selectedTable === table.name ? 'text-indigo-600 dark:text-neon-cyan' : 'text-gray-300 dark:text-gray-600'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Data View */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedTable ? `Table: ${selectedTable.toUpperCase()}` : 'Select a table to view data'}
            </h2>
            {selectedTable && (
              <span className="text-sm text-gray-500">Showing up to 100 recent records</span>
            )}
          </div>

          <div className="bg-white dark:bg-neon-dark border border-gray-200 dark:border-neon-teal rounded-2xl shadow-sm overflow-hidden min-h-96">
            {dataLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-neon-cyan animate-spin" />
              </div>
            ) : selectedTable ? (
              tableData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-neon-gray border-b border-gray-200 dark:border-neon-teal">
                        {Object.keys(tableData[0]).map((key) => (
                          <th key={key} className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-neon-light uppercase tracking-wider">
                            {key}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-neon-light uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-neon-teal">
                      {tableData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-neon-gray transition-colors">
                          {Object.values(row).map((val: any, i) => (
                            <td key={i} className="px-4 py-3 text-sm text-gray-600 dark:text-neon-light max-w-48 truncate">
                              {val === null ? <span className="text-gray-300 dark:text-gray-500 italic">null</span> : String(val)}
                            </td>
                          ))}
                          <td className="px-4 py-3 text-right flex gap-2 justify-end">
                            <button
                              onClick={() => handleEditClick(row)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Edit Record"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ id: row.id, tableName: selectedTable! })}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Database className="w-12 h-12 mb-4 opacity-20" />
                  <p>No records found in this table.</p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Database className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a table from the left to explore the database.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </PageShell>
  );
}

