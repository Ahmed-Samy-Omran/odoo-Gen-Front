# Relation Click Lag Fix

## Problem
When creating relations in the ERD diagram, there was a noticeable lag/delay before the target model became clickable. The UI would freeze for a moment while processing the relation creation.

## Root Cause
The `onNodeClick` handler in ErdDiagram was executing heavy synchronous state updates:
- Schema transformation
- History updates  
- Multiple state updates (selectedNodeId, selectedField, selectedEdge, relationDraft)
- Viewport restoration with setTimeout

All these operations happened immediately on click, blocking the browser's main thread.

## Solution
Used React's `useTransition` hook to defer the expensive relation creation logic to a non-blocking update. This allows:
1. The UI to remain responsive to clicks instantly
2. React to prioritize the immediate state changes
3. Heavy operations to execute without blocking user interaction

## Changes Made

### File: `odoo-Gen-Front/src/components/ErdDiagram.tsx`

1. Added `useTransition` import:
   ```typescript
   import React, { useMemo, useCallback, useEffect, useRef, useState, useTransition } from 'react';
   ```

2. Added `useTransition` hook initialization:
   ```typescript
   const [, startTransition] = useTransition();
   ```

3. Wrapped `handleCreateRelation` call in `startTransition`:
   ```typescript
   onNodeClick={(_, node) => {
     if (relationDraft && relationDraft.sourceNodeId !== node.id) {
       // Defer heavy relation creation to transition to avoid blocking UI
       startTransition(() => {
         handleCreateRelation(relationDraft.sourceNodeId, node.id, relationDraft.sourceFieldName);
       });
       return;
     }
     // ... rest of handler
   }}
   ```

## How to Test

1. Ensure dev server is running: `npm run dev`
2. Go to ERD diagram in the app
3. Try to create a relation:
   - Click on a field or model to select it
   - Click "Add Relation" button  
   - Now click on target models
4. The click should be **instant** with no lag before the relation creates

## Result
The UI now responds immediately to clicks while the expensive schema updates happen in the background, providing a much snappier user experience.
