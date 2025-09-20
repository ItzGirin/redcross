import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BarChart3, Users, Vote, LogOut, RefreshCw, Download, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [votes, setVotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showVoterDetails, setShowVoterDetails] = useState(false);

  useEffect(() => {
    fetchData();
    setupRealTimeListeners();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Fetch votes
      const votesQuery = query(collection(db, 'votes'), orderBy('timestamp', 'desc'));
      const votesSnapshot = await getDocs(votesQuery);
      const votesData = votesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVotes(votesData);

      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }

  function setupRealTimeListeners() {
    // Real-time votes listener
    const votesQuery = query(collection(db, 'votes'), orderBy('timestamp', 'desc'));
    const unsubscribeVotes = onSnapshot(votesQuery, (snapshot) => {
      const votesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVotes(votesData);
    });

    // Real-time users listener
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    });

    return () => {
      unsubscribeVotes();
      unsubscribeUsers();
    };
  }

  function getVotingStats() {
    const rangga = votes.filter(vote => vote.candidateId === 'rangga').length;
    const ghazi = votes.filter(vote => vote.candidateId === 'ghazi').length;
    const total = votes.length;
    const registeredUsers = users.length;
    const votedUsers = users.filter(user => user.hasVoted).length;

    return {
      rangga,
      ghazi,
      total,
      registeredUsers,
      votedUsers,
      turnout: registeredUsers > 0 ? ((votedUsers / registeredUsers) * 100).toFixed(1) : 0
    };
  }

  function exportResults() {
    const stats = getVotingStats();
    const data = [
      ['HASIL PEMILIHAN KETUA PMR'],
      ['SMA IT Abu Bakar Boarding School Kulon Progo'],
      [''],
      ['Ringkasan Hasil:'],
      [`Rangga: ${stats.rangga} suara (${stats.total > 0 ? ((stats.rangga / stats.total) * 100).toFixed(1) : 0}%)`],
      [`Ghazi: ${stats.ghazi} suara (${stats.total > 0 ? ((stats.ghazi / stats.total) * 100).toFixed(1) : 0}%)`],
      [`Total Suara: ${stats.total}`],
      [`Tingkat Partisipasi: ${stats.turnout}%`],
      [''],
      ['Detail Pemilih:'],
      ['Nama', 'Email', 'Pilihan', 'Waktu']
    ];

    votes.forEach(vote => {
      data.push([
        vote.userName || 'N/A',
        vote.userEmail || 'N/A',
        vote.candidateId === 'rangga' ? 'Rangga' : 'Ghazi',
        vote.timestamp ? new Date(vote.timestamp.seconds * 1000).toLocaleString('id-ID') : 'N/A'
      ]);
    });

    const csvContent = data.map(row => row.join(',')).join('\
');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hasil-pemilihan-pmr-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Hasil berhasil diunduh');
  }

  const stats = getVotingStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Admin</h1>
              <p className="text-gray-600">Pemilihan Ketua PMR - SMA IT Abu Bakar Boarding School</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchData}
                className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-3 mr-4">
                <Vote className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
                <p className="text-gray-600">Total Suara</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.registeredUsers}</h3>
                <p className="text-gray-600">Pengguna Terdaftar</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-full p-3 mr-4">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.turnout}%</h3>
                <p className="text-gray-600">Tingkat Partisipasi</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-full p-3 mr-4">
                <Vote className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{stats.votedUsers}</h3>
                <p className="text-gray-600">Sudah Memilih</p>
              </div>
            </div>
          </div>
        </div>

        {/* Voting Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Rangga */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">👨\u200d⚕️</div>
              <h3 className="text-2xl font-bold text-gray-800">Rangga</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Jumlah Suara:</span>
                <span className="text-2xl font-bold text-blue-600">{stats.rangga}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.rangga / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="text-center">
                <span className="text-3xl font-bold text-blue-600">
                  {stats.total > 0 ? ((stats.rangga / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Ghazi */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">👨\u200d🎓</div>
              <h3 className="text-2xl font-bold text-gray-800">Ghazi</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Jumlah Suara:</span>
                <span className="text-2xl font-bold text-red-600">{stats.ghazi}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-red-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.ghazi / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="text-center">
                <span className="text-3xl font-bold text-red-600">
                  {stats.total > 0 ? ((stats.ghazi / stats.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-gray-800">Aksi Admin</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowVoterDetails(!showVoterDetails)}
                className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                {showVoterDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showVoterDetails ? 'Sembunyikan' : 'Tampilkan'} Detail</span>
              </button>
              <button
                onClick={exportResults}
                className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Hasil</span>
              </button>
            </div>
          </div>
        </div>

        {/* Voter Details */}
        {showVoterDetails && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Detail Pemilih ({votes.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Nama</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Pilihan</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {votes.map((vote, index) => (
                    <tr key={vote.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800">{vote.userName || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600">{vote.userEmail || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          vote.candidateId === 'rangga' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {vote.candidateId === 'rangga' ? 'Rangga' : 'Ghazi'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {vote.timestamp 
                          ? new Date(vote.timestamp.seconds * 1000).toLocaleString('id-ID')
                          : 'N/A'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {votes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Belum ada suara yang masuk
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}