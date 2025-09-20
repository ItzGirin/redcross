import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Vote, LogOut, CheckCircle, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

const candidates = [
  {
    id: 'rangga',
    name: 'Rangga',
    slogan: 'Bersama Membangun PMR yang Lebih Baik',
    vision: 'Menjadikan PMR sebagai organisasi yang solid, profesional, dan bermanfaat bagi sekolah',
    mission: [
      'Meningkatkan kualitas pelatihan anggota PMR',
      'Mengadakan kegiatan sosial secara rutin',
      'Mempererat hubungan antar anggota PMR',
      'Meningkatkan partisipasi dalam kegiatan sekolah'
    ],
    color: 'from-blue-500 to-blue-600',
    avatar: '👨\u200d⚕️',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'ghazi',
    name: 'Ghazi',
    slogan: 'Inovasi dan Dedikasi untuk PMR Masa Depan',
    vision: 'Menciptakan PMR yang inovatif, aktif, dan memberikan dampak positif bagi lingkungan sekolah',
    mission: [
      'Mengembangkan program pelatihan modern',
      'Menjalin kerjasama dengan instansi kesehatan',
      'Meningkatkan awareness kesehatan di sekolah',
      'Membangun sistem organisasi yang efektif'
    ],
    color: 'from-red-500 to-red-600',
    avatar: '👨\u200d🎓',
    bgColor: 'bg-red-50'
  }
];

export default function VotingPage() {
  const { currentUser, logout } = useAuth();
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userVote, setUserVote] = useState(null);

  useEffect(() => {
    checkVotingStatus();
  }, [currentUser]);

  async function checkVotingStatus() {
    try {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setHasVoted(userData.hasVoted || false);
          setUserVote(userData.votedFor || null);
        }
      }
    } catch (error) {
      console.error('Error checking voting status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote() {
    if (!selectedCandidate) {
      toast.error('Silakan pilih kandidat terlebih dahulu');
      return;
    }

    try {
      setSubmitting(true);

      // Update user document
      await updateDoc(doc(db, 'users', currentUser.uid), {
        hasVoted: true,
        votedFor: selectedCandidate,
        votedAt: serverTimestamp()
      });

      // Add vote to votes collection
      await addDoc(collection(db, 'votes'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        candidateId: selectedCandidate,
        timestamp: serverTimestamp()
      });

      setHasVoted(true);
      setUserVote(selectedCandidate);
      toast.success('Suara Anda berhasil disimpan!');
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Terjadi kesalahan saat menyimpan suara');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (hasVoted) {
    const votedCandidate = candidates.find(c => c.id === userVote);
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 rounded-full p-3">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{currentUser.displayName}</h2>
                  <p className="text-gray-600">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Terima Kasih!
            </h1>
            <p className="text-gray-600 mb-6">
              Suara Anda telah berhasil disimpan untuk pemilihan Ketua PMR
            </p>
            
            {votedCandidate && (
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Pilihan Anda:</h3>
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-4xl">{votedCandidate.avatar}</div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">{votedCandidate.name}</h4>
                    <p className="text-gray-600">{votedCandidate.slogan}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-blue-700">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Hasil pemilihan akan diumumkan setelah periode voting berakhir</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 rounded-full p-3">
                <User className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{currentUser.displayName}</h2>
                <p className="text-gray-600">{currentUser.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Pemilihan Ketua PMR
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            SMA IT Abu Bakar Boarding School Kulon Progo
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-2 text-yellow-700">
              <Vote className="w-5 h-5" />
              <span className="font-medium">Pilih salah satu kandidat di bawah ini</span>
            </div>
          </div>
        </div>

        {/* Candidates */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                selectedCandidate === candidate.id 
                ? 'ring-4 ring-blue-500 ring-opacity-50' 
                : ''
              }`}
              onClick={() => setSelectedCandidate(candidate.id)}
            >
              <div className={`bg-gradient-to-r ${candidate.color} p-6 text-white text-center`}>
                <div className="text-6xl mb-4">{candidate.avatar}</div>
                <h3 className="text-2xl font-bold mb-2">{candidate.name}</h3>
                <p className="text-lg opacity-90">{candidate.slogan}</p>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Visi:</h4>
                  <p className="text-gray-600">{candidate.vision}</p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Misi:</h4>
                  <ul className="space-y-2">
                    {candidate.mission.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {selectedCandidate === candidate.id && (
                <div className="bg-blue-50 border-t border-blue-200 p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-blue-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Kandidat Terpilih</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Vote Button */}
        <div className="text-center">
          <button
            onClick={handleVote}
            disabled={!selectedCandidate || submitting}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
          >
            {submitting ? 'Menyimpan Suara...' : 'Kirim Suara'}
          </button>
          
          {!selectedCandidate && (
            <p className="text-gray-500 mt-4">Pilih kandidat untuk mengaktifkan tombol vote</p>
          )}
        </div>
      </div>
    </div>
  );
}