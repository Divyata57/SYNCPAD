'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { api } from '../../services/api';
import { User, Mail, MessageSquare, Phone, Tags, Award, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [skills, setSkills] = useState(''); // text area comma separated
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setUsername(user.username);
    setPhone(user.phone || '');
    setBio(user.bio || '');
    setAvatar(user.avatar || '');
    setSkills(user.skills ? user.skills.join(', ') : '');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.put('/profile', {
        username,
        phone,
        bio,
        avatar,
        skills: skillsArray
      });

      if (res.data.success) {
        setSuccess('Profile updated successfully.');
        updateUser(res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed updating profile.');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl overflow-hidden shrink-0">
            {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : username.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-display font-extrabold">My User Profile</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Edit credentials, skills matrix and contact phone logs</p>
          </div>
        </div>

        {error && <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs rounded-lg text-center">{error}</div>}
        {success && <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg text-center flex items-center justify-center gap-1.5"><CheckCircle className="w-4 h-4" /> {success}</div>}

        <form onSubmit={handleSubmit} className="p-6 border border-border rounded-2xl bg-card/45 backdrop-blur-md glass-card space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold mb-1 block">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs bg-muted/40 border border-border rounded-lg pl-6 pr-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 block">Email (ReadOnly)</label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full text-xs bg-muted/20 border border-border text-muted-foreground rounded-lg px-3 py-2 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 block">Phone Number</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs bg-muted/40 border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 block">Avatar Image URL</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full text-xs bg-muted/40 border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">Bio / Summary</label>
            <textarea
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full text-xs bg-muted/40 border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary h-20 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">Skills (Comma-separated)</label>
            <input
              type="text"
              placeholder="Next.js, TypeScript, Express, UI Design"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full text-xs bg-muted/40 border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
            />
            {user.skills && user.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {user.skills.map((skill, idx) => (
                  <span key={idx} className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-lg"
          >
            Update Profile
          </button>
        </form>
      </main>
    </div>
  );
}
