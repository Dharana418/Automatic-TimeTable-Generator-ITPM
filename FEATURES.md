# New Hall Management Features

This document describes the four new functionalities added to the Automatic TimeTable Generator for enhanced hall management.

## Overview

The following features have been implemented to improve hall resource management, feedback collection, activity tracking, and intelligent hall allocation:

1. **Assign Resources to Halls** - Equipment and Furniture Inventory Management
2. **Rating/Comments System** - Feedback on Hall Condition
3. **Activity Log** - Edit/Delete History Tracking
4. **Smart Recommendations** - Intelligent Hall Suggestions Based on Requirements

---

## 1. Assign Resources to Halls (Equipment & Furniture Inventory)

### Features
- Add equipment and furniture items to each hall
- Track resource condition (excellent, good, fair, poor)
- Maintain quantity information for each resource
- Add detailed notes about resources
- Delete resources when no longer needed

### How to Use

#### Adding Resources
1. Open the Hall Details panel by clicking the **📋 Details** button on any hall card
2. Scroll to the **📦 Hall Resources** section
3. Click **+ Add Resource** button
4. Fill in the form:
   - **Type**: Select resource category (Equipment, Furniture, Technology, Supplies)
   - **Name**: Name of the resource (e.g., "Projector", "Chairs", "Whiteboard")
   - **Quantity**: Number of items (default: 1)
   - **Condition**: Current condition level
   - **Notes**: Additional information (optional)
5. Click **Add Resource** to save

#### Viewing Resources
- Resources appear as a list below the form
- Each resource shows the type, quantity, condition, and notes
- Color-coded condition badges:
  - 🟢 **Excellent** (Green)
  - 🔵 **Good** (Blue)
  - 🟡 **Fair** (Yellow)
  - 🔴 **Poor** (Red)

#### Deleting Resources
- Click the **Delete** button next to any resource to remove it
- Confirmation is optional for quick deletion

### Database Storage
- **Table**: `hall_resources`
- **Columns**: id, hall_id, resource_type, resource_name, quantity, condition, notes, added_by, created_at, updated_at
- **Indexed** for fast queries on hall_id and resource_type

---

## 2. Rating & Comments System (Feedback on Hall Condition)

### Features
- Users can rate halls on a 1-5 star scale
- Add detailed comments about their experience
- Rate specific aspects: cleanliness, facility condition
- Track equipment working status
- View statistics and average ratings
- Prevent duplicate ratings within 24 hours

### How to Use

#### Submitting a Rating
1. Open the Hall Details panel by clicking **📋 Details**
2. Scroll to the **⭐ Hall Ratings & Feedback** section
3. Click **+ Add Rating** button
4. Rate the hall:
   - **Overall Rating**: Click stars to rate (1-5)
   - **Cleanliness Rating**: Rate cleanliness separately
   - **Facility Condition**: Select dropdown option
   - **Equipment Status**: Check if equipment is working properly
   - **Comment**: Share detailed feedback
5. Click **Submit Rating**

#### Viewing Statistics
- **Statistics Dashboard** at the top shows:
  - Average Overall Rating
  - Average Cleanliness Rating
  - Equipment Working Percentage
  - Total Number of Ratings
- **Recent Ratings** display detailed feedback from users

#### Rating History
- Each rating shows the reviewer's name, date, and all feedback details
- Comments are displayed in full
- Equipment status shown as ✓ (Working) or ✗ (Not Working)

### Constraints
- Users can only rate a hall once every 24 hours
- All ratings are tied to the user who submitted them

### Database Storage
- **Table**: `hall_ratings`
- **Columns**: id, hall_id, user_id, rating, comment, facility_condition, cleanliness_rating, equipment_working, created_at, updated_at
- **Indexed** for fast queries on hall_id and timestamps

---

## 3. Activity Log (Edit/Delete History)

### Features
- Track all hall-related activities (create, update, delete)
- Record resource additions and removals
- Log rating submissions
- Show change history with before/after values
- Display user information and timestamp
- Expandable log entries for detailed change information

### How to Use

#### Viewing Activity Logs
1. Open the Hall Details panel by clicking **📋 Details**
2. Scroll to the **📋 Activity Log** section
3. View chronological list of activities
4. Click on any activity to expand and see detailed changes

