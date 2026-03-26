import pool from '../config/db.js';

// Activity logging helper
const logActivity = async (entityType, entityId, entityName, action, changes, userId, req) => {
  try {
    const ipAddress = req?.ip || req?.connection?.remoteAddress || 'unknown';
    const userAgent = req?.get?.('user-agent') || '';
    
    await pool.query(
      `INSERT INTO activity_logs (entity_type, entity_id, entity_name, action, changes, performed_by, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entityType,
        entityId,
        entityName,
        action,
        changes ? JSON.stringify(changes) : null,
        userId,
        ipAddress,
        userAgent
      ]
    );
  } catch (err) {
    console.error('Error logging activity:', err.message);
  }
};

// ============= RESOURCE MANAGEMENT =============

export const addHallResource = async (req, res) => {
  try {
    const { hallId, resourceType, resourceName, quantity, condition, notes } = req.body;

    if (!hallId || !resourceType || !resourceName) {
      return res.status(400).json({ error: 'Hall ID, resource type, and resource name are required' });
    }

    // Verify hall exists
    const hallCheck = await pool.query('SELECT id FROM halls WHERE id = $1', [hallId]);
    if (hallCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Hall not found' });
    }

    const { rows } = await pool.query(
      `INSERT INTO hall_resources (hall_id, resource_type, resource_name, quantity, condition, notes, added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [hallId, resourceType, resourceName, quantity || 1, condition || 'good', notes, req.user.id]
    );

    // Log activity
    await logActivity('hall_resource', rows[0].id, resourceName, 'assign_resource', rows[0], req.user.id, req);

    res.status(201).json({ success: true, resource: rows[0] });
  } catch (err) {
    console.error('Error adding hall resource:', err.message);
    res.status(500).json({ error: 'Failed to add resource' });
  }
};

export const getHallResources = async (req, res) => {
  try {
    const { hallId } = req.params;

    const { rows } = await pool.query(
      `SELECT r.*, u.name as added_by_name 
       FROM hall_resources r
       LEFT JOIN users u ON r.added_by = u.id
       WHERE r.hall_id = $1
       ORDER BY r.created_at DESC`,
      [hallId]
    );

    res.json({ success: true, resources: rows });
  } catch (err) {
    console.error('Error fetching hall resources:', err.message);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
};

export const updateHallResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { quantity, condition, notes } = req.body;

    const oldResource = await pool.query('SELECT * FROM hall_resources WHERE id = $1', [resourceId]);
    if (oldResource.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const { rows } = await pool.query(
      `UPDATE hall_resources 
       SET quantity = COALESCE($1, quantity), 
           condition = COALESCE($2, condition), 
           notes = COALESCE($3, notes),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [quantity, condition, notes, resourceId]
    );

    const changes = {
      quantity: { old: oldResource.rows[0].quantity, new: quantity },
      condition: { old: oldResource.rows[0].condition, new: condition },
      notes: { old: oldResource.rows[0].notes, new: notes }
    };

    await logActivity('hall_resource', resourceId, oldResource.rows[0].resource_name, 'update', changes, req.user.id, req);

    res.json({ success: true, resource: rows[0] });
  } catch (err) {
    console.error('Error updating hall resource:', err.message);
    res.status(500).json({ error: 'Failed to update resource' });
  }
};

export const deleteHallResource = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = await pool.query('SELECT * FROM hall_resources WHERE id = $1', [resourceId]);
    if (resource.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await pool.query('DELETE FROM hall_resources WHERE id = $1', [resourceId]);

    await logActivity('hall_resource', resourceId, resource.rows[0].resource_name, 'remove_resource', resource.rows[0], req.user.id, req);

    res.json({ success: true, message: 'Resource deleted' });
  } catch (err) {
    console.error('Error deleting hall resource:', err.message);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
};

// ============= RATING & FEEDBACK SYSTEM =============

export const addHallRating = async (req, res) => {
  try {
    const { hallId, rating, comment, facilityCondition, cleanlinessRating, equipmentWorking } = req.body;

    if (!hallId || !rating) {
      return res.status(400).json({ error: 'Hall ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user already rated this hall recently (within 24 hours)
    const recentRating = await pool.query(
      `SELECT id FROM hall_ratings 
       WHERE hall_id = $1 AND user_id = $2 AND created_at > NOW() - INTERVAL '24 hours'`,
      [hallId, req.user.id]
    );

    if (recentRating.rows.length > 0) {
      return res.status(400).json({ error: 'You have already rated this hall in the last 24 hours' });
    }

    const { rows } = await pool.query(
      `INSERT INTO hall_ratings (hall_id, user_id, rating, comment, facility_condition, cleanliness_rating, equipment_working)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [hallId, req.user.id, rating, comment, facilityCondition, cleanlinessRating, equipmentWorking]
    );

    // Log activity
    await logActivity('hall_rating', rows[0].id, hallId, 'add_rating', rows[0], req.user.id, req);

    res.status(201).json({ success: true, rating: rows[0] });
  } catch (err) {
    console.error('Error adding hall rating:', err.message);
    res.status(500).json({ error: 'Failed to add rating' });
  }
};

export const getHallRatings = async (req, res) => {
  try {
    const { hallId } = req.params;

    const { rows: ratings } = await pool.query(
      `SELECT r.*, u.name as user_name, u.email as user_email
       FROM hall_ratings r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.hall_id = $1
       ORDER BY r.created_at DESC`,
      [hallId]
    );

    // Calculate average ratings
    const avgRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2)
      : 0;

    const avgCleanliness = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + (r.cleanliness_rating || 0), 0) / ratings.length).toFixed(2)
      : 0;

    res.json({ success: true, ratings, avgRating, avgCleanliness, totalRatings: ratings.length });
  } catch (err) {
    console.error('Error fetching hall ratings:', err.message);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
};

