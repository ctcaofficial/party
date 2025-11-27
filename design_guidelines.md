# CTCA Party Design Guidelines

## Design Approach: Reference-Based (4chan/Imageboard Aesthetic)

**Primary Reference:** 4chan's classic imageboard interface
**Core Principle:** Authentic chan-board aesthetics with information density, functional minimalism, and community-familiar patterns

---

## Typography System

**Primary Font:** Monospace family (Arial, Helvetica fallback for UI elements)
- Thread titles: 14px bold
- Post content: 13px regular monospace
- Greentext quotes: 13px monospace (italic treatment)
- Post numbers/metadata: 11px monospace
- Navigation links: 12px sans-serif

**Hierarchy:**
- Board headers: Large, bold sans-serif
- Thread subjects: Bold, clickable
- Anonymous names: Regular weight
- Post timestamps: Smaller, muted styling
- Reply counts: Inline with metadata

---

## Layout System

**Spacing Primitives:** Tailwind units of 1, 2, 4, and 8
- Tight spacing for information density
- Post containers: p-2
- Thread margins: mb-2
- Reply indentation: ml-8
- Section spacing: py-4

**Grid Structure:**
- Board list: Full-width single column with compact rows
- Thread view: Single column, max-width container (max-w-4xl)
- Catalog view: Grid 3-4 columns on desktop (grid-cols-1 md:grid-cols-3 lg:grid-cols-4), responsive collapse to 2 then 1
- Reply boxes: Full-width within thread container

---

## Component Library

### Navigation/Header
- Fixed top bar with board name "CTCA Party" (left-aligned, bold)
- Board list dropdown/links (horizontal nav)
- Catalog/Index view toggle
- Minimal padding (p-2), thin border bottom

### Board Listing Page
- Board cards in vertical list format
- Each board shows: Name, description, post count, activity indicator
- No images on board list - pure text efficiency
- Hover states: subtle background shift

### Thread Listing (Index)
- Compact thread rows showing:
  - Post number (leftmost, clickable)
  - Thumbnail (if image attached, 150px max width)
  - Subject line (bold)
  - Truncated message preview (2-3 lines)
  - Metadata line: Anonymous, timestamp, [Reply] link, reply count
- Sticky threads pinned to top
- Pagination controls at bottom (simple prev/next)

### Thread View
- Original post (OP) displayed prominently:
  - Full image if attached (expandable on click)
  - Subject as header
  - Full message text
  - Post number, timestamp, Anonymous ID
- Reply chain below with slight left indent
- Each reply:
  - Mini thumbnail (125px) if image
  - Post number (clickable for quoting)
  - Reply message with greentext support
  - Quote links (>>postNumber) styled distinctively
- Quick reply box anchored at bottom or after thread

### Catalog View
- Grid of thread preview cards
- Each card contains:
  - Thread thumbnail (square crop, 200px)
  - Reply count badge overlay
  - Truncated subject line
  - Truncated first post snippet
- Cards maintain aspect ratio, uniform sizing

### Post Creation Form
- Thread creation (on board index):
  - Name field (defaults to "Anonymous")
  - Subject field
  - Comment textarea (rows=8)
  - File upload button (images only)
  - Submit button
- Reply form (in thread):
  - Simplified: Comment, file upload, submit
  - No subject field for replies
- Compact form design (p-4 max)

### Post Display Elements
- Post container: thin border, minimal padding (p-2)
- Post number: Clickable, distinctive styling
- Quote links: Underlined, hover shows preview tooltip
- Greentext: Lines starting with > styled uniquely
- Image attachments: Click to expand full-size overlay
- Metadata row: Compact, inline elements

### Image Handling
- Thumbnails: Maintain aspect ratio, max dimensions
- Expansion: Modal overlay with full-size image, click outside to close
- File info: Display filename, dimensions, file size below thumbnail

---

## Page Layouts

### Board Index
- Top nav with board selector
- Sticky "Post Thread" button (top-right)
- Thread list (15-20 threads per page)
- Bottom pagination
- No hero section - immediate content

### Individual Thread
- Breadcrumb nav (Board > Thread #)
- OP post prominently displayed
- Reply chain flows naturally
- Quick reply form at bottom (always visible)
- Scroll-to-top button when deep in thread

### Catalog
- Grid layout immediately visible
- Board nav at top
- Dense card grid
- Infinite scroll or pagination

---

## Images

**Image Usage:**
- Thread thumbnails: Required when users attach images to posts
- No decorative imagery
- No hero sections
- User-generated content only

**Image Specifications:**
- Thumbnails: 150px x 150px (index), 125px x 125px (replies), 200px x 200px (catalog)
- Full images: Click to expand in lightbox overlay
- File type indicators for non-image attachments

---

## Interaction Patterns

- Post numbers: Click to insert quote link in reply box
- Image thumbnails: Click to view full-size
- Quote links: Hover shows post preview popup
- [Reply] links: Scroll to quick reply, prefill with quote
- Thread refresh: Manual reload button, or auto-refresh toggle
- Form validation: Inline, minimal messaging

---

## Key Differences from Modern Web Apps

- No smooth animations/transitions
- Instant state changes
- Information-first, minimal chrome
- Functional over decorative
- Fast load times prioritized
- Text-heavy interface acceptable
- Compact, dense layouts preferred
- No fancy loading states - immediate content

---

## Accessibility

- Semantic HTML structure
- Keyboard navigation for forms
- Alt text for user-uploaded images
- Clear focus states
- Sufficient contrast ratios (handled in color implementation)
- Screen reader friendly post structure