#### Understanding Activity Types
- **✨ Created**: Hall or resource was created
- **📝 Updated**: Hall or resource was modified
- **🗑️ Deleted**: Hall or resource was removed
- **📦 Resource Added**: New resource assigned to hall
- **📤 Resource Removed**: Resource deleted from hall
- **⭐ Rating Added**: New rating submitted

#### Expanded View Details
When you expand an activity, you see:
- The entity that was modified
- User who performed the action
- Exact timestamp
- Specific changes made:
  - **Old values** (shown with strikethrough)
  - **New values** (highlighted in green)
  - Field names that were changed

#### Refreshing Logs
- Click the **🔄 Refresh** button to get the latest activities
- Logs auto-refresh every 30 seconds
- Shows up to 50 most recent activities

### Database Storage
- **Table**: `activity_logs`
- **Columns**: id, entity_type, entity_id, entity_name, action, changes (JSONB), performed_by, ip_address, user_agent, created_at
- **Indexed** for fast queries on entity_id, entity_type, and created_at
- Stores complete change information in JSON format

---

## 4. Smart Hub Recommendations (Suggest Best Hall Based on Requirements)

### Features
- AI-powered hall recommendation engine
- Matches halls based on:
  - **Batch Size**: Automatically filters halls by capacity
  - **Equipment Needs**: Matches required resources
  - **Facility Condition**: Considers condition of resources
- Comprehensive scoring system (0-100)
- Shows matching and missing equipment for each hall
- Caches recommendations for 7 days
- Interactive resource selector for quick filtering

### How to Use

#### Getting Recommendations
1. Find the **🎯 Smart Hall Recommendations** panel (usually in bottom-right corner)
2. Fill in the form:
   - **Module ID** (Optional): Course code (e.g., CS101)
   - **Batch Size** (Required): Number of students
   - **Required Equipment**: Select or enter resources needed

#### Selecting Equipment
Two ways to select equipment:
1. **Quick-Select Buttons**: Click predefined resource buttons:
   - projector, wifi, ac, lab_equipment, whiteboard, sound_system, computers, microscopes
2. **Custom Input**: Type comma-separated list in textbox:
   - Example: "projector, wifi, ac, whiteboard"

#### Understanding Results
Each recommendation shows:
- **Hall Name**: Name of the recommended hall
- **Score**: Suitability score with color-coding:
  - 🟢 **90+**: Excellent match
  - 🔵 **75-89**: Very Good match
  - 🟡 **60-74**: Good match
  - 🟠 **<60**: Fair match
- **Capacity**: Number of students the hall can accommodate
- **Available Resources**: ✓ Green chips showing matching equipment
- **Missing Resources**: ✗ Orange chips showing unavailable equipment
- **Resource Summary**: Total resources and condition count

#### Scoring Algorithm
The recommendation score is calculated as:
```
Score = Capacity Match (0-40 points) 
       + Resource Match (0-60 points)
       + Equipment Condition Bonus (0-20 points)
```

- **Capacity Match**: Based on how well the hall capacity matches the batch size
- **Resource Match**: 10 points per matching required resource
- **Condition Bonus**: Bonus points for resources in excellent/good condition

#### Caching
- Top 5 recommendations are cached for 7 days
- If no cache exists, recommendations are generated fresh
- Cache expires daily to ensure recommendations stay current

### Recommendation Ranking
Results are sorted by score in descending order, with the best matches first.

### Database Storage
- **Table**: `hall_recommendations`
- **Columns**: id, for_module_id, batch_size, recommended_hall_id, score, matching_resources (JSONB), missing_resources (JSONB), created_at, expires_at
- **Indexed** for fast queries on for_module_id and recommended_hall_id

---

## API Endpoints

### Resources
- `POST /api/halls/resources` - Add a resource
- `GET /api/halls/{hallId}/resources` - Get hall resources
- `PUT /api/halls/resources/{resourceId}` - Update resource
- `DELETE /api/halls/resources/{resourceId}` - Delete resource

### Ratings
- `POST /api/halls/ratings` - Submit a rating
- `GET /api/halls/{hallId}/ratings` - Get all ratings for a hall
- `GET /api/halls/{hallId}/stats` - Get hall statistics

