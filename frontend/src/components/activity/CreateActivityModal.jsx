import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, MapPin, Upload, ChevronLeft, ChevronRight, Eye, Hash, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import api from '../../lib/api';

const COLORS = {
  bg: '#f8f7f4',
  surface: '#ffffff',
  surface2: '#f0ede8',
  accent: '#4a9c6e',
  accent2: '#6ab8a0',
  muted: '#8a8580',
  border: '#e4e0da',
  text: '#1f2a44',
  error: '#e53e3e',
};

const MAX_TITLE = 50;
const MAX_DESC = 200;
const MAX_TAGS = 5;
const MIN_TITLE = 1;

const TAG_SUGGESTIONS = {
  run: ['running', 'run5k', 'runclub'],
  fit: ['fitness', 'fitlife', 'fitfam'],
  yoga: ['yoga', 'yogalife', 'morningyoga'],
  hik: ['hiking', 'hikelife', 'trailhike'],
  cycl: ['cycling', 'cycling101'],
  swim: ['swimming', 'swimclub'],
  gym: ['gym', 'gymlife', 'gymrat'],
  sport: ['sports', 'sportlife'],
  dance: ['dance', 'dancing', 'dancefit'],
  meditat: ['meditation', 'mindfulness'],
  trek: ['trekking', 'trek'],
  natur: ['nature', 'naturelover'],
  food: ['foodie', 'foodwalk'],
  photo: ['photography', 'photowalks'],
  book: ['bookclub', 'reading'],
  music: ['music', 'musiclover'],
  art: ['art', 'artwork', 'artclub'],
  travel: ['travel', 'traveldiaries'],
  coffee: ['coffee', 'coffeewalk'],
  morning: ['morningwalk', 'morningroutine'],
};

