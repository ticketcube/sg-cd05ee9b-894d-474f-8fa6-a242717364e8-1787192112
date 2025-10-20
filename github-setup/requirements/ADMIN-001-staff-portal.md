---
name: Feature Requirement
about: Staff Portal & Admin Features
title: '[ADMIN-001] Staff Portal'
labels: ['requirement', 'priority-p2', 'phase-2', 'component-admin']
assignees: ''
---

## 📋 Requirement Information

**Requirement ID:** ADMIN-001  
**Priority:** P2 - Medium  
**Phase:** Phase 2  
**Feature Area:** Administration  
**Component:** Staff Portal  
**Estimated Effort:** 2-3 weeks  
**Dependencies:** AUTH-001 (Role-based auth), ARTIST-001 (Artist management), WEEKLY-001 (Weekly lists)

---

## 📝 Feature Description

### Overview
Administrative portal for staff to manage artists, weekly lists, content moderation, user management, and analytics. Provides tools for curating content, monitoring user activity, and maintaining platform quality.

### User Story
**As a** staff member  
**I want to** manage artists, curate weekly lists, and moderate content  
**So that** I can ensure high-quality content and smooth platform operations

### Business Value
- **Content Quality:** Staff can curate and moderate content
- **Operational Efficiency:** Centralized tools for common tasks
- **Data Insights:** Analytics dashboard for business decisions
- **User Support:** Tools for helping users and resolving issues
- **Platform Health:** Monitor and maintain system performance

---

## ✅ Requirements

### Functional Requirements

#### Authentication & Access Control
- [ ] **Role-Based Access**
  - Super Admin (full access)
  - Content Manager (artist/list management)
  - Moderator (content moderation only)
  - Analyst (read-only analytics)

- [ ] **Login & Security**
  - Separate admin login page
  - Two-factor authentication
  - Session timeout (30 minutes)
  - Activity logging (who did what, when)

#### Artist Management
- [ ] **Artist CRUD Operations**
  - Create new artist profiles
  - Edit artist information
  - Upload artist images/videos
  - Set artist metadata (genre, tags, social links)
  - Soft delete artists (hide from users)

- [ ] **Bulk Operations**
  - Import artists from CSV
  - Bulk edit (tags, genres)
  - Bulk delete/archive

- [ ] **Artist Search & Filtering**
  - Search by name, genre, tags
  - Filter by status (active, pending, archived)
  - Sort by various criteria

#### Weekly List Management
- [ ] **List Creation & Curation**
  - Create new weekly lists
  - Select 10 artists for the week
  - Set list metadata (title, description, theme)
  - Schedule list publication date
  - Preview list before publishing

- [ ] **List History**
  - View all past weekly lists
  - Edit published lists (with change tracking)
  - Clone previous lists as templates
  - Archive old lists

#### Content Moderation
- [ ] **User-Generated Content Review**
  - Review user ratings and comments
  - Flag inappropriate content
  - Ban/suspend users
  - Remove content

- [ ] **Moderation Queue**
  - Priority-sorted items to review
  - Bulk approval/rejection
  - Moderation notes

#### User Management
- [ ] **User Search & Profiles**
  - Search users by email, name, ID
  - View user profile details
  - See user activity history
  - View points balance and transactions

- [ ] **User Actions**
  - Ban/suspend users
  - Reset passwords
  - Adjust points balance (with reason)
  - Send notifications to users

#### Analytics Dashboard
- [ ] **Key Metrics**
  - Daily/weekly/monthly active users
  - Total points distributed
  - Videos watched (count, duration)
  - Ratings submitted
  - Weekly list completion rate
  - Top artists by engagement

- [ ] **Charts & Visualizations**
  - User growth over time
  - Engagement trends
  - Points distribution
  - Artist popularity rankings

- [ ] **Reports**
  - Export data to CSV
  - Scheduled email reports
  - Custom date ranges

#### System Administration
- [ ] **Configuration Management**
  - Update points configuration
  - Manage rewards catalog
  - Set feature flags
  - Configure notification templates

- [ ] **Event Management**
  - Trigger event cache refresh
  - Manage Ticketmaster integration
  - View API usage statistics

### Non-Functional Requirements

