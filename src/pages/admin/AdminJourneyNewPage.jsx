import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { createAdminJourney } from '@/api/admin/adminJourneys';

const EXAM_TYPES = ['AP', 'SAT', 'IB', 'general', 'custom'];

export default function AdminJourneyNewPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject: '',
    examType: 'AP',
    difficultyLevel: '',
    shortDescription: '',
    longDescription: '',
    targetAudience: '',
    estimatedStudyHours: '',
    coverColor: '#18181b',
    tags: 'AP',
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.subject.trim()) {
      toast.error('Title and subject are required.');
      return;
    }
    setLoading(true);
    try {
      const { journeyId } = await createAdminJourney({
        ...form,
        estimatedStudyHours: form.estimatedStudyHours ? Number(form.estimatedStudyHours) : null,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      toast.success('Journey created');
      navigate(`/admin/journeys/${journeyId}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create journey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-journeys-page">
      <header className="admin-dashboard-header">
        <div>
          <Link to="/admin/journeys" className="admin-back-link">← Admin journeys</Link>
          <h1 className="admin-dashboard-title">New certified journey</h1>
        </div>
      </header>

      <form className="admin-journey-form detail-section-box" onSubmit={handleSubmit}>
        <label className="settings-field">
          <span className="settings-label">Title</span>
          <input className="settings-input" value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </label>
        <label className="settings-field">
          <span className="settings-label">Subject</span>
          <input className="settings-input" value={form.subject} onChange={(e) => set('subject', e.target.value)} required />
        </label>
        <label className="settings-field">
          <span className="settings-label">Exam type</span>
          <select className="settings-input" value={form.examType} onChange={(e) => set('examType', e.target.value)}>
            {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="settings-field">
          <span className="settings-label">Difficulty level</span>
          <input className="settings-input" value={form.difficultyLevel} onChange={(e) => set('difficultyLevel', e.target.value)} />
        </label>
        <label className="settings-field">
          <span className="settings-label">Short description (library card)</span>
          <textarea className="settings-input" rows={2} value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} />
        </label>
        <label className="settings-field">
          <span className="settings-label">Long description (detail page)</span>
          <textarea className="settings-input" rows={4} value={form.longDescription} onChange={(e) => set('longDescription', e.target.value)} />
        </label>
        <label className="settings-field">
          <span className="settings-label">Target audience</span>
          <input className="settings-input" value={form.targetAudience} onChange={(e) => set('targetAudience', e.target.value)} />
        </label>
        <label className="settings-field">
          <span className="settings-label">Estimated study hours</span>
          <input type="number" min={1} className="settings-input" value={form.estimatedStudyHours} onChange={(e) => set('estimatedStudyHours', e.target.value)} />
        </label>
        <label className="settings-field">
          <span className="settings-label">Cover color</span>
          <input type="color" value={form.coverColor} onChange={(e) => set('coverColor', e.target.value)} />
        </label>
        <label className="settings-field">
          <span className="settings-label">Tags (comma-separated)</span>
          <input className="settings-input" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating…' : 'Create draft journey'}
        </button>
      </form>
    </div>
  );
}
