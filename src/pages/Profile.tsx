import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { User, Mail, BookOpen, Briefcase, Award, Edit3, X, Check, Upload, Image as ImageIcon } from 'lucide-react';
import PageShell from '../components/PageShell';

const Profile = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/profile/${user?.id}`);
        setProfile(res.data);
        setFormData({
          avatar_url: res.data?.avatar_url || '',
          background_url: res.data?.background_url || '',
          bio: res.data?.bio || '',
          target_career: res.data?.target_career || '',
          education: res.data?.education || '',
          experience_years: res.data?.experience_years || 0,
          location: res.data?.location || '',
          website: res.data?.website || ''
        });
        setAvatarPreview(res.data?.avatar_url || null);
        setBackgroundPreview(res.data?.background_url || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setFormData({ ...formData, avatar_url: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBackgroundPreview(result);
        setFormData({ ...formData, background_url: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    try {
      await axios.put(`/api/profile/${user.id}`, formData);
      const updated = { ...profile, ...formData };
      setProfile(updated);
      setAvatarPreview(formData.avatar_url);
      setBackgroundPreview(formData.background_url);
      setIsEditing(false);
      alert('Profile updated successfully.');
    } catch (err) {
      console.error('Profile update failed:', err);
      alert('Unable to save profile.');
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      avatar_url: profile?.avatar_url || '',
      background_url: profile?.background_url || '',
      bio: profile?.bio || '',
      target_career: profile?.target_career || '',
      education: profile?.education || '',
      experience_years: profile?.experience_years || 0,
      location: profile?.location || '',
      website: profile?.website || ''
    });
    setAvatarPreview(profile?.avatar_url || null);
    setBackgroundPreview(profile?.background_url || null);
    setIsEditing(false);
  };

  if (loading) return <div className="p-8">Loading profile...</div>;

  return (
    <PageShell
      title="Profile"
      subtitle="Manage your career profile and skills in one place."
      maxWidth="max-w-6xl"
    >
      <div className="space-y-8">
        <div className="bg-white dark:bg-neon-dark rounded-3xl shadow-sm border border-gray-100 dark:border-neon-teal overflow-hidden transition-colors duration-300">
        {/* Background Banner */}
        <div className="relative h-32 bg-linear-to-r from-indigo-600 to-violet-600 overflow-hidden group">
          {backgroundPreview || profile?.background_url ? (
            <img
              src={backgroundPreview || profile?.background_url}
              alt="Background"
              className="w-full h-full object-cover"
            />
          ) : (
            <div></div>
          )}
          {isEditing && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold cursor-pointer hover:bg-gray-100">
                <ImageIcon className="h-4 w-4" />
                Edit Background
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        <div className="px-8 pb-8">
          {/* Avatar Section */}
          <div className="relative -mt-16 mb-6">
            <div className="relative h-32 w-32 bg-white dark:bg-neon-gray rounded-3xl p-1 shadow-lg overflow-hidden group">
              {avatarPreview || profile?.avatar_url ? (
                <img
                  src={avatarPreview || profile?.avatar_url}
                  alt="Avatar"
                  className="h-full w-full object-cover rounded-2xl"
                />
              ) : (
                <div className="h-full w-full bg-indigo-100 dark:bg-neon-teal rounded-2xl flex items-center justify-center text-indigo-700 dark:text-neon-dark text-4xl font-bold transition-colors duration-300">
                  {user?.fullName?.charAt(0)}
                </div>
              )}
              {isEditing && (
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <div className="flex flex-col items-center gap-1">
                    <Upload className="h-5 w-5 text-white" />
                    <span className="text-xs text-white font-semibold">Update</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-neon-cyan">{user?.fullName}</h2>
              <p className="text-gray-500 dark:text-neon-light font-medium">{profile?.target_career || 'Aspiring Professional'}</p>
              <p className="text-sm text-gray-500 dark:text-neon-light mt-2">{profile?.location || 'Location not set'}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
                  >
                    <Check className="h-4 w-4" />
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-6 py-2 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-2 border border-gray-200 dark:border-neon-teal rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-neon-gray transition-all text-gray-700 dark:text-neon-light"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </button>
              )}
              <button 
                onClick={logout}
                className="px-6 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center text-gray-600 dark:text-neon-light">
                <Mail className="h-5 w-5 mr-3 text-gray-400 dark:text-neon-light/50" />
                {user?.email}
              </div>
              <div className="flex items-center text-gray-600 dark:text-neon-light">
                <BookOpen className="h-5 w-5 mr-3 text-gray-400 dark:text-neon-light/50" />
                {profile?.education || 'Education not set'}
              </div>
              <div className="flex items-center text-gray-600 dark:text-neon-light">
                <Briefcase className="h-5 w-5 mr-3 text-gray-400 dark:text-neon-light/50" />
                {profile?.experience_years} Years Experience
              </div>
            </div>

            <div className="bg-linear-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/40 transition-colors duration-300">
              <h4 className="font-bold text-gray-900 dark:text-neon-cyan mb-4 flex items-center transition-colors duration-300">
                <Award className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Top Skills
              </h4>
              <div className="flex flex-wrap gap-3">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-white dark:bg-neon-dark border-2 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-semibold transition-all hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-indigo-500/20 hover:scale-105"
                    >
                      {typeof skill === 'string' ? skill : skill.name || 'Unknown'}
                    </span>
                  ))
                ) : (
                  <div className="w-full py-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-neon-light/70">No skills added yet.</p>
                    <p className="text-xs text-gray-400 dark:text-neon-light/50 mt-1">Update your profile to showcase your skills</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h4 className="font-bold text-gray-900 dark:text-neon-cyan mb-4 transition-colors duration-300">About Me</h4>
            <p className="text-gray-600 dark:text-neon-light leading-relaxed transition-colors duration-300">
              {profile?.bio || 'No bio provided yet. Tell the world about your career goals and passions!'}
            </p>
          </div>

          {isEditing && formData && (
            <div className="mt-12 bg-white dark:bg-neon-dark rounded-3xl shadow-sm border border-gray-100 dark:border-neon-teal p-8 transition-colors duration-300">
              <h4 className="font-bold text-gray-900 dark:text-neon-cyan mb-6 transition-colors duration-300">Edit Profile Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neon-light mb-2">Profile Photo</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-neon-teal rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-neon-gray transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      {avatarPreview ? (
                        <div className="flex flex-col items-center">
                          <img src={avatarPreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover mx-auto mb-2" />
                          <span className="text-xs text-gray-600 dark:text-neon-light">Click to change</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-6 w-6 text-gray-400 dark:text-neon-light/50 mx-auto mb-2" />
                          <span className="text-sm text-gray-600 dark:text-neon-light">Upload photo</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Background Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neon-light mb-2">Background Image</label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-neon-teal rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-neon-gray transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundChange}
                      className="hidden"
                      id="background-upload"
                    />
                    <label htmlFor="background-upload" className="cursor-pointer">
                      {backgroundPreview ? (
                        <div className="flex flex-col items-center">
                          <img src={backgroundPreview} alt="Preview" className="h-20 w-full rounded-lg object-cover mb-2" />
                          <span className="text-xs text-gray-600 dark:text-neon-light">Click to change</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <ImageIcon className="h-6 w-6 text-gray-400 dark:text-neon-light/50 mx-auto mb-2" />
                          <span className="text-sm text-gray-600 dark:text-neon-light">Upload background</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neon-light mb-2">Target Career</label>
                  <input
                    type="text"
                    value={formData.target_career}
                    onChange={(e) => setFormData({ ...formData, target_career: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200"
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neon-light mb-2">Education</label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200"
                    placeholder="e.g. BSc Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neon-light mb-2">Experience Years</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neon-light mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200"
                    placeholder="e.g. Bangalore, India"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neon-light mb-2">Website</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200"
                    placeholder="https://portfolio.example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-neon-light mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-neon-teal bg-white dark:bg-neon-gray text-gray-900 dark:text-neon-light focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-cyan outline-none transition-colors duration-200 h-32 resize-none"
                    placeholder="Tell us about your goals, strengths, and career interests."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </PageShell>
  );
};

export default Profile;