#### Security
- [ ] **Access Control:** Role-based permissions enforced
- [ ] **Audit Logging:** All admin actions logged
- [ ] **Data Protection:** Sensitive user data masked/encrypted

#### Performance
- [ ] **Page Load:** < 2 seconds for all admin pages
- [ ] **Search Results:** < 1 second for typical queries
- [ ] **Bulk Operations:** Process 100+ items efficiently

#### Usability
- [ ] **Responsive Design:** Works on desktop and tablet
- [ ] **Clear Navigation:** Easy to find tools and data
- [ ] **Error Prevention:** Confirmation for destructive actions

---

## 🎨 User Interface Requirements

### Admin Dashboard
```
┌────────────────────────────────────────────────────────┐
│ 🔧 OTW Chart Admin Portal          [Admin] [Logout]   │
├────────────────────────────────────────────────────────┤
│ [Dashboard] [Artists] [Lists] [Users] [Analytics]     │
├────────────────────────────────────────────────────────┤
│ 📊 Dashboard Overview                                  │
│                                                        │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│ │ 👥 Users    │ │ 🎵 Artists  │ │ ⭐ Points   │      │
│ │ 1,234       │ │ 567         │ │ 45,678      │      │
│ │ +12 today   │ │ +3 today    │ │ +890 today  │      │
│ └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                        │
│ 📈 User Growth (Last 30 Days)                         │
│ [Line Chart]                                           │
│                                                        │
│ 🔥 Top Artists This Week                              │
│ 1. Artist A - 234 views                               │
│ 2. Artist B - 198 views                               │
│ 3. Artist C - 176 views                               │
│                                                        │
│ ⚠️ Pending Actions                                    │
│ • 12 items in moderation queue                        │
│ • 3 user reports to review                            │
│ • Weekly list due tomorrow                            │
└────────────────────────────────────────────────────────┘
```

### Artist Management Page
```
┌────────────────────────────────────────────────────────┐
│ 🎵 Artist Management                                   │
├────────────────────────────────────────────────────────┤
│ [+ Add Artist] [Import CSV] [Export]                  │
│                                                        │
│ Search: [_______________] [🔍]  Filter: [All ▼]       │
│                                                        │
│ ┌────────────────────────────────────────────────┐    │
│ │ ☑ | Artist Name | Genre | Status | Actions    │    │
│ ├────────────────────────────────────────────────┤    │
│ │ ☑ | Artist A   | Pop   | Active | [Edit][Del]│    │
│ │ ☑ | Artist B   | Rock  | Active | [Edit][Del]│    │
│ │ ☑ | Artist C   | Hip-Hop| Pending| [Edit][Del]│    │
│ └────────────────────────────────────────────────┘    │
│                                                        │
│ [Bulk Actions ▼] Selected: 0                          │
│ Showing 1-50 of 567 artists                           │
│ [< Prev] [1] [2] [3] ... [12] [Next >]                │
└────────────────────────────────────────────────────────┘
```

### Weekly List Editor
```
┌────────────────────────────────────────────────────────┐
│ 📝 Create Weekly List                                  │
├────────────────────────────────────────────────────────┤
│ Week of: [Nov 20, 2025 ▼]                             │
│ Title: [_______________________________]              │
│ Description: [_____________________________           │
│              _____________________________]            │
│                                                        │
│ Selected Artists (10 required)                        │
│ ┌────────────────────────────────────────────────┐    │
│ │ 1. [Artist A]                            [✕]   │    │
│ │ 2. [Artist B]                            [✕]   │    │
│ │ 3. [Artist C]                            [✕]   │    │
│ │ 4. [Artist D]                            [✕]   │    │
│ │ 5. [Artist E]                            [✕]   │    │
│ │ 6. [Empty]                               [+]   │    │
│ │ 7. [Empty]                               [+]   │    │
│ │ 8. [Empty]                               [+]   │    │
│ │ 9. [Empty]                               [+]   │    │
│ │ 10. [Empty]                              [+]   │    │
│ └────────────────────────────────────────────────┘    │
│                                                        │
│ [Search Artists to Add...]                            │
│                                                        │
│ [💾 Save Draft] [👁️ Preview] [🚀 Publish]            │
└────────────────────────────────────────────────────────┘
```

