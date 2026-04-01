import React, { useState, useCallback, useEffect } from 'react';

const HallRatingsPanel = ({ hallId, apiBase }) => {
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState(null);
  const [showAddRating, setShowAddRating] = useState(false);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (hallId) {
      loadRatings();
      loadStats();
    }
  }, [hallId, loadRatings, loadStats]);

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
          <span key={i} className={i < value ? 'text-yellow-400 text-lg' : 'text-gray-300 text-lg'}>★</span>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-800">⭐ Hall Ratings & Feedback</h4>
        <button
          onClick={() => setShowAddRating(!showAddRating)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showAddRating ? 'Cancel' : '+ Add Rating'}
        </button>
      </div>

      {toast && (
        <div className={`mb-3 p-2 rounded text-sm ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {toast.message}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="mb-4 grid grid-cols-4 gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.avgOverallRating}</div>
            <div className="text-xs text-slate-600">Avg Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.avgCleanliness}</div>
            <div className="text-xs text-slate-600">Cleanliness</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.equipmentWorkingPercentage}%</div>
            <div className="text-xs text-slate-600">Equipment OK</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-600">{stats.totalRatings}</div>
            <div className="text-xs text-slate-600">Total Ratings</div>
          </div>
        </div>
      )}

      {showAddRating && (
        <form onSubmit={handleAddRating} className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="mb-3">
            <label className="text-xs font-medium">Overall Rating</label>
            <div className="mt-1 flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                  className="text-2xl hover:scale-125 transition"
                >
                  {star <= ratingForm.rating ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-xs font-medium">Cleanliness Rating</label>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingForm({ ...ratingForm, cleanlinessRating: star })}
                    className="text-lg hover:scale-110 transition"
                  >
                    {star <= ratingForm.cleanlinessRating ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Facility Condition</label>
              <select
                value={ratingForm.facilityCondition}
                onChange={(e) => setRatingForm({ ...ratingForm, facilityCondition: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm mt-1"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium flex items-center gap-2">
              <input
                type="checkbox"
                checked={ratingForm.equipmentWorking}
                onChange={(e) => setRatingForm({ ...ratingForm, equipmentWorking: e.target.checked })}
                className="rounded"
              />
              Equipment is working properly
            </label>
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium">Comment</label>
            <textarea
              value={ratingForm.comment}
              onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
              placeholder="Share your feedback about this hall..."
              className="w-full border rounded px-2 py-1 text-sm mt-1 resize-none h-20"
            />
          </div>

          <button type="submit" className="w-full px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
            Submit Rating
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-600">Loading ratings...</p>
      ) : ratings.length === 0 ? (
        <p className="text-sm text-slate-500">No ratings yet. Be the first to rate this hall!</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {ratings.map(rating => (
            <div key={rating.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium text-slate-800 text-sm">{rating.user_name || 'Anonymous'}</div>
                <div className="text-xs text-slate-600">{new Date(rating.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-1 mb-1">{renderStars(rating.rating)}</div>
              {rating.comment && (
                <p className="text-sm text-slate-700 mb-1">{rating.comment}</p>
              )}
              <div className="text-xs text-slate-600 space-y-0.5">
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
