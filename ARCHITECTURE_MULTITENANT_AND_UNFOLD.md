# Architecture: Multi-Tenant, Django Unfold & Frontend Roles

This document captures the plan for:
1. Migrating the Django admin to **Django Unfold** (modern UI).
2. **Multi-tenant, multi-branch** design so you can sell to multiple liquor stores (organizations) with multiple branches each.
3. **Deployment strategy** on GCP Cloud Run (one deployment per organization to avoid limits).
4. **Frontend roles**: Per-user permissions — who sees **Management** (custom React pages, not Django admin); users linked to branch(es); owner can give Management access to a trusted employee per branch.

---

## 1. Django Unfold migration — confirmed

**Can we migrate all current admin functionality to Django Unfold?**  
**Yes.** Unfold is a drop-in-style replacement: same concepts (ModelAdmin, inlines, list_display, fieldsets), with a different base class and site.

### Current admin surface (to preserve)

| Resource           | Key features to keep |
|--------------------|----------------------|
| **Categories**     | list_display, search, ordering |
| **Products**       | list_display, list_filter, list_editable, fieldsets, custom columns (profit margin, profit per unit) |
| **Inventory**      | list_display, list_filter, custom is_low_stock display |
| **Stock movements**| list_display, list_filter, save_model logic (inventory update), get_form initial |
| **Sales**          | list_display, list_filter, readonly_fields, **SaleItemInline** |
| **Customers**      | list_display, list_filter, list_editable, fieldsets, custom displays, **PointTransactionInline** |
| **Point transactions** | list_display, list_filter, get_queryset select_related |

### What we change for Unfold

- **Site**: Use `UnfoldAdminSite` and point `/admin/` (or chosen path) to it.
- **Base classes**:  
  - `admin.ModelAdmin` → `unfold.admin.ModelAdmin`  
  - `admin.TabularInline` → `unfold.admin.TabularInline` (or StackedInline as needed)
- **Config**: Keep all existing `list_display`, `list_filter`, `fieldsets`, `readonly_fields`, `save_model`, `get_form`, etc. Unfold supports them; we only add Unfold-specific options if we want (e.g. tabs, filters).
- **Django auth**: Continue using `User`; we’ll add a proper **User** admin (create/edit frontend users) and optionally a simple role (e.g. staff + “is_store_admin” for wife).

No functionality is dropped; we only swap base classes and wire the Unfold site.

---

## 2. Multi-tenant, multi-branch model (for selling to multiple stores)

### Requirements (from your description)

- **You (developer)** have a single place to manage **organizations** (liquor store owners) and their **branches**.
- **First client**: One organization (the couple), two branches (current store + new one). Same org can manage both branches.
- **Next client**: Another organization, e.g. two branches → total **4 stores** (2 orgs × 2 branches), each store’s data independent.
- **Isolation**: Each organization’s data (and ideally each branch’s data) is isolated; employees and data don’t mix across orgs.
- **Deployment**: Prefer **one Cloud Run service per organization** so that 4 stores don’t run in a single process and hit GCP limits.

### Recommended shape: “One app per organization” + “Control plane”

- **Control plane (your admin only)**  
  - Single small app (one Cloud Run service).  
  - Purpose: create/list **Organizations** and **Branches**, and record **where** that org’s app lives (URL + optional env or DB identifier).  
  - No store data (no products, sales, inventory). Just org/branch metadata and deployment info.  
  - Uses Django Unfold for a clean UI.  
  - Only you (superuser) use it.

- **Tenant app (current liquor store codebase, deployed once per organization)**  
  - Same codebase; each org gets its own deployment (own Cloud Run service, own DB).  
  - One deployment = one organization.  
  - Inside one org’s app we have **branches** (stores). So:  
    - **Organization** “First Client” → Branch “Store A”, Branch “Store B”.  
    - **Organization** “Second Client” → Branch “Store C”, Branch “Store D”.  
  - Data model in tenant app:  
    - **Organization** (optional in DB if we treat “this deployment = one org” and set `ORG_SLUG` in env).  
    - **Branch** (required): each store is a branch; products/inventory/sales can be scoped by `branch` (and optionally org).  
  - Users (Django `User`) belong to that org’s DB only; wife and employee are created in this app’s Unfold admin (or via API).  
  - This app also uses Django Unfold and exposes the **frontend** (React) for that org (Dashboard, Inventory, Sales, and for admin role: Management).

So:

- **4 stores** = 2 organizations × 2 branches each.  
- **Deployment**: 1 control plane + 2 tenant deployments (one per org).  
- **Databases**: 1 small DB for control plane (org/branch list + URLs); 2 tenant DBs (one per org), each with branches, products, inventory, sales, customers, users.

### Data model (tenant app — current codebase)

- **Organization** (optional table or env-only):  
  - If we keep it in DB: `name`, `slug`, `created_at`. One row per deployment (or we derive from `ORG_SLUG` and don’t store it).