### User Management
```
┌────────────────────────────────────────────────────────┐
│ 👥 User Management                                     │
├────────────────────────────────────────────────────────┤
│ Search: [_______________] [🔍]                        │
│                                                        │
│ ┌────────────────────────────────────────────────┐    │
│ │ User Email        | Points | Status | Actions  │    │
│ ├────────────────────────────────────────────────┤    │
│ │ user@example.com  | 1,250  | Active | [View]  │    │
│ │ user2@example.com | 890    | Active | [View]  │    │
│ │ user3@example.com | 2,100  | Banned | [View]  │    │
│ └────────────────────────────────────────────────┘    │
│                                                        │
│ Showing 1-50 of 1,234 users                           │
│ [< Prev] [1] [2] [3] ... [25] [Next >]                │
└────────────────────────────────────────────────────────┘
```

### Analytics Dashboard
```
┌────────────────────────────────────────────────────────┐
│ 📊 Analytics                                           │
├────────────────────────────────────────────────────────┤
│ Date Range: [Last 30 Days ▼] [Custom Range...]        │
│ [Export CSV]                                           │
│                                                        │
│ 📈 User Engagement                                     │
│ [Line Chart: DAU, WAU, MAU]                           │
│                                                        │
│ 🎯 Engagement Breakdown                               │
│ Videos Watched: 12,345 (↑ 15%)                        │
│ Ratings Submitted: 8,901 (↑ 8%)                       │
│ Lists Completed: 456 (↓ 3%)                           │
│ Points Distributed: 98,765 (↑ 12%)                    │
│                                                        │
│ 🏆 Top Performers                                     │
│ Most Watched Artists | Most Rated Artists             │
│ 1. Artist A          | 1. Artist D                    │
│ 2. Artist B          | 2. Artist E                    │
│ 3. Artist C          | 3. Artist F                    │
└────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Specifications

### Database Schema
```sql
-- Admin roles
CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'content_manager', 'moderator', 'analyst')),
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Admin activity log
CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'artist', 'user', 'list', etc.
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation queue
CREATE TABLE moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL, -- 'rating', 'comment', 'report'
  content_id UUID NOT NULL,
  reporter_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  moderator_id UUID REFERENCES profiles(id),
  moderator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_admin_roles_user ON admin_roles(user_id);
CREATE INDEX idx_admin_activity_admin ON admin_activity_log(admin_id);
CREATE INDEX idx_admin_activity_created ON admin_activity_log(created_at);
CREATE INDEX idx_moderation_status ON moderation_queue(status);
CREATE INDEX idx_moderation_priority ON moderation_queue(priority);

-- RLS Policies
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin tables
CREATE POLICY "Admins can view roles"
  ON admin_roles FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admin_roles));

CREATE POLICY "Admins can view activity log"
  ON admin_activity_log FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admin_roles));

CREATE POLICY "Admins can view moderation queue"
  ON moderation_queue FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM admin_roles));
