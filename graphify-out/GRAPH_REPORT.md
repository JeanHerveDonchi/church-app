# Graph Report - .  (2026-07-02)

## Corpus Check
- Corpus is ~41,239 words - fits in a single context window. You may not need a graph.

## Summary
- 526 nodes · 782 edges · 52 communities (30 shown, 22 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 110 edges (avg confidence: 0.8)
- Token cost: 208,357 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Account Dialogs & Session Utils|Account Dialogs & Session Utils]]
- [[_COMMUNITY_Backend API & Services|Backend API & Services]]
- [[_COMMUNITY_Media Composers & Editors|Media Composers & Editors]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Home Feed & Post Cards|Home Feed & Post Cards]]
- [[_COMMUNITY_Frontend TS Config (app)|Frontend TS Config (app)]]
- [[_COMMUNITY_Account Delete & Lifecycle Services|Account Delete & Lifecycle Services]]
- [[_COMMUNITY_Backend Dependencies|Backend Dependencies]]
- [[_COMMUNITY_Backend TS Config|Backend TS Config]]
- [[_COMMUNITY_Account Lifecycle Architecture|Account Lifecycle Architecture]]
- [[_COMMUNITY_Protected Route & Auth Lifecycle|Protected Route & Auth Lifecycle]]
- [[_COMMUNITY_Root TS Config|Root TS Config]]
- [[_COMMUNITY_User Management & Roles|User Management & Roles]]
- [[_COMMUNITY_Profile Lifecycle Resolution|Profile Lifecycle Resolution]]
- [[_COMMUNITY_Comments UI & Hooks|Comments UI & Hooks]]
- [[_COMMUNITY_Article Composer & Tabs|Article Composer & Tabs]]
- [[_COMMUNITY_LoginSignup Auth Flow|Login/Signup Auth Flow]]
- [[_COMMUNITY_Auth Validation Utils|Auth Validation Utils]]
- [[_COMMUNITY_Workspace Scripts|Workspace Scripts]]
- [[_COMMUNITY_Post Feed & Post Hooks|Post Feed & Post Hooks]]
- [[_COMMUNITY_Church App MVP Concepts|Church App MVP Concepts]]
- [[_COMMUNITY_Create Post Type Step|Create Post: Type Step]]
- [[_COMMUNITY_Create Post Flow|Create Post Flow]]
- [[_COMMUNITY_Comment & Post Mutation Hooks|Comment & Post Mutation Hooks]]
- [[_COMMUNITY_Edit Post|Edit Post]]
- [[_COMMUNITY_Article Content Editor|Article Content Editor]]
- [[_COMMUNITY_Delete Account Service|Delete Account Service]]
- [[_COMMUNITY_Comments Service (FE)|Comments Service (FE)]]
- [[_COMMUNITY_Account Recovery Service|Account Recovery Service]]
- [[_COMMUNITY_Claude Settings|Claude Settings]]
- [[_COMMUNITY_Password Field|Password Field]]
- [[_COMMUNITY_TS Project References|TS Project References]]
- [[_COMMUNITY_Missing Profile Auto-Recovery|Missing Profile Auto-Recovery]]
- [[_COMMUNITY_Identity Model (Auth vs Profile)|Identity Model (Auth vs Profile)]]
- [[_COMMUNITY_App Entry & Query Client|App Entry & Query Client]]
- [[_COMMUNITY_Comments Service (BE)|Comments Service (BE)]]
- [[_COMMUNITY_Post Service (BE)|Post Service (BE)]]
- [[_COMMUNITY_Workspace Packages|Workspace Packages]]
- [[_COMMUNITY_Vite Config Concept|Vite Config Concept]]
- [[_COMMUNITY_Bear Avatar|Bear Avatar]]
- [[_COMMUNITY_Cat Avatar|Cat Avatar]]
- [[_COMMUNITY_Chicken Avatar|Chicken Avatar]]
- [[_COMMUNITY_Giraffe Avatar|Giraffe Avatar]]
- [[_COMMUNITY_Koala Avatar|Koala Avatar]]
- [[_COMMUNITY_Meerkat Avatar|Meerkat Avatar]]
- [[_COMMUNITY_Panda Avatar|Panda Avatar]]
- [[_COMMUNITY_Rabbit Avatar|Rabbit Avatar]]
- [[_COMMUNITY_Weasel Avatar|Weasel Avatar]]
- [[_COMMUNITY_Default Avatar|Default Avatar]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 22 edges
2. `apiFetch()` - 21 edges
3. `compilerOptions` - 20 edges
4. `compilerOptions` - 16 edges
5. `PostDetail()` - 16 edges
6. `PostCard()` - 15 edges
7. `useRequireFullName()` - 14 edges
8. `EditPostForm()` - 13 edges
9. `buildAuthPath()` - 12 edges
10. `Navbar()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `deleteAccount (frontend)` --semantically_similar_to--> `recoverAccount service`  [INFERRED] [semantically similar]
  frontend/src/services/accounts/delete.service.ts → backend/src/services/recovery.service.ts
- `ArticleComposer()` --semantically_similar_to--> `ArticleContent()`  [INFERRED] [semantically similar]
  frontend/src/components/posts/composer/ArticleComposer.tsx → frontend/src/components/posts/create/content/ArticleContent.tsx
- `PostComposer()` --semantically_similar_to--> `CreatePostFlow()`  [INFERRED] [semantically similar]
  frontend/src/components/posts/composer/PostComposer.tsx → frontend/src/components/posts/create/CreatePostFlow.tsx
- `deleteAccount()` --calls--> `apiFetch()`  [INFERRED]
  frontend/src/services/accounts/delete.service.ts → frontend/src/lib/api.ts
- `recoverAccount()` --calls--> `apiFetch()`  [INFERRED]
  frontend/src/services/recovery.service.ts → frontend/src/lib/api.ts

## Hyperedges (group relationships)
- **App bootstrap: Router + QueryClient + AuthProvider** — src_main_main, providers_authprovider_authprovider, src_app_app [EXTRACTED 0.95]
- **Protected access control flow** — components_protectedroute_protectedroute, providers_authprovider_useauth, hooks_useauthlifecycle_useauthlifecycle [EXTRACTED 0.95]
- **Account deletion two-step confirmation** — components_accountdeletiondialog_accountdeletiondialog, components_confirmdialog_confirmdialog, auth_auth_auth [EXTRACTED 0.85]
- **Three-step create post wizard** — create_createpostflow_createpostflow, steps_steponetype_steponetype, steps_steptwometa_steptwometa, steps_stepthreecontent_stepthreecontent [EXTRACTED 0.95]
- **Tabbed post composer by content type** — composer_postcomposer_postcomposer, composer_articlecomposer_articlecomposer, composer_videocomposer_videocomposer, composer_audiocomposer_audiocomposer [EXTRACTED 0.95]
- **Polymorphic content editors by post type** — content_articlecontent_articlecontent, content_videocontent_videocontent, content_audiocontent_audiocontent [INFERRED 0.85]
- **Post query hooks sharing 'posts' cache key** — hooks_usepost_usepost, hooks_usepublishedposts_usepublishedposts, hooks_useadminposts_useadminposts, hooks_useposts_useposts [INFERRED 0.85]
- **Post mutations invalidating 'posts' cache** — hooks_usecreatepost_usecreatepost, hooks_useupdatepost_useupdatepost, hooks_usedeletepost_usedeletepost [INFERRED 0.85]
- **Account lifecycle and deletion flow** — hooks_useauthflow_useauthflow, hooks_useauthlifecycle_useauthlifecycle, hooks_usedeleteaccount_usedeleteaccount [INFERRED 0.75]
- **Account Recovery Flow** — pages_recoveraccount_recoveraccountpage, services_lifecycle_service_fetchprofilebyemail, services_recovery_service_recoveraccount [EXTRACTED 1.00]
- **Pre-auth Email Lifecycle Check** — pages_login_login, pages_signup_signup, hooks_useauthflow_checkemaillifecycle, services_lifecycle_service_fetchprofilebyemail [INFERRED 0.85]
- **Admin Account Deletion Flow** — pages_manageusers_manageusers, hooks_usedeleteaccount_usedeleteaccount, accounts_delete_service_deleteaccount [INFERRED 0.85]
- **Account lifecycle: delete/disable/recover email notifications** — routes_accounts_accountsroutes, templates_account_deleted_accountdeletedtemplate, templates_account_disabled_accountdisabledtemplate, templates_account_recovered_accountrecoveredtemplate, lib_email_sendemail [EXTRACTED 1.00]
- **Profile lifecycle state resolution pipeline** — services_lifecycle_service_fetchprofilebyuserid, services_lifecycle_service_checkaccountlifecycle, services_lifecycle_service_resolveaccountlifecycle [EXTRACTED 1.00]
- **JWT-forwarded RLS auth pattern** — middleware_auth_extractauth, lib_supabase_createuserclient, lib_supabase_supabase [INFERRED 0.85]
- **Account Delete & Recovery Lifecycle** — architecture_delete_recover_soft_delete, architecture_delete_recover_self_delete_flow, architecture_delete_recover_admin_delete_flow, architecture_delete_recover_recovery_flow, architecture_delete_recover_account_states [EXTRACTED 1.00]
- **Account Lifecycle Database RPCs** — architecture_delete_recover_delete_account_rpc, architecture_delete_recover_recover_account_rpc, architecture_delete_recover_ensure_user_profile_rpc [EXTRACTED 1.00]
- **Avatar Asset Set** — avatars_bear, avatars_cat, avatars_chicken, avatars_giraffe, avatars_koala, avatars_meerkat, avatars_panda, avatars_rabbit, avatars_weasel, avatars_default [INFERRED 0.95]

## Communities (52 total, 22 thin omitted)

### Community 0 - "Account Dialogs & Session Utils"
Cohesion: 0.06
Nodes (52): auth validation/utilities, clearSupabaseStorage(), resetLocalSession(), session reset utilities, AccountDeletionDialog(), AccountDeletionDialogProps, ConfirmationField, FieldFeedback (+44 more)

### Community 1 - "Backend API & Services"
Cohesion: 0.09
Nodes (36): deleteAccount (frontend), postService, commentsService (frontend), getClient(), sendEmail(), SendEmailParams, createUserClient(), supabase (+28 more)

### Community 2 - "Media Composers & Editors"
Cohesion: 0.07
Nodes (36): AudioComposer(), ComposerStatus, ComposerStatusToggle(), ComposerStatusToggleProps, options, VideoComposer(), ArticleContent(), AudioContent() (+28 more)

### Community 3 - "Frontend Dependencies"
Cohesion: 0.05
Nodes (39): dependencies, date-fns, lucide-react, react, react-dom, react-router-dom, @supabase/supabase-js, @tanstack/react-query (+31 more)

### Community 4 - "Home Feed & Post Cards"
Cohesion: 0.08
Nodes (25): Footer(), usePublishedPosts(), Home(), HomeFilterValue, getErrorMessage(), post feature utilities, PostCardProps, ArticlePost (+17 more)

### Community 5 - "Frontend TS Config (app)"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, baseUrl, erasableSyntaxOnly, ignoreDeprecations, jsx, lib, module (+14 more)

### Community 6 - "Account Delete & Lifecycle Services"
Cohesion: 0.10
Nodes (11): ManagedDeleteAccountPayload, deleteAccount(), DeleteAccountPayload, DeleteAccountResponse, AccountLifecycleState, fetchProfileByUserId(), LifecycleCheckResult, ProfileData (+3 more)

### Community 7 - "Backend Dependencies"
Cohesion: 0.11
Nodes (17): dependencies, dotenv, elysia, @elysiajs/cors, @elysiajs/node, resend, @supabase/supabase-js, devDependencies (+9 more)

### Community 8 - "Backend TS Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 9 - "Account Lifecycle Architecture"
Cohesion: 0.13
Nodes (18): Account States (active / self_deleted / admin_deleted / missing_profile), Admin-Delete Flow, auth.users Never Touched on Delete, Data Preservation & Anonymization Policy, delete_account() RPC, Deleted Users Retain Guest Read-Only Access, Email Notifications (Resend, planned), is_active_user() RLS Enforcement (+10 more)

### Community 10 - "Protected Route & Auth Lifecycle"
Cohesion: 0.17
Nodes (9): ProtectedRoute(), ProtectedRouteProps, useAuthFlow(), UseAuthFlowResult, useAuthLifecycle(), UseAuthLifecycleResult, useDeleteAccount(), App() (+1 more)

### Community 11 - "Root TS Config"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, module, moduleResolution, outDir, paths, rootDir, skipLibCheck (+5 more)

### Community 12 - "User Management & Roles"
Cohesion: 0.17
Nodes (6): isRoleName(), RoleName, SearchableProfile, SearchCardProps, SearchMode, toSearchableProfile()

### Community 13 - "Profile Lifecycle Resolution"
Cohesion: 0.31
Nodes (7): AccountLifecycleState, checkAccountLifecycle(), fetchProfileByUserId(), LifecycleCheckResult, ProfileData, recreateMissingProfile(), resolveAccountLifecycle()

### Community 14 - "Comments UI & Hooks"
Cohesion: 0.28
Nodes (5): useComments(), useDeleteComment(), CommentSection(), CommentSectionProps, createOptimisticComment()

### Community 15 - "Article Composer & Tabs"
Cohesion: 0.25
Nodes (5): ArticleComposer(), ToolbarButtonProps, ComposerKind, PostComposer(), tabs

### Community 16 - "Login/Signup Auth Flow"
Cohesion: 0.36
Nodes (6): buildAuthPath(), getSafeRedirectPath(), useAuthFlow.checkEmailLifecycle, Login(), Signup(), TouchedState

### Community 17 - "Auth Validation Utils"
Cohesion: 0.38
Nodes (4): getAuthErrorMessage(), getMessageFromError(), normalizeEmail(), validateEmail()

### Community 18 - "Workspace Scripts"
Cohesion: 0.29
Nodes (6): name, private, scripts, dev, dev:backend, dev:frontend

### Community 19 - "Post Feed & Post Hooks"
Cohesion: 0.29
Nodes (3): useDeletePost(), usePosts(), PostFeed()

### Community 20 - "Church App MVP Concepts"
Cohesion: 0.47
Nodes (6): Church Library Web App (MVP), Google OAuth via Supabase, Row Level Security (RLS), User Roles (Guest, User, Admin, Super Admin), Soft Delete Architecture, Supabase Backend

### Community 21 - "Create Post: Type Step"
Cohesion: 0.33
Nodes (4): options, StepOneType(), StepOneTypeProps, TypeOption

### Community 22 - "Create Post Flow"
Cohesion: 0.33
Nodes (5): CreatePostFlow(), CreatePostStep, DraftCapablePostPayload, flowSteps, getUserPostsRoute()

### Community 23 - "Comment & Post Mutation Hooks"
Cohesion: 0.40
Nodes (4): useAddComment(), useCreatePost(), ManageUsers(), useAuth()

### Community 24 - "Edit Post"
Cohesion: 0.33
Nodes (3): usePost(), EditPost(), EditPostFormProps

### Community 25 - "Article Content Editor"
Cohesion: 0.33
Nodes (3): ArticleContentProps, EMPTY_ARTICLE_CONTENT, ToolbarButtonProps

### Community 27 - "Comments Service (FE)"
Cohesion: 0.40
Nodes (3): commentsService, Comment, CreateCommentPayload

## Knowledge Gaps
- **213 isolated node(s):** `name`, `private`, `dev:frontend`, `dev:backend`, `dev` (+208 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiFetch()` connect `Account Dialogs & Session Utils` to `Backend API & Services`, `Account Delete & Lifecycle Services`, `Comment & Post Mutation Hooks`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Comment & Post Mutation Hooks` to `Account Dialogs & Session Utils`, `Backend API & Services`, `Media Composers & Editors`, `Protected Route & Auth Lifecycle`, `Comments UI & Hooks`, `Article Composer & Tabs`, `Login/Signup Auth Flow`, `Post Feed & Post Hooks`, `Create Post Flow`, `Edit Post`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `CreatePostFlow()` connect `Create Post Flow` to `Account Dialogs & Session Utils`, `Media Composers & Editors`, `Article Composer & Tabs`, `Login/Signup Auth Flow`, `Create Post: Type Step`, `Comment & Post Mutation Hooks`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `useAuth()` (e.g. with `PostComposer()` and `CreatePostFlow()`) actually correct?**
  _`useAuth()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `apiFetch()` (e.g. with `deleteAccount()` and `recoverAccount()`) actually correct?**
  _`apiFetch()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `PostDetail()` (e.g. with `PostCard()` and `usePost()`) actually correct?**
  _`PostDetail()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `dev:frontend` to the rest of the system?**
  _218 weakly-connected nodes found - possible documentation gaps or missing edges._