### Activity Logs
- `GET /api/halls/logs/activity` - Get all activity logs (paginated)
- `GET /api/halls/{hallId}/logs` - Get logs for a specific hall

### Recommendations
- `GET /api/halls/recommendations/suggest` - Get smart recommendations
- `GET /api/halls/recommendations/cached/{moduleId}` - Get cached recommendations

---

## User Interface Components

### Component Files Created

1. **HallResourcesPanel.jsx**
   - Displays and manages hall resources
   - Add, view, and delete equipment/furniture
   - Color-coded condition badges

2. **HallRatingsPanel.jsx**
   - User rating submission form
   - Statistics dashboard
   - Review history display
   - 5-star rating interface

3. **ActivityLogPanel.jsx**
   - Chronological activity display
   - Expandable entries for detail view
   - Color-coded action types
   - User and timestamp information

4. **SmartRecommendationsPanel.jsx**
   - Recommendation search form
   - Resource selector with quick buttons
   - Scored results display
   - Resource matching visualization

---

## Database Schema Additions

### New Tables

```sql
-- Hall Resources Table
CREATE TABLE hall_resources (
    id UUID PRIMARY KEY,
    hall_id TEXT REFERENCES halls(id),
    resource_type VARCHAR(100),
    resource_name VARCHAR(255),
    quantity INTEGER,
    condition VARCHAR(50),
    notes TEXT,
    added_by UUID REFERENCES users(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Hall Ratings Table
CREATE TABLE hall_ratings (
    id UUID PRIMARY KEY,
    hall_id TEXT REFERENCES halls(id),
    user_id UUID REFERENCES users(id),
    rating INTEGER (1-5),
    comment TEXT,
    facility_condition VARCHAR(50),
    cleanliness_rating INTEGER (1-5),
    equipment_working BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Activity Logs Table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY,
    entity_type VARCHAR(50),
    entity_id VARCHAR(255),
    entity_name VARCHAR(255),
    action VARCHAR(50),
    changes JSONB,
    performed_by UUID REFERENCES users(id),
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP
);

-- Hall Recommendations Table
CREATE TABLE hall_recommendations (
    id UUID PRIMARY KEY,
    for_module_id TEXT REFERENCES modules(id),
    batch_size INTEGER,
    recommended_hall_id TEXT REFERENCES halls(id),
    score DECIMAL(5,2),
    matching_resources JSONB,
    missing_resources JSONB,
    created_at TIMESTAMP,
    expires_at TIMESTAMP
);
```

---

## Permissions & Security

### Resource Management
- **Required Role**: Admin, Academic Coordinator, or Faculty Coordinator
- Can add, update, delete resources

### Ratings & Feedback
- **Required Role**: Any authenticated user
- Can submit ratings for any hall
- Rate limit: Once per hall per 24 hours

### Activity Logs
- **Required Role**: Any authenticated user (read-only)
- Can view logs for any entity they have access to

### Smart Recommendations
- **Required Role**: Any authenticated user
- Can view recommendations for all halls
- No rate limiting

---

## Integration Notes

All features are integrated into the existing HallAllocation component:

1. **Details Button**: Added to each hall card
2. **Detail Modal**: Shows all new feature panels
3. **Smart Recommendations**: Floating widget in bottom-right corner
4. **Activity Logging**: Automatic logging on all CRUD operations

---

## Future Enhancements

- Email notifications for hall maintenance updates
- Photo upload for resources and conditions
- Batch operations for resource management
- Export activity logs as PDF/CSV
- Machine learning for improved recommendations
- Resource availability calendars
- Mobile app support for quick ratings

---

## Troubleshooting

### Resources not appearing
- Verify the hall has resources assigned
- Check user permissions (Admin/Coordinator role required)
- Ensure database connection is active

### Ratings not saving
- Confirm you're not rating the same hall within 24 hours
- Check user authentication status
- Verify JavaScript is enabled

### Activity logs empty
- Logs only appear after actions are performed
- Some historical activities may not be logged
- Refresh the panel to see latest entries

### Recommendations not loading
- Enter required batch size field
- Check network connection
- Try modifying equipment requirements

---

For more support or issues, contact the development team.