```

### Admin Service
```typescript
// src/services/adminService.ts
export const adminService = {
  // Check if user is admin
  isAdmin: async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    return !!data;
  },
  
  // Get admin role
  getAdminRole: async (userId: string) => {
    const { data } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    return data?.role || null;
  },
  
  // Log admin activity
  logActivity: async (
    adminId: string,
    action: string,
    entityType: string,
    entityId: string,
    details?: any
  ) => {
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_id: adminId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details
      });
  },
  
  // Get moderation queue
  getModerationQueue: async (status?: string) => {
    let query = supabase
      .from('moderation_queue')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data } = await query;
    return data || [];
  }
};
```

### Admin Artist Service
```typescript
// src/services/adminArtistService.ts
export const adminArtistService = {
  // Create artist
  createArtist: async (artistData: ArtistCreateData) => {
    const { data, error } = await supabase
      .from('artists')
      .insert(artistData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Log activity
    await adminService.logActivity(
      artistData.created_by,
      'create_artist',
      'artist',
      data.id,
      { name: artistData.name }
    );
    
    return data;
  },
  
  // Update artist
  updateArtist: async (artistId: string, updates: Partial<Artist>, adminId: string) => {
    const { data, error } = await supabase
      .from('artists')
      .update(updates)
      .eq('id', artistId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Log activity
    await adminService.logActivity(
      adminId,
      'update_artist',
      'artist',
      artistId,
      updates
    );
    
    return data;
  },
  
  // Bulk import artists
  bulkImportArtists: async (artistsData: ArtistCreateData[]) => {
    const { data, error } = await supabase
      .from('artists')
      .insert(artistsData)
      .select();
    
    if (error) throw error;
    return data;
  },
  
  // Search artists (admin view - includes inactive)
  searchArtists: async (query: string, filters?: ArtistFilters) => {
    let q = supabase
      .from('artists')
      .select('*');
    
    if (query) {
      q = q.ilike('name', `%${query}%`);
    }
    
    if (filters?.genre) {
      q = q.eq('genre', filters.genre);
    }
    
    if (filters?.status) {
      q = q.eq('status', filters.status);
    }
    
    const { data } = await q;
    return data || [];
  }
};
```

### Admin Guards
```typescript
// src/components/guards/withAdminGuard.tsx
export function withAdminGuard(Component: React.ComponentType, requiredRole?: string) {
  return function AdminGuardedComponent(props: any) {
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      async function checkAdminStatus() {
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const role = await adminService.getAdminRole(user.id);
        
        if (!role) {
          router.push('/');
          return;
        }

        if (requiredRole && role !== requiredRole && role !== 'super_admin') {
          router.push('/admin');
          return;
        }

        setIsAdmin(true);
        setIsLoading(false);
      }

      checkAdminStatus();
    }, [user]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!isAdmin) {
      return null;
    }

    return <Component {...props} />;
  };
}
```

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] Test role-based access control
- [ ] Test activity logging
- [ ] Test artist CRUD operations
- [ ] Test moderation queue filtering

### Integration Tests
- [ ] Test admin authentication flow
- [ ] Test artist management workflows
- [ ] Test weekly list creation
- [ ] Test user management actions

### E2E Tests
- [ ] Admin can log in
- [ ] Admin can create/edit artists
- [ ] Admin can curate weekly lists
- [ ] Admin can moderate content
- [ ] Admin can view analytics
- [ ] Non-admin users cannot access portal

---

## 📊 Success Metrics

### Key Performance Indicators
- **Admin Efficiency:** Average time to complete common tasks < 2 minutes
- **Content Quality:** Moderation response time < 24 hours
- **System Reliability:** Admin portal uptime > 99.5%

---

## 🚀 Implementation Plan

### Phase 1: Authentication & Base (Week 1)
- Set up admin authentication
- Build role-based access control
- Create admin layout and navigation
- Implement activity logging

### Phase 2: Artist Management (Week 1-2)
- Build artist CRUD interface
- Implement search and filtering
- Add bulk operations
- Create artist form validation

### Phase 3: Content Management (Week 2)
- Build weekly list editor
- Add moderation queue
- Implement user management
- Create content review tools

### Phase 4: Analytics & Reporting (Week 2-3)
- Build analytics dashboard
- Add data visualizations
- Implement report generation
- Create scheduled reports

### Phase 5: Testing & Polish (Week 3)
- Comprehensive testing
- Security audit
- Performance optimization
- Documentation

---

## 🔗 Dependencies

### Upstream Dependencies
- AUTH-001: Role-based authentication
- ARTIST-001: Artist data structure
- WEEKLY-001: Weekly list data

### Downstream Dependencies
- All features can be managed through admin portal

---

## ⚠️ Risks & Mitigation

### Security Risks
- **Unauthorized Access:** Mitigation: Strong auth, role checks on every request
- **Data Leaks:** Mitigation: Audit logging, access reviews

### Operational Risks
- **User Error:** Mitigation: Confirmations for destructive actions
- **Performance:** Mitigation: Pagination, indexing, caching

---

## ✏️ Notes

- Admin portal should be completely separate from main app
- Consider IP whitelisting for extra security
- Activity logging is crucial for accountability
- Regular security audits recommended

---

**Status:** 🟡 Planned  
**Last Updated:** October 20, 2025  
**Created By:** Product Team
