# Component Migration Summary

This document lists all the changes needed to migrate components from Supabase to the new API client.

## Files to Update

### 1. src/components/Dashboard.tsx
**Imports to change:**
- Remove: `import { supabase } from '../lib/supabase';`
- Add: `import { api } from '../lib/api';`

**Function changes:**
- `loadDashboardData()`:
  - `supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()` → `api.profile.get()`
  - `supabase.from('books').select('*').eq('user_id', user.id)...` → `api.books.list()`
  - `supabase.from('prompts')...` → `api.prompts.list({ limit: 5 })`

- `handleSaveDisplayName()`:
  - `supabase.from('profiles').update(...)` → `api.profile.update({ display_name: ... })`

- `loadAllPrompts()`:
  - `supabase.from('prompts')...` → `api.prompts.list()`

### 2. src/components/ProjectManager.tsx
**Imports to change:**
- Remove: `import { supabase } from '../lib/supabase';`
- Add: `import { api } from '../lib/api';`

**Function changes:**
- `loadProjects()`:
  - `supabase.from('series')...` → `api.series.list()`
  - `supabase.from('books')...` → `api.books.list()`

- `loadElements()`:
  - `supabase.from('story_elements')...` → `api.elements.list(bookId)`

- `handleCreateBook()`:
  - `supabase.from('books').insert(...)` → `api.books.create(...)`

- `handleCreateElement()`:
  - `supabase.from('story_elements').insert(...)` → `api.elements.create(...)`

- `handleDeleteElement()`:
  - `supabase.from('story_elements').delete()...` → `api.elements.delete(elementId)`

### 3. src/components/PromptInterface.tsx
**Imports to change:**
- Remove: `import { supabase } from '../lib/supabase';`
- Remove: `import { generateAIPrompt, getAvailableModes } from '../lib/openai';`
- Add: `import { api } from '../lib/api';`

**Function changes:**
- `loadBooks()`:
  - `supabase.from('prompts')...` → `api.prompts.list({ limit: 1 })`
  - `supabase.from('books')...` → `api.books.list()`

- `loadElements()`:
  - `supabase.from('story_elements')...` → `api.elements.list(bookId)`

- `loadPromptHistory()`:
  - `supabase.from('prompts')...` → `api.prompts.list({ limit: 20 })`
  - `supabase.from('responses')...` → `api.responses.list(promptId)`

- `generatePrompt()`:
  - `supabase.from('books').select('*').eq('id', selectedBook).single()` → Get from books state
  - `generateAIPrompt(...)` → `api.ai.generatePrompt(...)`
  - Remove all nested supabase queries

- `updateStreak()`:
  - `supabase.from('profiles').select(...)` → `api.profile.get()`
  - `supabase.from('profiles').update(...)` → `api.profile.update(...)`

- `savePromptAndResponse()`:
  - `supabase.from('prompts').insert(...)` → `api.prompts.create(...)`
  - `supabase.from('responses').insert(...)` → `api.responses.create(...)`

- `autoSaveResponse()`:
  - `supabase.from('responses').update(...)` → `api.responses.update(...)`
  - `supabase.from('responses').insert(...)` → `api.responses.create(...)`

### 4. src/components/StoryElementDetail.tsx
- `supabase.from('story_elements').update(...)` → `api.elements.update(...)`
- `supabase.from('prompts')...` → `api.prompts.list({ book_id: ... })`
- `supabase.from('responses')...` → `api.responses.list(promptId)`

### 5. src/components/PromptHistory.tsx
- No supabase calls (data passed as props)
- May need to update data structure if response types change

## Key Differences

1. **Error handling**: API returns throw errors instead of `{ error, data }` pattern
2. **Return values**: API directly returns data, not `{ data, error }`
3. **Authentication**: Handled via cookies/sessions, not explicit user_id in queries
4. **Simplified queries**: Backend handles user_id filtering automatically

## Migration Pattern

**Old:**
```typescript
const { data, error } = await supabase.from('table').select('*').eq('user_id', user.id);
if (error) { /* handle error */ }
if (data) { /* use data */ }
```

**New:**
```typescript
try {
  const data = await api.table.list();
  // use data
} catch (error) {
  // handle error
}
```