export const getHallStats = async (req, res) => {
  try {
    const { hallId } = req.params;

    const { rows: ratings } = await pool.query(
      `SELECT rating, cleanliness_rating, equipment_working FROM hall_ratings WHERE hall_id = $1`,
      [hallId]
    );

    const { rows: resourceStats } = await pool.query(
      `SELECT condition, COUNT(*) as count FROM hall_resources WHERE hall_id = $1 GROUP BY condition`,
      [hallId]
    );

    const stats = {
      totalRatings: ratings.length,
      avgOverallRating: ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2) : 0,
      avgCleanliness: ratings.length > 0 ? (ratings.reduce((sum, r) => sum + (r.cleanliness_rating || 0), 0) / ratings.length).toFixed(2) : 0,
      equipmentWorkingPercentage: ratings.length > 0 ? (ratings.filter(r => r.equipment_working).length / ratings.length * 100).toFixed(0) : 0,
      resourcesByCondition: resourceStats.reduce((acc, stat) => {
        acc[stat.condition] = stat.count;
        return acc;
      }, {})
    };

    res.json({ success: true, stats });
  } catch (err) {
    console.error('Error fetching hall stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// ============= ACTIVITY LOG =============

export const getActivityLogs = async (req, res) => {
  try {
    const { entityType, entityId, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT l.*, u.name as performed_by_name FROM activity_logs l LEFT JOIN users u ON l.performed_by = u.id WHERE 1=1';
    const params = [];

    if (entityType) {
      query += ` AND l.entity_type = $${params.length + 1}`;
      params.push(entityType);
    }

    if (entityId) {
      query += ` AND l.entity_id = $${params.length + 1}`;
      params.push(entityId);
    }

    query += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    res.json({ success: true, logs: rows });
  } catch (err) {
    console.error('Error fetching activity logs:', err.message);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};

export const getHallActivityLogs = async (req, res) => {
  try {
    const { hallId } = req.params;

    const { rows } = await pool.query(
      `SELECT l.*, u.name as performed_by_name 
       FROM activity_logs l
       LEFT JOIN users u ON l.performed_by = u.id
       WHERE l.entity_id = $1 OR l.entity_type = 'hall_resource' OR l.entity_type = 'hall_rating'
       ORDER BY l.created_at DESC
       LIMIT 100`,
      [hallId]
    );

    res.json({ success: true, logs: rows });
  } catch (err) {
    console.error('Error fetching hall activity logs:', err.message);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
};

// ============= SMART RECOMMENDATIONS =============

export const getHallRecommendations = async (req, res) => {
  try {
    const { moduleId, batchSize, requiredResources } = req.query;

    if (!moduleId) {
      return res.status(400).json({ error: 'Module ID is required' });
    }

    // Fetch module details
    const { rows: modules } = await pool.query(
      'SELECT batch_size FROM modules WHERE id = $1',
      [moduleId]
    );

    if (modules.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const moduleBatchSize = batchSize || modules[0].batch_size || 30;
    const requiredResourcesList = requiredResources ? JSON.parse(requiredResources) : [];

    // Fetch all halls with their resources
    const { rows: halls } = await pool.query(
      `SELECT h.*, 
       (SELECT json_agg(row_to_json(r)) FROM hall_resources r WHERE r.hall_id = h.id) as resources
       FROM halls h
       ORDER BY h.name`
    );

    // Score and rank halls
    const recommendations = halls.map(hall => {
      let score = 0;
      const matchingResources = [];
      const missingResources = [];

      // Capacity match (max 40 points)
      const capacityScore = Math.min(40, (moduleBatchSize / (hall.capacity || 1)) * 40);
      score += capacityScore;

      // Resource matching (max 60 points)
      const hallResources = hall.resources || [];
      const hallResourceNames = hallResources.map(r => r.resource_type?.toLowerCase());

      requiredResourcesList.forEach(resource => {
        const resourceLower = resource.toLowerCase();
        if (hallResourceNames.includes(resourceLower)) {
          matchingResources.push(resource);
          score += 10;
        } else {
          missingResources.push(resource);
        }
      });

      // Equipment condition bonus
      const goodConditionCount = hallResources.filter(r => r.condition === 'excellent' || r.condition === 'good').length;
      const conditionBonus = (goodConditionCount / Math.max(hallResources.length, 1)) * 20;
      score = Math.min(100, score + conditionBonus);

      return {
        hallId: hall.id,
        hallName: hall.name,
        capacity: hall.capacity,
        score: parseFloat(score.toFixed(2)),
        matchingResources,
        missingResources,
        totalResources: hallResources.length,
        goodConditionResources: goodConditionCount
      };
    });

    // Sort by score descending
    recommendations.sort((a, b) => b.score - a.score);

    // Return top recommendations
    const topRecommendations = recommendations.slice(0, 5);

    // Cache recommendations if provided
    if (moduleId) {
      try {
        for (const recommendation of topRecommendations) {
          await pool.query(
            `INSERT INTO hall_recommendations (for_module_id, batch_size, recommended_hall_id, score, matching_resources, missing_resources, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '7 days')
             ON CONFLICT (for_module_id, recommended_hall_id) DO UPDATE SET
               score = EXCLUDED.score,
               matching_resources = EXCLUDED.matching_resources,
               missing_resources = EXCLUDED.missing_resources,
               expires_at = NOW() + INTERVAL '7 days'`,
            [
              moduleId,
              moduleBatchSize,
              recommendation.hallId,
              recommendation.score,
              JSON.stringify(recommendation.matchingResources),
              JSON.stringify(recommendation.missingResources)
            ]
          );
        }
      } catch (cacheErr) {
        console.error('Error caching recommendations:', cacheErr.message);
      }
    }

    res.json({ success: true, recommendations: topRecommendations });
  } catch (err) {
    console.error('Error getting hall recommendations:', err.message);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
};

export const getCachedRecommendations = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const { rows } = await pool.query(
      `SELECT r.*, h.name as hall_name, h.capacity 
       FROM hall_recommendations r
       JOIN halls h ON r.recommended_hall_id = h.id
       WHERE r.for_module_id = $1 AND r.expires_at > NOW()
       ORDER BY r.score DESC`,
      [moduleId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No cached recommendations found' });
    }

    res.json({ success: true, recommendations: rows });
  } catch (err) {
    console.error('Error fetching cached recommendations:', err.message);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
};
