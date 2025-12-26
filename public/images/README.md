# Farm Images Directory

Store your farm satellite imagery here.

## Instructions

1. Place your JPEG or PNG images in this folder (e.g., `my-farm.jpg`).
2. Update `constants.ts` in the project root to reference these files.

Example `constants.ts` update:

```typescript
export const MOCK_FARM: FarmData = {
  // ... other data
  imageUrl: '/images/my-farm.jpg' // Path relative to public folder
};
```
