import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReelUpload from '../components/ReelUpload';

const UploadReelPage = () => {
  const navigate = useNavigate();
  const [recentUpload, setRecentUpload] = useState(null);

  const handleUploadSuccess = (reel) => {
    setRecentUpload(reel);
    // Redirect to reels page after 2 seconds
    setTimeout(() => {
      navigate('/reels');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Create & Share Movie Edits</h1>
          <p className="text-gray-400">Upload your favorite cinema moments, action scenes, or emotional clips</p>
        </div>

        {/* Upload Form */}
        <ReelUpload onUploadSuccess={handleUploadSuccess} />

        {/* Success Message */}
        {recentUpload && (
          <div className="mt-8 p-6 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700 rounded-lg text-center">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="text-xl font-bold text-green-300 mb-2">Upload Successful!</h3>
            <p className="text-green-200 mb-4">Your movie edit has been uploaded and will appear in the reels feed.</p>
            <button
              onClick={() => navigate('/reels')}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
            >
              View Your Edit →
            </button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
            <div className="text-3xl mb-3">🎬</div>
            <h3 className="text-lg font-bold text-white mb-2">Movie Clips</h3>
            <p className="text-gray-400 text-sm">Upload short clips from your favorite films, scenes, or trailers.</p>
          </div>

          <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
            <div className="text-3xl mb-3">✂️</div>
            <h3 className="text-lg font-bold text-white mb-2">Edits & Compilations</h3>
            <p className="text-gray-400 text-sm">Create action montages, emotional moments, or creative mashups.</p>
          </div>

          <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
            <div className="text-3xl mb-3">❤️</div>
            <h3 className="text-lg font-bold text-white mb-2">Get Likes & Views</h3>
            <p className="text-gray-400 text-sm">Share your edits and connect with other cinema enthusiasts.</p>
          </div>
        </div>

        {/* Guidelines */}
        <div className="mt-12 p-6 bg-blue-900/20 border border-blue-800 rounded-lg">
          <h3 className="text-lg font-bold text-blue-300 mb-4">📋 Guidelines</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>✓ Keep videos under 50MB and under 10 minutes (recommended: 15-60 seconds)</li>
            <li>✓ Ensure you have rights to use the material (original content or fair use)</li>
            <li>✓ Supported formats: MP4, AVI, MKV, MOV</li>
            <li>✓ Add meaningful titles and descriptions</li>
            <li>✗ No copyright infringement</li>
            <li>✗ No explicit or offensive content</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadReelPage;