- **Branch**:  
  - `organization` (FK or logical; can be nullable if one org per deployment), `name`, `slug`, optional `address`, `is_active`.  
  - Products / Inventory / Sales / StockMovement can get an optional `branch` FK (nullable at first for backward compatibility; then we can require it for new data).

- **User (Django auth)**:  
  - Already exists. Add **profile** (or extended fields): `branch` (FK, nullable = "all branches"), `can_use_management_module` (boolean).  
  - When creating a user in Unfold, owner sets: which **branch** the user is linked to, and whether they have **Management module access**. Any user (wife or trusted employee) can have Management; it's a permission. Per-branch: e.g. trusted employee at Branch 1 has Management, employee at Branch 2 does not.

- **Products, Inventory, Sales, Customers, PointTransaction**:  
  - Add `branch` FK (nullable for migration); then scope all queries by branch (and by org when we have org in DB).  
  - So each branch has its own catalog and stock; reporting can be per-branch or aggregated per org.

### Control plane data model (separate repo or same repo, different app)

- **Organization**: `name`, `slug`, `admin_url` (e.g. `https://org1-xxx.run.app/admin/`), `created_at`, optional contact.  
- **Branch**: `organization` (FK), `name`, `slug`, optional identifier.  
- No User/store data; just registry for you to “add organization” and “add branch” and know where to send the client.

### How “add organization” works (operationally)

1. You create a new Cloud Run service from the **same tenant app image**, with:
   - New `DATABASE_URL` (new Cloud SQL DB or new schema).
   - `ORG_SLUG=second-client`, `SECRET_KEY`, etc.
2. Run migrations and create superuser (or bootstrap script) for that org.
3. In the **control plane** app you create an Organization and its Branches and set `admin_url` to that Cloud Run URL.
4. You give the client their frontend URL (e.g. same base URL as admin) and create their users (wife + employee) in that tenant’s Unfold admin.

So: **multi-tenant by deployment** (one tenant app per org), with **multi-branch inside each tenant** (Branch model + FKs). No need to run 4 stores in one process; you run 2 tenant deployments for 2 orgs (4 branches total).

---

## 2b. Control plane flow (your workflow) & tenant first login

- **Control plane (your app):** You add **Organization** (name, slug, optional contact), then add **Branches** for that org (Store A, Store B). You store the tenant's **admin URL** (e.g. after you deploy the tenant app). No store data; just org/branch registry and where to send the client.
- **After org + branches are set up:** You deploy the tenant app (Cloud Run + DB for that org), run migrations, then run a **bootstrap** that creates the initial owner account with **temporary login** (e.g. from env vars `TEMP_ADMIN_USERNAME`, `TEMP_ADMIN_PASSWORD`, or a management command). Optionally enforce "change password on first login" so the owner must set their own password.
- **You send the owner:** Admin panel URL + temporary username + temporary password.
- **Owner first login:** Owner logs into the Django Unfold admin, changes password if they want, then uses the **branch switcher** to move between branches. Each admin page shows data for the selected branch. They create users (linked to branch + Management access), then do inventory management per branch. So the flow is: control plane (you add org/branches) → tenant bootstrap (temp credentials) → owner logs in, changes password, switches branches, sets up users and inventory.

---

## 2c. Tenant admin: branch switcher (each page = selected branch)

- **Branch switcher in Unfold:** The tenant app's Django Unfold admin has a **branch switcher** in the header or sidebar (e.g. dropdown "Current branch: Store A" with options Store A, Store B). On change, we set `request.session['current_branch_id']` and redirect so the whole admin context is for that branch.
- **Each page shows data for that branch:** Every branch-scoped model (Products, Inventory, Sales, Stock movements, Customers if per-branch, etc.) uses `get_queryset(request)` to filter by `request.session.get('current_branch_id')`. Create/edit forms default the branch to the current session branch. So the owner (or staff) switches once, then every list and form is for that branch.
- **Single-tenant with one branch:** If an org has only one branch, we can auto-select it and hide the switcher, or show it with one option. No change to the flow.

---

## 3. Deployment (GCP Cloud Run)

- **Control plane**: One Cloud Run service, one small DB. Only you use it; low traffic.  
- **Tenant app**: One Cloud Run service per organization.  
  - First client: 1 service (their 2 branches in one DB).  
  - Second client: another service + another DB.  
- This keeps CPU/memory per service within limits and avoids “4 stores in one container.”  
- Same codebase for all tenant deployments; only env (e.g. `ORG_SLUG`, `DATABASE_URL`, `SECRET_KEY`) and possibly a “control plane URL” for future features differ.

(If you later want one URL with subdomains or path routing to multiple orgs, you can put a load balancer in front and route by host/path; for now, one URL per org is simpler and matches “one deployment per org.”)

---

## 4. Frontend: Management module = custom React pages (no Django admin URL)