function getSuggestions(input) {
  if (!input || input.length < 2) return [];
  const clean = input.replace(/^#/, '').toLowerCase();
  const results = new Set();
  for (const [key, vals] of Object.entries(TAG_SUGGESTIONS)) {
    if (clean.startsWith(key) || key.startsWith(clean)) {
      vals.forEach((v) => results.add(v));
    }
  }
  return [...results].slice(0, 5);
}

function StepPane({ active, direction, children }) {
  return (
    <div
      style={{
        transition: 'opacity 0.22s ease, transform 0.22s ease',
        opacity: active ? 1 : 0,
        transform: active ? 'translateX(0)' : `translateX(${direction === 'forward' ? '24px' : '-24px'})`,
        pointerEvents: active ? 'auto' : 'none',
        position: active ? 'relative' : 'absolute',
        width: '100%',
        top: 0,
        left: 0,
      }}
    >
      {children}
    </div>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-1 mt-1.5" style={{ color: COLORS.error }}>
      <AlertCircle size={13} />
      <span className="text-xs">{msg}</span>
    </div>
  );
}

export default function CreateActivityModal({ isOpen, onClose, onActivityCreated }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('forward');
  const [form, setForm] = useState({ title: '', description: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [location, setLocation] = useState({ label: 'Delhi, India', lat: 28.6139, lng: 77.209 });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [unsavedWarning, setUnsavedWarning] = useState(false);

  const titleRef = useRef(null);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const tagInputRef = useRef(null);

  const hasUnsaved = form.title.trim() || form.description.trim() || tags.length > 0 || imageFile;

  // Auto-focus title
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ESC Key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        hasUnsaved ? setUnsavedWarning(true) : onClose();
      }
      if (e.key === 'Enter' && step === 1 && e.target.tagName !== 'TEXTAREA' && e.target !== tagInputRef.current) {
        e.preventDefault();
        handleNext();
      }
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, hasUnsaved, step]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        hasUnsaved ? setUnsavedWarning(true) : onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, hasUnsaved, onClose]);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Tag suggestions
  useEffect(() => {
    setTagSuggestions(getSuggestions(tagInput));
  }, [tagInput]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'Your Location';
          const country = data.address?.country || '';
          setLocation({
            label: `${city}, ${country}`.trim().replace(/,$/, ''),
            lat,
            lng,
          });
          toast.success("Location detected successfully!");
        } catch {
          setLocation({ label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng });
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        toast.error("Failed to detect location");
        setDetectingLocation(false);
      }
    );
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      return;
    }

    setImageUploading(true);
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setImageFile(file);

    setTimeout(() => setImageUploading(false), 600);
  };

  const removeImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addTag = (value) => {
    let input = (value || tagInput).trim().replace(/^#/, '').trim();
    if (!input || tags.length >= MAX_TAGS) return;
    if (!tags.includes(input)) {
      setTags([...tags, input]);
    }
    setTagInput('');
    setTagSuggestions([]);
    tagInputRef.current?.focus();
  };

  const removeTag = (i) => setTags(tags.filter((_, idx) => idx !== i));

  const validateStep1 = () => {
    const errs = {};
    if (!form.title.trim() || form.title.trim().length < MIN_TITLE) {
      errs.title = "Title is required";
    }
    if (form.title.length > MAX_TITLE) {
      errs.title = `Title must be under ${MAX_TITLE} characters`;
    }
    if (form.description.length > MAX_DESC) {
      errs.description = `Description must be under ${MAX_DESC} characters`;
    }
    return errs;
  };

  const handleNext = () => {
    if (step === 1) {
      const errs = validateStep1();
      setFieldErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setDirection('forward');
      setStep(2);
    } else if (step === 2) {
      setDirection('forward');
      setStep(3);
    }
  };

  const handlePrev = () => {
    setDirection('backward');
    setStep((s) => s - 1);
  };

  const resetForm = () => {
    setForm({ title: '', description: '' });
    setTags([]);
    setTagInput('');
    setImageFile(null);
    setPreviewUrl(null);
    setStep(1);
    setFieldErrors({});
    setLocation({ label: 'Delhi, India', lat: 28.6139, lng: 77.209 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('time', new Date().toISOString());
      formData.append('interests', JSON.stringify(tags));
      formData.append('location', JSON.stringify({ lat: location.lat, lng: location.lng }));

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const { data } = await api.post('/activities', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success("Vibe created successfully! 🎉");
      onActivityCreated(data);
      onClose();
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create vibe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const step1Valid = form.title.trim().length >= MIN_TITLE && form.title.length <= MAX_TITLE;

  return (
    <>
      <Toaster position="top-center" richColors closeButton />

      {/* Unsaved Warning */}
      {unsavedWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.text }}>
              Discard changes?
            </h3>
            <p className="text-sm mb-6" style={{ color: COLORS.muted }}>
              You have unsaved changes. If you leave now, your vibe draft will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setUnsavedWarning(false)}
                className="flex-1 py-3 rounded-2xl border font-medium text-sm transition hover:bg-gray-50"
                style={{ borderColor: COLORS.border, color: COLORS.text }}
              >
                Keep editing
              </button>
              <button
                onClick={() => {
                  setUnsavedWarning(false);
                  onClose();
                  resetForm();
                }}
                className="flex-1 py-3 rounded-2xl font-medium text-sm text-white transition"
                style={{ backgroundColor: COLORS.error }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div
          ref={modalRef}
          className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
          style={{ backgroundColor: COLORS.surface, maxHeight: '95vh', overflowY: 'auto' }}
        >
          {/* Header */}
          <div
            className="px-6 py-5 border-b flex items-center justify-between sticky top-0 bg-white z-10"
            style={{ borderColor: COLORS.border }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: COLORS.surface2 }}>
                <Sparkles className="w-5 h-5" style={{ color: COLORS.accent }} />
              </div>
              <div>
                <h2 className="text-xl font-semibold leading-tight" style={{ color: COLORS.text }}>
                  Create New Vibe
                </h2>
                <p className="text-xs" style={{ color: COLORS.muted }}>
                  Step {step} of 3 — {step === 1 ? 'Details' : step === 2 ? 'Photo & Location' : 'Preview'}
                </p>
              </div>
            </div>
            <button
              onClick={() => (hasUnsaved ? setUnsavedWarning(true) : onClose())}
              className="p-2 rounded-full hover:bg-gray-100 transition"
              style={{ color: COLORS.muted }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-8 pt-5 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ backgroundColor: s <= step ? COLORS.accent : '#e5e7eb' }}
              />
            ))}
          </div>

          <div className="p-8 relative" style={{ minHeight: 340 }}>
            {/* STEP 1: Details */}
            <StepPane active={step === 1} direction={direction}>
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium" style={{ color: COLORS.muted }}>Vibe Title</label>
                    <span className="text-xs" style={{ color: form.title.length > MAX_TITLE ? COLORS.error : COLORS.muted }}>
                      {form.title.length}/{MAX_TITLE}
                    </span>
                  </div>
                  <input
                    ref={titleRef}
                    type="text"
                    placeholder="Morning Trail Run in Lodhi Garden"
                    value={form.title}
                    maxLength={MAX_TITLE + 5}
                    onChange={(e) => {
                      setForm({ ...form, title: e.target.value });
                      if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: '' });
                    }}
                    className="w-full px-4 py-3.5 rounded-2xl border focus:outline-none text-base transition"
                    style={{
                      backgroundColor: COLORS.surface2,
                      borderColor: fieldErrors.title ? COLORS.error : COLORS.border,
                      color: COLORS.text,
                    }}
                  />
                  <FieldError msg={fieldErrors.title} />
                </div>

                {/* Description */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium" style={{ color: COLORS.muted }}>Description</label>
                    <span className="text-xs" style={{ color: form.description.length > MAX_DESC ? COLORS.error : COLORS.muted }}>
                      {form.description.length}/{MAX_DESC}
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Tell everyone what this vibe is about..."
                    value={form.description}
                    maxLength={MAX_DESC + 10}
                    onChange={(e) => {
                      setForm({ ...form, description: e.target.value });
                      if (fieldErrors.description) setFieldErrors({ ...fieldErrors, description: '' });
                    }}
                    className="w-full px-4 py-3.5 rounded-2xl border focus:outline-none resize-none transition"
                    style={{
                      backgroundColor: COLORS.surface2,
                      borderColor: fieldErrors.description ? COLORS.error : COLORS.border,
                      color: COLORS.text,
                    }}
                  />
                  <FieldError msg={fieldErrors.description} />
                </div>

                {/* Tags */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium" style={{ color: COLORS.muted }}>Interests / Tags</label>
                    <span className="text-xs" style={{ color: tags.length >= MAX_TAGS ? COLORS.error : COLORS.muted }}>
                      {tags.length}/{MAX_TAGS}
                    </span>
                  </div>
                  <div
                    className="border rounded-3xl px-4 py-3 min-h-[56px] flex flex-wrap gap-2 items-center"
                    style={{ backgroundColor: COLORS.surface2, borderColor: COLORS.border }}
                  >
                    {tags.map((tag, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1 px-3 h-8 rounded-full text-sm font-medium border"
                        style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.text }}
                      >
                        <span style={{ color: COLORS.accent }}>#</span>
                        <span>{tag}</span>
                        <button type="button" onClick={() => removeTag(i)} className="ml-1 text-gray-400 hover:text-red-500">
                          <X size={13} />
                        </button>
                      </div>
                    ))}

                    {tags.length < MAX_TAGS && (
                      <input
                        ref={tagInputRef}
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addTag();
                          }
                          if (e.key === 'Backspace' && !tagInput && tags.length) removeTag(tags.length - 1);
                        }}
                        placeholder={tags.length === 0 ? '#running #fitness' : ''}
                        className="flex-1 bg-transparent outline-none text-sm min-w-[120px]"
                        style={{ color: COLORS.text }}
                      />
                    )}
                  </div>

                  {tagSuggestions.length > 0 && tags.length < MAX_TAGS && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tagSuggestions.filter((s) => !tags.includes(s)).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => addTag(s)}
                          className="flex items-center gap-1 px-3 py-1 rounded-full text-xs border transition hover:bg-emerald-50"
                          style={{ borderColor: COLORS.accent, color: COLORS.accent }}
                        >
                          <Hash size={10} />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs mt-1.5" style={{ color: COLORS.muted }}>
                    Type with # and press Enter or comma • Max {MAX_TAGS} tags
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={!step1Valid}
                className="w-full mt-8 py-4 text-base font-medium rounded-2xl transition active:scale-[0.985] disabled:opacity-40"
                style={{ backgroundColor: COLORS.accent, color: '#fff' }}
              >
                Continue <ChevronRight className="inline ml-2" size={20} />
              </button>
            </StepPane>

            {/* STEP 2: Photo + Location */}
            <StepPane active={step === 2} direction={direction}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.muted }}>
                    Activity Photo <span style={{ color: COLORS.muted }}>(optional)</span>
                  </label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

                  {previewUrl ? (
                    <div className="relative group rounded-3xl overflow-hidden border shadow-sm" style={{ borderColor: COLORS.border }}>
                      {imageUploading ? (
                        <div className="w-full aspect-video bg-gray-100 animate-pulse flex items-center justify-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-9 h-9 border-4 border-gray-300 border-t-[#4a9c6e] rounded-full animate-spin" />
                            <p className="text-sm text-gray-500">Processing photo...</p>
                          </div>
                        </div>
                      ) : (
                        <img src={previewUrl} alt="Preview" className="w-full aspect-video object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-4 right-4 bg-black/70 text-white p-2.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed rounded-3xl h-56 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all"
                      style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface2 }}
                    >
                      <Upload className="w-10 h-10 mb-3" style={{ color: COLORS.muted }} />
                      <p className="font-semibold text-base" style={{ color: COLORS.text }}>Upload a photo</p>
                      <p className="text-sm mt-1" style={{ color: COLORS.muted }}>JPG or PNG • Recommended 1080×720</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: COLORS.muted }}>Location</label>
                  <div
                    className="flex items-center justify-between p-4 rounded-2xl border"
                    style={{ backgroundColor: COLORS.surface2, borderColor: COLORS.border }}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: COLORS.accent }} />
                      <div>
                        <p className="font-medium text-sm" style={{ color: COLORS.text }}>{location.label}</p>
                        <p className="text-xs" style={{ color: COLORS.muted }}>
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={detectingLocation}
                      className="text-xs px-3 py-1.5 rounded-full font-medium transition"
                      style={{ backgroundColor: COLORS.accent + '18', color: COLORS.accent }}
                    >
                      {detectingLocation ? 'Detecting...' : 'Detect'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex-1 py-4 rounded-2xl font-medium border transition hover:bg-gray-50"
                  style={{ borderColor: COLORS.border, color: COLORS.text }}
                >
                  <ChevronLeft className="inline mr-1" size={18} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={imageUploading}
                  className="flex-1 py-4 text-base font-medium rounded-2xl transition active:scale-[0.985] disabled:opacity-40"
                  style={{ backgroundColor: COLORS.accent, color: '#fff' }}
                >
                  Preview <Eye className="inline ml-2" size={18} />
                </button>
              </div>
            </StepPane>

            {/* STEP 3: Preview */}
            <StepPane active={step === 3} direction={direction}>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: COLORS.muted }}>Preview</h3>

                <div className="rounded-3xl overflow-hidden border shadow-sm" style={{ borderColor: COLORS.border }}>
                  {previewUrl && (
                    <img src={previewUrl} alt="Preview" className="w-full aspect-video object-cover" />
                  )}
                  <div className="p-5">
                    <h4 className="text-lg font-bold mb-1" style={{ color: COLORS.text }}>{form.title}</h4>
                    <p className="text-sm mb-3 leading-relaxed" style={{ color: COLORS.muted }}>{form.description}</p>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map((t, i) => (
                          <span
                            key={i}
                            className="text-xs px-3 py-1 rounded-full border"
                            style={{ borderColor: COLORS.border, color: COLORS.accent, backgroundColor: COLORS.surface2 }}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2" style={{ color: COLORS.muted }}>
                      <MapPin size={13} />
                      <span className="text-xs">{location.label}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-center" style={{ color: COLORS.muted }}>
                  Looks good? Hit "Create Vibe" to publish!
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex-1 py-4 rounded-2xl font-medium border transition hover:bg-gray-50"
                  style={{ borderColor: COLORS.border, color: COLORS.text }}
                >
                  <ChevronLeft className="inline mr-1" size={18} /> Edit
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-4 text-base font-medium rounded-2xl transition active:scale-[0.985] disabled:opacity-50"
                  style={{ backgroundColor: COLORS.accent, color: '#fff' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span>🎉 Create Vibe</span>
                  )}
                </button>
              </div>
            </StepPane>
          </div>
        </div>
      </div>
    </>
  );
}