import { useState, useEffect, useMemo, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
const GRAPHQL_URL = API_URL && API_URL.trim() !== ''
  ? `${API_URL.replace(/\/+$/, '')}/query`
  : '/query';

function App() {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const clearMsgTimeoutRef = useRef(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const query = `
        query {
          employees {
            id
            name
            email
            position
          }
        }
      `;
      const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        throw new Error(`Network error: ${res.status}`);
      }
      const json = await res.json();
      if (json.errors) {
        throw new Error(json.errors?.[0]?.message || 'GraphQL error');
      }
      setEmployees(Array.isArray(json.data?.employees) ? json.data.employees : []);
      setErrorMsg('');
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
      setErrorMsg('Failed to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    const mutation = `
      mutation CreateEmployee($input: NewEmployee!) {
        createEmployee(input: $input) {
          id
          name
          email
          position
        }
      }
    `;
    const variables = { input: formData };

    try {
      const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutation, variables }),
      });
      if (!res.ok) {
        throw new Error(`Network error: ${res.status}`);
      }
      const json = await res.json();
      if (json.errors) {
        throw new Error(json.errors?.[0]?.message || 'GraphQL error');
      }
      setFormData({ name: '', email: '', position: '' });
      setSuccessMsg('Employee added successfully!');
      await fetchEmployees();
    } catch (err) {
      console.error('Error creating employee:', err);
      setErrorMsg(err?.message || 'Failed to create employee.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (successMsg) {
      if (clearMsgTimeoutRef.current) clearTimeout(clearMsgTimeoutRef.current);
      clearMsgTimeoutRef.current = setTimeout(() => setSuccessMsg(''), 3000);
    }
    return () => {
      if (clearMsgTimeoutRef.current) clearTimeout(clearMsgTimeoutRef.current);
    };
  }, [successMsg]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter((emp) =>
      [emp.name, emp.email, emp.position].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [employees, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/70 backdrop-blur border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-800">🚀 Employee Directory</h1>
          <span className="hidden md:inline text-sm text-slate-500">GraphQL Frontend</span>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-8">

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-6 mb-6 grid gap-4 md:grid-cols-4"
        >
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            name="position"
            value={formData.position}
            onChange={handleChange}
            placeholder="Job Title"
            className="border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Adding...' : 'Add Employee'}
          </button>
        </form>

        <div className="mb-6 grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or position..."
              className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex items-center justify-end text-sm text-slate-600">
            <span className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-md">{filteredEmployees.length} result{filteredEmployees.length === 1 ? '' : 's'}</span>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 text-green-700 bg-green-100 border border-green-200 px-4 py-2 rounded shadow">
            ✅ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 text-red-700 bg-red-100 border border-red-200 px-4 py-2 rounded shadow">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-blue-50 text-blue-800 text-sm font-semibold sticky top-[64px]">
              <tr>
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Email</th>
                <th className="px-6 py-4 text-left">Position</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-6 text-gray-500">Loading employees...</td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-6 text-gray-500">No employees found.</td>
                </tr>
              ) : (
                filteredEmployees.map((emp, idx) => (
                  <tr key={emp.id} className={`border-t text-gray-700 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-gray-100`}>
                    <td className="px-6 py-4">{emp.name}</td>
                    <td className="px-6 py-4">{emp.email}</td>
                    <td className="px-6 py-4">{emp.position}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;