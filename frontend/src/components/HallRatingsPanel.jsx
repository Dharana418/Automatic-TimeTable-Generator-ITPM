import React, { useState, useCallback, useEffect } from 'react';

const HallRatingsPanel = ({ hallId, apiBase }) => {
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState(null);
  const [showAddRating, setShowAddRating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasLoadedRatings, setHasLoadedRatings] = useState(false);
  const [hasActivityLogs, setHasActivityLogs] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    comment: '',
    facilityCondition: 'good',
    cleanlinessRating: 5,
    equipmentWorking: true
  });
  const [toast, setToast] = useState(null);

  const loadRatings = useCallback(async () => {
    try {
      setLoading(true);
      setHasLoadedRatings(false);
      const res = await fetch(`${apiBase}/api/halls/${hallId}/ratings`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setRatings(data.ratings || []);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
      setHasLoadedRatings(true);
    }
  }, [hallId, apiBase]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/halls/${hallId}/stats`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [hallId, apiBase]);

  const loadActivityLogPresence = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/halls/${hallId}/logs`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        const activityCount = Array.isArray(data.logs) ? data.logs.length : 0;
        setHasActivityLogs(activityCount > 0);
      }
    } catch (error) {
      console.error('Error loading activity logs for ratings view:', error);
      setHasActivityLogs(false);
    }
  }, [hallId, apiBase]);

  useEffect(() => {
    if (hallId) {
      loadRatings();
      loadStats();
      loadActivityLogPresence();
    }
  }, [hallId, loadRatings, loadStats, loadActivityLogPresence]);

  const handleAddRating = async (e) => {
    e.preventDefault();
    const rating = Number(ratingForm.rating);
    const cleanlinessRating = Number(ratingForm.cleanlinessRating);
    const comment = String(ratingForm.comment || '').trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setToast({ message: 'Overall rating must be between 1 and 5', type: 'error' });
      return;
    }

    if (!Number.isInteger(cleanlinessRating) || cleanlinessRating < 1 || cleanlinessRating > 5) {
      setToast({ message: 'Cleanliness rating must be between 1 and 5', type: 'error' });
      return;
    }

    if (comment.length > 1000) {
      setToast({ message: 'Comment cannot exceed 1000 characters', type: 'error' });
      return;
    }

    try {
      const res = await fetch(`${apiBase}/api/halls/ratings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hallId,
          ...ratingForm,
          rating,
          cleanlinessRating,
          comment
        })
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: 'Rating submitted successfully', type: 'success' });
        loadRatings();
        loadStats();
        setRatingForm({ rating: 5, comment: '', facilityCondition: 'good', cleanlinessRating: 5, equipmentWorking: true });
        setShowAddRating(false);
      } else {
        setToast({ message: data.error || 'Failed to submit rating', type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      setToast({ message: 'Error submitting rating', type: 'error' });
    }
  };

  const renderStars = (value, max = 5) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(max)].map((_, i) => (
          <span key={i} className={i < value ? 'text-amber-300 text-lg' : 'text-slate-600 text-lg'}>★</span>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/90 p-4 text-slate-100 shadow-[0_12px_28px_rgba(2,6,23,0.4)]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-cyan-100">⭐ Hall Ratings & Feedback</h4>
        <button
          onClick={() => setShowAddRating(!showAddRating)}
          className="rounded-lg border border-cyan-500/60 bg-cyan-800/70 px-3 py-1 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-700/80"
        >
          {showAddRating ? 'Cancel' : '+ Add Rating'}
        </button>
      </div>

      {toast && (
        <div className={`mb-3 rounded-lg border p-2 text-sm ${toast.type === 'success' ? 'border-emerald-500/60 bg-emerald-950/70 text-emerald-200' : 'border-rose-500/60 bg-rose-950/70 text-rose-200'}`}>
          {toast.message}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-slate-700 bg-gradient-to-r from-slate-950 to-cyan-950/40 p-3 sm:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-300">{stats.avgOverallRating}</div>
            <div className="text-xs text-slate-300">Avg Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-300">{stats.avgCleanliness}</div>
            <div className="text-xs text-slate-300">Cleanliness</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-violet-300">{stats.equipmentWorkingPercentage}%</div>
            <div className="text-xs text-slate-300">Equipment OK</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-200">{stats.totalRatings}</div>
            <div className="text-xs text-slate-300">Total Ratings</div>
          </div>
        </div>
      )}

      {showAddRating && (
        <form onSubmit={handleAddRating} className="mb-4 rounded-lg border border-slate-700 bg-slate-950/70 p-3">
          <div className="mb-3">
            <label className="text-xs font-medium text-slate-200">Overall Rating</label>
            <div className="mt-1 flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                  className={`text-2xl transition hover:scale-125 ${star <= ratingForm.rating ? 'text-amber-300' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  {star <= ratingForm.rating ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-xs font-medium text-slate-200">Cleanliness Rating</label>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingForm({ ...ratingForm, cleanlinessRating: star })}
                    className={`text-lg transition hover:scale-110 ${star <= ratingForm.cleanlinessRating ? 'text-amber-300' : 'text-slate-600 hover:text-slate-400'}`}
                  >
                    {star <= ratingForm.cleanlinessRating ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-200">Facility Condition</label>
              <select
                value={ratingForm.facilityCondition}
                onChange={(e) => setRatingForm({ ...ratingForm, facilityCondition: e.target.value })}
                className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-200">
              <input
                type="checkbox"
                checked={ratingForm.equipmentWorking}
                onChange={(e) => setRatingForm({ ...ratingForm, equipmentWorking: e.target.checked })}
                className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-cyan-500"
              />
              Equipment is working properly
            </label>
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium text-slate-200">Comment</label>
            <textarea
              value={ratingForm.comment}
              onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
              placeholder="Share your feedback about this hall..."
              className="mt-1 h-20 w-full resize-none rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100 placeholder:text-slate-400"
            />
          </div>

          <button type="submit" className="w-full rounded border border-emerald-500/60 bg-emerald-900/70 px-2 py-1 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-800/80">
            Submit Rating
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-300">Loading ratings...</p>
      ) : hasLoadedRatings && ratings.length === 0 && !hasActivityLogs ? (
        <p className="text-sm text-slate-400">No ratings yet. Be the first to rate this hall!</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {ratings.map(rating => (
            <div key={rating.id} className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
              <div className="flex justify-between items-start mb-1">
                <div className="text-sm font-medium text-slate-100">{rating.user_name || 'Anonymous'}</div>
                <div className="text-xs text-slate-400">{new Date(rating.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-1 mb-1">{renderStars(rating.rating)}</div>
              {rating.comment && (
                <p className="mb-1 text-sm text-slate-200">{rating.comment}</p>
              )}
              <div className="space-y-0.5 text-xs text-slate-300">
                {rating.cleanliness_rating && <div>Cleanliness: {renderStars(rating.cleanliness_rating)}</div>}
                <div>Facility: <span className="capitalize">{rating.facility_condition || 'N/A'}</span></div>
                <div>Equipment: {rating.equipment_working ? '✓ Working' : '✗ Not Working'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HallRatingsPanel;
