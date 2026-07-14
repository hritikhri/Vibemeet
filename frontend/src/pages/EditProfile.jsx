import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Save, ArrowLeft, Loader2, X, Check } from "lucide-react";
import Button from "../components/ui/Button";
import api from "../lib/api";

export default function EditProfile() {
  const { user, setUser } = useAuthStore();

  const [form, setForm] = useState({
    name: "",
    bio: "",
    mood: "social",
    link: "",
  });

  const [interests, setInterests] = useState([]);
  const [newInterestInput, setNewInterestInput] = useState("");
  const [interestError, setInterestError] = useState("");

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Error states
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);
  const hasUnsavedChanges = useRef(false);

  // Load user data
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        bio: user.bio || "",
        mood: user.mood || "social",
        link: user.link || "",
      });
      setInterests(user.interests || []);
      setAvatarPreview(user.avatar || null);
    }
    setIsLoading(false);
  }, [user]);

  // Track unsaved changes
  useEffect(() => {
    hasUnsavedChanges.current = true;
  }, [form, interests, selectedFile]);

  // Unsaved changes warning before leaving
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleAvatarClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setAvatarPreview(event.target.result);
    reader.readAsDataURL(file);
  };

  const toggleEdit = (field) => {
    setEditingField(editingField === field ? null : field);
    setInterestError("");
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSaveSuccess(false);
  };

  // ================= Interests (Max 5) =================
  const addInterest = () => {
    const trimmed = newInterestInput.trim();
    if (!trimmed) return;

    if (interests.length >= 5) {
      setInterestError("Maximum 5 interests allowed");
      return;
    }

    let tag = trimmed.replace(/^#/, "").trim();
    if (tag && !interests.includes(tag)) {
      setInterests((prev) => [...prev, tag]);
      setNewInterestInput("");
      setInterestError("");
    }
  };

  const removeInterest = (tagToRemove) => {
    setInterests((prev) => prev.filter((tag) => tag !== tagToRemove));
    setInterestError("");
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (form.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (form.bio.length > 200) {
      newErrors.bio = "Bio cannot exceed 200 characters";
    }

    if (form.link) {
      try {
        new URL(form.link);
      } catch {
        newErrors.link = "Please enter a valid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadAvatar = async (file) => {
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await api.post("/users/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.avatar;
    } catch (error) {
      console.error("Avatar upload failed:", error);
      setErrors({ general: "Failed to upload avatar" });
      return user?.avatar;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      let avatarUrl = user?.avatar;
      if (selectedFile) {
        avatarUrl = await uploadAvatar(selectedFile);
      }

      const payload = {
        name: form.name.trim(),
        bio: form.bio.trim(),
        interests: interests,
        mood: form.mood,
        avatar: avatarUrl,
        link: form.link || null,
      };

      const res = await api.put("/users/profile", payload);
      setUser(res.data);

      setSaveSuccess(true);
      hasUnsavedChanges.current = false;

      // Auto redirect after success
      setTimeout(() => {
        window.location.href = "/profile";
      }, 1500);

    } catch (error) {
      console.error(error);
      setErrors({ general: "Failed to update profile. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  // Shimmer Loader
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="flex justify-center">
            <div className="w-36 h-36 bg-zinc-800 rounded-full animate-pulse" />
          </div>
          <div className="space-y-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
                <div className="h-12 bg-zinc-800 rounded-2xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-0">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-zinc-950 border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Edit Profile</span>
          </button>

          <Button
            onClick={handleSave}
            disabled={isSaving || (!hasUnsavedChanges.current && !selectedFile)}
            className="bg-white text-black font-semibold px-6 py-1.5 text-sm rounded-full hover:bg-gray-200 disabled:opacity-60 transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" /> Saved ✓
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-12">
          <div
            onClick={handleAvatarClick}
            className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden cursor-pointer ring-4 ring-zinc-800 hover:ring-zinc-700 transition-all group"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <span className="text-5xl">👋</span>
              </div>
            )}

            <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingAvatar ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <div className="flex flex-col items-center">
                  <Camera className="w-8 h-8 text-white mb-1" />
                  <span className="text-xs">Change</span>
                </div>
              )}
            </div>
          </div>
          <button onClick={handleAvatarClick} className="mt-3 text-blue-500 hover:text-blue-400 text-sm">
            Change profile photo
          </button>
        </div>

        {/* Form */}
        <div className="space-y-10 max-w-2xl mx-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold tracking-widest text-gray-500 mb-1.5">FULL NAME</label>
            {editingField === "name" ? (
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                onBlur={() => toggleEdit("name")}
                autoFocus
                className="w-full bg-transparent border-b border-zinc-700 focus:border-white text-2xl font-semibold py-2.5 focus:outline-none"
                placeholder="Your name"
              />
            ) : (
              <div
                onClick={() => toggleEdit("name")}
                className="text-2xl font-semibold py-3 cursor-pointer border-b border-transparent hover:border-zinc-700 min-h-[52px]"
              >
                {form.name || <span className="text-gray-500">Add your name</span>}
              </div>
            )}
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Bio with Counter */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-semibold tracking-widest text-gray-500">BIO</label>
              <span className={`text-xs ${form.bio.length > 180 ? "text-red-400" : "text-gray-500"}`}>
                {form.bio.length} / 200
              </span>
            </div>
            {editingField === "bio" ? (
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                onBlur={() => toggleEdit("bio")}
                rows={4}
                autoFocus
                maxLength={200}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4 text-base resize-y focus:outline-none focus:border-zinc-600 min-h-[120px]"
                placeholder="Write something about yourself..."
              />
            ) : (
              <div
                onClick={() => toggleEdit("bio")}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 min-h-[120px] cursor-pointer hover:border-zinc-700 text-gray-300 whitespace-pre-wrap"
              >
                {form.bio || <span className="text-gray-500">Add a bio...</span>}
              </div>
            )}
            {errors.bio && <p className="text-red-400 text-sm mt-1">{errors.bio}</p>}
          </div>

          {/* Interests */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold tracking-widest text-gray-500">INTERESTS (Max 5)</label>
              <span className="text-xs text-gray-500">{interests.length}/5</span>
            </div>

            {editingField === "interests" ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {interests.map((interest, index) => (
                    <div key={index} className="flex items-center gap-1 bg-zinc-800 text-white px-4 py-1.5 rounded-3xl text-sm">
                      <span>#{interest}</span>
                      <button onClick={() => removeInterest(interest)} className="text-gray-400 hover:text-red-400">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInterestInput}
                    onChange={(e) => setNewInterestInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3 text-base focus:outline-none focus:border-zinc-600"
                    placeholder="Type interest and press Enter"
                    disabled={interests.length >= 5}
                  />
                  <button
                    onClick={addInterest}
                    disabled={interests.length >= 5}
                    className="px-6 bg-white text-black font-medium rounded-2xl hover:bg-gray-200 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                {interestError && <p className="text-red-400 text-sm mt-2">{interestError}</p>}
                <button onClick={() => toggleEdit("interests")} className="mt-4 text-blue-500 text-sm font-medium">
                  Done
                </button>
              </div>
            ) : (
              <div
                onClick={() => toggleEdit("interests")}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-5 cursor-pointer hover:border-zinc-700 min-h-[68px] flex flex-wrap gap-2"
              >
                {interests.length > 0 ? (
                  interests.map((interest, i) => (
                    <div key={i} className="bg-zinc-800 text-white px-4 py-1.5 rounded-3xl text-sm">#{interest}</div>
                  ))
                ) : (
                  <span className="text-gray-500">Add interests (max 5)</span>
                )}
              </div>
            )}
          </div>

          {/* Link */}
          <div>
            <label className="block text-xs font-semibold tracking-widest text-gray-500 mb-1.5">LINK / WEBSITE</label>
            {editingField === "link" ? (
              <input
                type="url"
                name="link"
                value={form.link}
                onChange={handleChange}
                onBlur={() => toggleEdit("link")}
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3 text-base focus:outline-none focus:border-zinc-600"
                placeholder="https://yourwebsite.com"
              />
            ) : (
              <div
                onClick={() => toggleEdit("link")}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 cursor-pointer hover:border-zinc-700 min-h-[58px] flex items-center text-gray-300 break-all"
              >
                {form.link || <span className="text-gray-500">Add your link (optional)</span>}
              </div>
            )}
            {errors.link && <p className="text-red-400 text-sm mt-1">{errors.link}</p>}
          </div>

          {/* Mood */}
          <div>
            <label className="block text-xs font-semibold tracking-widest text-gray-500 mb-1.5">CURRENT VIBE</label>
            {editingField === "mood" ? (
              <select
                name="mood"
                value={form.mood}
                onChange={handleChange}
                onBlur={() => toggleEdit("mood")}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3.5 text-base focus:outline-none focus:border-zinc-600"
              >
                <option value="social">😄 Social & Outgoing</option>
                <option value="exploring">🌍 Exploring</option>
                <option value="chill">☕ Chill & Relaxed</option>
                <option value="bored">😐 Looking for fun</option>
                <option value="lonely">🤍 Feeling lonely</option>
              </select>
            ) : (
              <div
                onClick={() => toggleEdit("mood")}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 cursor-pointer hover:border-zinc-700 text-gray-300"
              >
                {form.mood === "social" && "😄 Social & Outgoing"}
                {form.mood === "exploring" && "🌍 Exploring"}
                {form.mood === "chill" && "☕ Chill & Relaxed"}
                {form.mood === "bored" && "😐 Looking for fun"}
                {form.mood === "lonely" && "🤍 Feeling lonely"}
              </div>
            )}
          </div>

          {errors.general && <p className="text-red-400 text-center mt-4">{errors.general}</p>}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
}