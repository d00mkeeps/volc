# Volc AI Gym Coach API Reference

> *Auto-generated on every push via GitHub Actions. Do not edit manually.*  
> **Last Generated:** 2026-09-22 09:46:13 UTC  
> **Total Endpoints:** 47

## Endpoints Summary

| Method | Endpoint | Handler | Source File | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | [`/`](#-get) | `root()` | `backend/app/main.py:123` | No description provided. |
| `POST` | [`/account/delete`](#accountdelete-post) | `delete_user_account()` | `backend/app/api/endpoints/db.py:182` | Delete the current user's account permanently |
| `GET` | [`/api/admin/dashboard/metrics`](#apiadmindashboardmetrics-get) | `get_dashboard_metrics()` | `backend/app/api/endpoints/admin_dashboard.py:30` | Retrieve current cached admin analytics metrics for the 3 dashboard tabs. |
| `POST` | [`/api/admin/dashboard/refresh`](#apiadmindashboardrefresh-post) | `refresh_dashboard_metrics()` | `backend/app/api/endpoints/admin_dashboard.py:42` | Force an immediate recalculation of all analytics metrics. |
| `GET` | [`/api/admin/llm-stats`](#apiadminllm-stats-get) | `get_llm_stats()` | `backend/app/api/endpoints/admin.py:143` | Get LLM-specific performance metrics for the admin dashboard. |
| `POST` | [`/api/admin/seed/workout`](#apiadminseedworkout-post) | `seed_workout()` | `backend/app/api/endpoints/admin.py:341` | Seed a workout with backdated timestamp for test users. |
| `GET` | [`/api/admin/stats`](#apiadminstats-get) | `get_admin_stats()` | `backend/app/api/endpoints/admin.py:36` | Get aggregated telemetry stats for the admin dashboard. |
| `POST` | [`/api/admin/test/provision`](#apiadmintestprovision-post) | `provision_test_user()` | `backend/app/api/endpoints/admin.py:305` | Provision a fresh test user with profile and AI memory. |
| `DELETE` | [`/api/admin/test/teardown/{email}`](#apiadmintestteardown{email}-delete) | `teardown_test_user()` | `backend/app/api/endpoints/admin.py:326` | Delete a test user and all associated data by email. |
| `POST` | [`/api/analysis/basic/regenerate`](#apianalysisbasicregenerate-post) | `regenerate_analysis_bundle()` | `backend/app/api/endpoints/workout_analysis.py:47` | Regenerate the user's basic analysis bundle. |
| `GET` | [`/api/dashboard`](#apidashboard-get) | `get_dashboard_data()` | `backend/app/api/endpoints/dashboard.py:53` | Get dashboard analytics data for all timeframes |
| `POST` | [`/api/v1/chat/quick-actions/{user_id}`](#apiv1chatquick-actions{user_id}-post) | `get_quick_chat_actions()` | `backend/app/api/endpoints/chat.py:19` | Get dynamic, contextual chat actions for the user based on their active context. |
| `POST` | [`/api/workout-analysis`](#apiworkout-analysis-post) | `create_workout_analysis()` | `backend/app/api/endpoints/workout_analysis.py:16` | Initiate a workout analysis and conversation. |
| `GET` | [`/biceps`](#biceps-get) | `get_bicep_leaderboard()` | `backend/app/api/endpoints/leaderboard.py:35` | Get bicep leaderboard rankings |
| `GET` | [`/context-bundles`](#context-bundles-get) | `get_context_bundles()` | `backend/app/api/endpoints/db.py:88` | Get all analysis bundles for a conversation |
| `DELETE` | [`/context-bundles/conversation/{conversation_id}`](#context-bundlesconversation{conversation_id}-delete) | `delete_conversation_bundles()` | `backend/app/api/endpoints/db.py:160` | Delete all analysis bundles for a conversation |
| `DELETE` | [`/context-bundles/{bundle_id}`](#context-bundles{bundle_id}-delete) | `delete_analysis_bundle()` | `backend/app/api/endpoints/db.py:119` | Delete analysis bundle |
| `GET` | [`/conversations`](#conversations-get) | `get_user_conversations()` | `backend/app/api/endpoints/db.py:419` | Get all active conversations for a user |
| `POST` | [`/conversations`](#conversations-post) | `create_conversation()` | `backend/app/api/endpoints/db.py:372` | Create a new conversation with the first message |
| `POST` | [`/conversations/with-messages`](#conversationswith-messages-post) | `create_conversation_with_messages()` | `backend/app/api/endpoints/db.py:392` | Create a new conversation with initial messages |
| `DELETE` | [`/conversations/{conversation_id}`](#conversations{conversation_id}-delete) | `delete_conversation()` | `backend/app/api/endpoints/db.py:139` | Delete a conversation |
| `GET` | [`/conversations/{conversation_id}/messages`](#conversations{conversation_id}messages-get) | `get_conversation_messages()` | `backend/app/api/endpoints/db.py:444` | Get all messages for a conversation |
| `POST` | [`/conversations/{conversation_id}/messages`](#conversations{conversation_id}messages-post) | `save_message()` | `backend/app/api/endpoints/db.py:469` | Save a message to a conversation |
| `DELETE` | [`/debug/trace/{session_id}`](#debugtrace{session_id}-delete) | `clear_session_trace()` | `backend/app/api/endpoints/llm.py:283` | Clear recorded trace for a session. |
| `GET` | [`/debug/trace/{session_id}`](#debugtrace{session_id}-get) | `get_session_trace()` | `backend/app/api/endpoints/llm.py:274` | Expose recorded trace for a session. |
| `GET` | [`/exercise-definitions`](#exercise-definitions-get) | `get_exercise_definitions()` | `backend/app/api/endpoints/db.py:33` | Get all exercise definitions |
| `GET` | [`/glossary-terms`](#glossary-terms-get) | `get_glossary_terms()` | `backend/app/api/endpoints/db.py:551` | Get all glossary terms (uses cache) |
| `GET` | [`/glossary-terms/{term_id}`](#glossary-terms{term_id}-get) | `get_glossary_term()` | `backend/app/api/endpoints/db.py:564` | Get single glossary term by UUID |
| `GET` | [`/health`](#health-get) | `health_check()` | `backend/app/main.py:128` | Basic health check endpoint to verify the API is running |
| `GET` | [`/me`](#me-get) | `get_current_user_info()` | `backend/app/api/endpoints/auth.py:18` | Get the current user's information |
| `POST` | [`/temp-upload`](#temp-upload-post) | `create_temp_image()` | `backend/app/api/endpoints/images.py:14` | No description provided. |
| `POST` | [`/upload-url`](#upload-url-post) | `get_image_upload_url()` | `backend/app/api/endpoints/images.py:97` | Get a signed upload URL for image storage |
| `GET` | [`/user-context/latest`](#user-contextlatest-get) | `get_latest_user_context()` | `backend/app/api/endpoints/db.py:64` | Get the latest completed user context bundle |
| `GET` | [`/user-profile`](#user-profile-get) | `get_user_profile()` | `backend/app/api/endpoints/db.py:490` | Get the current user's profile |
| `POST` | [`/user-profile`](#user-profile-post) | `save_user_profile()` | `backend/app/api/endpoints/db.py:513` | Save or update the current user's profile |
| `POST` | [`/user-profile/onboarding`](#user-profileonboarding-post) | `complete_onboarding()` | `backend/app/api/endpoints/db.py:531` | Complete user onboarding |
| `POST` | [`/workouts`](#workouts-post) | `create_workout()` | `backend/app/api/endpoints/db.py:226` | Create a new workout |
| `GET` | [`/workouts/public/{workout_id}`](#workoutspublic{workout_id}-get) | `get_public_workout()` | `backend/app/api/endpoints/db.py:336` | Get a workout by ID with admin privileges (for leaderboard viewing) |
| `PUT` | [`/workouts/template/{template_id}`](#workoutstemplate{template_id}-put) | `update_template_usage()` | `backend/app/api/endpoints/db.py:354` | Update the used_as_template timestamp for a workout |
| `GET` | [`/workouts/templates`](#workoutstemplates-get) | `get_templates()` | `backend/app/api/endpoints/db.py:48` | Get all workout templates for a user |
| `GET` | [`/workouts/user`](#workoutsuser-get) | `get_user_workouts()` | `backend/app/api/endpoints/db.py:250` | Get all workouts for a user (not filtered by conversation) |
| `DELETE` | [`/workouts/{workout_id}`](#workouts{workout_id}-delete) | `delete_workout()` | `backend/app/api/endpoints/db.py:318` | Delete a workout |
| `GET` | [`/workouts/{workout_id}`](#workouts{workout_id}-get) | `get_workout()` | `backend/app/api/endpoints/db.py:275` | Get a workout by ID |
| `PUT` | [`/workouts/{workout_id}`](#workouts{workout_id}-put) | `update_workout()` | `backend/app/api/endpoints/db.py:293` | Update an existing workout |
| `POST` | [`/{image_id}/commit`](#{image_id}commit-post) | `commit_image()` | `backend/app/api/endpoints/images.py:51` | Commit a temporary image to permanent status |
| `GET` | [`/{image_id}/url`](#{image_id}url-get) | `get_image_url()` | `backend/app/api/endpoints/images.py:72` | Get image URL - allows access to public workout images |
| `DELETE` | [`/{image_path:path}`](#{image_pathpath}-delete) | `delete_image()` | `backend/app/api/endpoints/images.py:124` | Delete an image from storage |

---

## Endpoint Details

### `GET /`
**Handler:** `root()` (`backend/app/main.py:123`)  
**Description:** No description provided.  

```bash
curl -s http://127.0.0.1:8000/
```

### `POST /account/delete`
**Handler:** `delete_user_account()` (`backend/app/api/endpoints/db.py:182`)  
**Description:** Delete the current user's account permanently  
**Parameters:** `confirmation, user, jwt_token`  

```bash
curl -s -X POST http://127.0.0.1:8000/account/delete \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `GET /api/admin/dashboard/metrics`
**Handler:** `get_dashboard_metrics()` (`backend/app/api/endpoints/admin_dashboard.py:30`)  
**Description:** Retrieve current cached admin analytics metrics for the 3 dashboard tabs.  
**Parameters:** `_`  

```bash
curl -s http://127.0.0.1:8000/api/admin/dashboard/metrics
```

### `POST /api/admin/dashboard/refresh`
**Handler:** `refresh_dashboard_metrics()` (`backend/app/api/endpoints/admin_dashboard.py:42`)  
**Description:** Force an immediate recalculation of all analytics metrics.  
**Parameters:** `_`  

```bash
curl -s -X POST http://127.0.0.1:8000/api/admin/dashboard/refresh \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `GET /api/admin/llm-stats`
**Handler:** `get_llm_stats()` (`backend/app/api/endpoints/admin.py:143`)  
**Description:** Get LLM-specific performance metrics for the admin dashboard.
Requires 'admin' permission_level.

Returns:
    - Token statistics (input/output, averages, min/max)
    - Latency statistics (avg, P50, P95, P99)
    - Volume statistics (total requests, breakdown by model/endpoint)  
**Parameters:** `user`  

```bash
curl -s http://127.0.0.1:8000/api/admin/llm-stats
```

### `POST /api/admin/seed/workout`
**Handler:** `seed_workout()` (`backend/app/api/endpoints/admin.py:341`)  
**Description:** Seed a workout with backdated timestamp for test users.
Allows Crucible to populate historical workout data.

Security:
- Requires X-Admin-Key header matching ADMIN_TEST_KEY
- Only enabled in non-production environments
- Validates user exists before creating workout  
**Parameters:** `_`  

```bash
curl -s -X POST http://127.0.0.1:8000/api/admin/seed/workout \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `GET /api/admin/stats`
**Handler:** `get_admin_stats()` (`backend/app/api/endpoints/admin.py:36`)  
**Description:** Get aggregated telemetry stats for the admin dashboard.
Requires 'admin' permission_level.  
**Parameters:** `user`  

```bash
curl -s http://127.0.0.1:8000/api/admin/stats
```

### `POST /api/admin/test/provision`
**Handler:** `provision_test_user()` (`backend/app/api/endpoints/admin.py:305`)  
**Description:** Provision a fresh test user with profile and AI memory.  
**Parameters:** `persona_config, _`  

```bash
curl -s -X POST http://127.0.0.1:8000/api/admin/test/provision \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `DELETE /api/admin/test/teardown/{email}`
**Handler:** `teardown_test_user()` (`backend/app/api/endpoints/admin.py:326`)  
**Description:** Delete a test user and all associated data by email.  
**Parameters:** `email, _`  

```bash
curl -s -X DELETE http://127.0.0.1:8000/api/admin/test/teardown/{email} \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `POST /api/analysis/basic/regenerate`
**Handler:** `regenerate_analysis_bundle()` (`backend/app/api/endpoints/workout_analysis.py:47`)  
**Description:** Regenerate the user's basic analysis bundle.

This analyzes the last 30 days of workouts and creates/updates
the user's basic bundle with:
- Top strength/volume performers
- Consistency metrics
- Short-term trends

Rate limits:
- Testers: 1 per hour
- Admins: 3 per hour  
**Parameters:** `user, jwt_token`  

```bash
curl -s -X POST http://127.0.0.1:8000/api/analysis/basic/regenerate \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `GET /api/dashboard`
**Handler:** `get_dashboard_data()` (`backend/app/api/endpoints/dashboard.py:53`)  
**Description:** Get dashboard analytics data for all timeframes  
**Parameters:** `user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/api/dashboard
```

### `POST /api/v1/chat/quick-actions/{user_id}`
**Handler:** `get_quick_chat_actions()` (`backend/app/api/endpoints/chat.py:19`)  
**Description:** Get dynamic, contextual chat actions for the user based on their active context.
Accepts optional 'messages' payload to include recent conversation history without DB lookup.  
**Parameters:** `user_id, messages, action_service`  

```bash
curl -s -X POST http://127.0.0.1:8000/api/v1/chat/quick-actions/{user_id} \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `POST /api/workout-analysis`
**Handler:** `create_workout_analysis()` (`backend/app/api/endpoints/workout_analysis.py:16`)  
**Description:** Initiate a workout analysis and conversation.  
**Parameters:** `request_data, user, jwt_token`  

```bash
curl -s -X POST http://127.0.0.1:8000/api/workout-analysis \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `GET /biceps`
**Handler:** `get_bicep_leaderboard()` (`backend/app/api/endpoints/leaderboard.py:35`)  
**Description:** Get bicep leaderboard rankings  
**Parameters:** `user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/biceps
```

### `GET /context-bundles`
**Handler:** `get_context_bundles()` (`backend/app/api/endpoints/db.py:88`)  
**Description:** Get all analysis bundles for a conversation  
**Parameters:** `conversation_id, user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/context-bundles
```

### `DELETE /context-bundles/conversation/{conversation_id}`
**Handler:** `delete_conversation_bundles()` (`backend/app/api/endpoints/db.py:160`)  
**Description:** Delete all analysis bundles for a conversation  
**Parameters:** `conversation_id, user, jwt_token`  

```bash
curl -s -X DELETE http://127.0.0.1:8000/context-bundles/conversation/{conversation_id} \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `DELETE /context-bundles/{bundle_id}`
**Handler:** `delete_analysis_bundle()` (`backend/app/api/endpoints/db.py:119`)  
**Description:** Delete analysis bundle  
**Parameters:** `bundle_id, user, jwt_token`  

```bash
curl -s -X DELETE http://127.0.0.1:8000/context-bundles/{bundle_id} \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `GET /conversations`
**Handler:** `get_user_conversations()` (`backend/app/api/endpoints/db.py:419`)  
**Description:** Get all active conversations for a user  
**Parameters:** `user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/conversations
```

### `POST /conversations`
**Handler:** `create_conversation()` (`backend/app/api/endpoints/db.py:372`)  
**Description:** Create a new conversation with the first message  
**Parameters:** `data, user, jwt_token`  

```bash
curl -s -X POST http://127.0.0.1:8000/conversations \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `POST /conversations/with-messages`
**Handler:** `create_conversation_with_messages()` (`backend/app/api/endpoints/db.py:392`)  
**Description:** Create a new conversation with initial messages  
**Parameters:** `data, user, jwt_token`  

```bash
curl -s -X POST http://127.0.0.1:8000/conversations/with-messages \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `DELETE /conversations/{conversation_id}`
**Handler:** `delete_conversation()` (`backend/app/api/endpoints/db.py:139`)  
**Description:** Delete a conversation  
**Parameters:** `conversation_id, user, jwt_token`  

```bash
curl -s -X DELETE http://127.0.0.1:8000/conversations/{conversation_id} \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `GET /conversations/{conversation_id}/messages`
**Handler:** `get_conversation_messages()` (`backend/app/api/endpoints/db.py:444`)  
**Description:** Get all messages for a conversation  
**Parameters:** `conversation_id, user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/conversations/{conversation_id}/messages
```

### `POST /conversations/{conversation_id}/messages`
**Handler:** `save_message()` (`backend/app/api/endpoints/db.py:469`)  
**Description:** Save a message to a conversation  
**Parameters:** `conversation_id, data, user, jwt_token`  

```bash
curl -s -X POST http://127.0.0.1:8000/conversations/{conversation_id}/messages \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `DELETE /debug/trace/{session_id}`
**Handler:** `clear_session_trace()` (`backend/app/api/endpoints/llm.py:283`)  
**Description:** Clear recorded trace for a session.  
**Parameters:** `session_id`  

```bash
curl -s -X DELETE http://127.0.0.1:8000/debug/trace/{session_id} \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `GET /debug/trace/{session_id}`
**Handler:** `get_session_trace()` (`backend/app/api/endpoints/llm.py:274`)  
**Description:** Expose recorded trace for a session.  
**Parameters:** `session_id`  

```bash
curl -s http://127.0.0.1:8000/debug/trace/{session_id}
```

### `GET /exercise-definitions`
**Handler:** `get_exercise_definitions()` (`backend/app/api/endpoints/db.py:33`)  
**Description:** Get all exercise definitions  
**Parameters:** `user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/exercise-definitions
```

### `GET /glossary-terms`
**Handler:** `get_glossary_terms()` (`backend/app/api/endpoints/db.py:551`)  
**Description:** Get all glossary terms (uses cache)  
**Parameters:** `user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/glossary-terms
```

### `GET /glossary-terms/{term_id}`
**Handler:** `get_glossary_term()` (`backend/app/api/endpoints/db.py:564`)  
**Description:** Get single glossary term by UUID  
**Parameters:** `term_id, user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/glossary-terms/{term_id}
```

### `GET /health`
**Handler:** `health_check()` (`backend/app/main.py:128`)  
**Description:** Basic health check endpoint to verify the API is running  

```bash
curl -s http://127.0.0.1:8000/health
```

### `GET /me`
**Handler:** `get_current_user_info()` (`backend/app/api/endpoints/auth.py:18`)  
**Description:** Get the current user's information
This is useful for validating tokens on the client  
**Parameters:** `user`  

```bash
curl -s http://127.0.0.1:8000/me
```

### `POST /temp-upload`
**Handler:** `create_temp_image()` (`backend/app/api/endpoints/images.py:14`)  
**Description:** No description provided.  
**Parameters:** `data, user, jwt_token`  

```bash
curl -s -X POST http://127.0.0.1:8000/temp-upload \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `POST /upload-url`
**Handler:** `get_image_upload_url()` (`backend/app/api/endpoints/images.py:97`)  
**Description:** Get a signed upload URL for image storage
(Legacy endpoint - consider migrating to /temp-upload)  
**Parameters:** `data, user, jwt_token`  

```bash
curl -s -X POST http://127.0.0.1:8000/upload-url \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `GET /user-context/latest`
**Handler:** `get_latest_user_context()` (`backend/app/api/endpoints/db.py:64`)  
**Description:** Get the latest completed user context bundle  
**Parameters:** `user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/user-context/latest
```

### `GET /user-profile`
**Handler:** `get_user_profile()` (`backend/app/api/endpoints/db.py:490`)  
**Description:** Get the current user's profile  
**Parameters:** `user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/user-profile
```

### `POST /user-profile`
**Handler:** `save_user_profile()` (`backend/app/api/endpoints/db.py:513`)  
**Description:** Save or update the current user's profile  
**Parameters:** `data, user, jwt_token`  

```bash
curl -s -X POST http://127.0.0.1:8000/user-profile \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `POST /user-profile/onboarding`
**Handler:** `complete_onboarding()` (`backend/app/api/endpoints/db.py:531`)  
**Description:** Complete user onboarding  
**Parameters:** `data, user, jwt_token`  

```bash
curl -s -X POST http://127.0.0.1:8000/user-profile/onboarding \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `POST /workouts`
**Handler:** `create_workout()` (`backend/app/api/endpoints/db.py:226`)  
**Description:** Create a new workout  
**Parameters:** `workout, user, jwt_token`  

```bash
curl -s -X POST http://127.0.0.1:8000/workouts \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `GET /workouts/public/{workout_id}`
**Handler:** `get_public_workout()` (`backend/app/api/endpoints/db.py:336`)  
**Description:** Get a workout by ID with admin privileges (for leaderboard viewing)  
**Parameters:** `workout_id, user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/workouts/public/{workout_id}
```

### `PUT /workouts/template/{template_id}`
**Handler:** `update_template_usage()` (`backend/app/api/endpoints/db.py:354`)  
**Description:** Update the used_as_template timestamp for a workout  
**Parameters:** `template_id, user, jwt_token`  

```bash
curl -s -X PUT http://127.0.0.1:8000/workouts/template/{template_id} \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `GET /workouts/templates`
**Handler:** `get_templates()` (`backend/app/api/endpoints/db.py:48`)  
**Description:** Get all workout templates for a user  
**Parameters:** `user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/workouts/templates
```

### `GET /workouts/user`
**Handler:** `get_user_workouts()` (`backend/app/api/endpoints/db.py:250`)  
**Description:** Get all workouts for a user (not filtered by conversation)  
**Parameters:** `user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/workouts/user
```

### `DELETE /workouts/{workout_id}`
**Handler:** `delete_workout()` (`backend/app/api/endpoints/db.py:318`)  
**Description:** Delete a workout  
**Parameters:** `workout_id, user, jwt_token`  

```bash
curl -s -X DELETE http://127.0.0.1:8000/workouts/{workout_id} \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `GET /workouts/{workout_id}`
**Handler:** `get_workout()` (`backend/app/api/endpoints/db.py:275`)  
**Description:** Get a workout by ID  
**Parameters:** `workout_id, user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/workouts/{workout_id}
```

### `PUT /workouts/{workout_id}`
**Handler:** `update_workout()` (`backend/app/api/endpoints/db.py:293`)  
**Description:** Update an existing workout  
**Parameters:** `workout_id, workout, user, jwt_token`  

```bash
curl -s -X PUT http://127.0.0.1:8000/workouts/{workout_id} \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `POST /{image_id}/commit`
**Handler:** `commit_image()` (`backend/app/api/endpoints/images.py:51`)  
**Description:** Commit a temporary image to permanent status  
**Parameters:** `image_id, user, jwt_token`  

```bash
curl -s -X POST http://127.0.0.1:8000/{image_id}/commit \
  -H "Content-Type: application/json" \
  -d '{}'
```

### `GET /{image_id}/url`
**Handler:** `get_image_url()` (`backend/app/api/endpoints/images.py:72`)  
**Description:** Get image URL - allows access to public workout images  
**Parameters:** `image_id, user, jwt_token`  

```bash
curl -s http://127.0.0.1:8000/{image_id}/url
```

### `DELETE /{image_path:path}`
**Handler:** `delete_image()` (`backend/app/api/endpoints/images.py:124`)  
**Description:** Delete an image from storage  
**Parameters:** `image_path, user, jwt_token`  

```bash
curl -s -X DELETE http://127.0.0.1:8000/{image_path:path} \
  -H "Content-Type: application/json" \
  -d '{}'
```