- **Management is not a link to Django.**  
  - When a user with Management access clicks “Management”, they stay inside the React app.  
  - **Management** = custom React pages that replicate Unfold capabilities: products, categories, inventory, stock in/out, customers, point transactions, etc. All actions go through the API; no redirect to `/admin/`.  
  - This way the next client’s owner doesn’t have to use the Django interface; she can give Management to a trusted employee who never sees the Django admin.

- **Who gets Management is a per-user permission (and can be per-branch).**  
  - **Owner (e.g. wife)** typically has Management and may be linked to “all branches” or a specific branch.  
  - **Trusted employee** at one branch can also be given Management (e.g. to do stock-ins when owner isn’t there).  
  - Another employee at the same or another branch can have only Dashboard, Inventory, Sales (no Management).  
  - So: it’s not “wife vs employee”; it’s “this user has Management” vs “this user doesn’t”, and the owner decides when creating/editing users in Unfold.

- **User creation in Unfold (tenant app):**  
  - When the owner adds a user in the Django Unfold panel, she sets:  
    - **Branch**: which store this user is linked to (or “all branches” if applicable).  
    - **Management module access**: yes/no.  
  - That user then logs in only to the **frontend** (React). If they have Management, they see the Management section (custom React pages). They never need the Django admin URL.

- **Auth**:  
  - Frontend login calls Django (session or token).  
  - Backend returns user + `branch` + `can_use_management_module`.  
  - Frontend shows/hides the Management nav item and scopes data by branch when needed.

---

## 5. Implementation order (recommended)

So we don’t break the “already working” system and we stay ready for multi-tenant:

1. **Django Unfold**  
   - Install Unfold, switch admin to UnfoldAdminSite, change ModelAdmin/Inline base classes, keep all existing logic.  
   - Add **User** admin so you can create wife and employee from Django admin.

2. **Auth flow (single-tenant, current DB)**  
   - Login API (session or token) that validates against Django User.  
   - Backend returns user + `branch` + `can_use_management_module`.  
   - Frontend: replace mock login with API call; show Management nav and pages only when `can_use_management_module` is true.

3. **User profile: branch + Management permission**  
   - Add profile (e.g. `UserProfile` or one-to-one): `branch` (FK, nullable), `can_use_management_module` (bool).  
   - In Unfold User admin: when creating/editing a user, set branch and “Management module access”.  
   - Backend: protect Management-related API endpoints (create product, stock in, add customer, etc.) so only users with `can_use_management_module` can call them; scope by branch where relevant.

4. **Multi-branch (optional but good to have early)**  
   - Add **Branch** (and optionally **Organization**) to tenant app; add `branch` FK to Product, Inventory, Sale (nullable first), then run migrations and default existing rows to one branch.  
   - This prepares the same codebase for “first client with 2 branches” and “second client with 2 branches” without a big rewrite later.

5. **Control plane (when you add a second org)**  
   - New minimal Django app (or separate project): Organization + Branch models, Unfold admin, deploy once.  
   - When you onboard a new client, deploy tenant app again with new DB and register org + branches in control plane.

6. **Cloud Run**  
   - Deploy control plane once.  
   - Deploy tenant app per org (first client = one deployment, 2 branches in one DB).

---

## 6. Summary

| Question | Answer |
|----------|--------|
| Can we migrate current admin to Django Unfold? | Yes; swap to Unfold site + Unfold ModelAdmin/Inline, keep all list_display, fieldsets, inlines, custom logic. |
| Multi-tenant: one app or many? | Many: one **tenant app deployment per organization**; each org can have multiple **branches** (stores) in the same DB. |
| Who has their own admin? | Each org’s deployment has its own Django Unfold admin (and frontend). You have a separate **control plane** app to add orgs and branches. |
| Same system for 4 stores? | Yes: 2 orgs × 2 branches; 2 tenant deployments (2 DBs); 1 control plane. No need to run all 4 stores in one process. |
| Who sees Management? | Per-user permission set in Unfold when creating user: branch + “Management module access”. Owner or trusted employee can have it; no redirect to Django admin. |
| Management implementation? | Custom React pages that mimic Unfold (products, categories, stock, customers, etc.); all via API. User never leaves the React app. |
| Auth? | Real Django auth (session or token); user creation in Unfold with branch + can_use_management_module; frontend shows Management only for users with that permission. |
| Control plane flow? | You add org + branches; deploy tenant and run bootstrap (temp admin credentials); send owner URL + temp login; owner logs in, changes password, uses branch switcher. |
| Tenant admin branch switcher? | Session holds current branch; Unfold header/sidebar has branch dropdown; every branch-scoped page filters by that branch. |

If this matches what you have in mind, next step is to implement in this order: **Unfold → User admin & auth flow → roles & Management** in the frontend, then **Branch (and optional Organization)** in the tenant app, then control plane when you add the second client.
