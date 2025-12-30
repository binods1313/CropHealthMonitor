Quick Fix for Satellite Button Overlap:
Move the entire button group (SATELLITE, WEATHER, CROPLANDS, REFERENCE, TERRAIN) 0.5cm to the right to prevent it from overlapping with the search bar.
In CSS terms, add:

margin-left: 0.5cm or
left: 0.5cm (if using absolute positioning) or
Approximately margin-left: 19px (0.5cm ≈ 19px at standard screen DPI)

This should create enough space between the search section and these buttons to prevent overlap.

Zoom Controls (+/-) Size and Functionality:

The +/- zoom buttons appear too small and non-functional
Increase the button size to make them more visible and clickable (suggest minimum 40x40px touch target)
Verify click event handlers are properly attached
Add visual hover/active states to indicate they're interactive
Ensure z-index is high enough that they're not blocked by other elements


Configuration Modal Issue:

When opening the configuration/theme settings, the Firecrawl Credit Tracker card is displaying inside the modal
Remove or hide the Firecrawl Credit Tracker from the configuration modal
The configuration modal should only show appearance theme options (the color circles)
Check if the Credit Tracker is accidentally nested within the configuration component - it should be separate



Summary: Fix z-index layering conflicts, increase zoom button sizes, ensure proper event handlers, and separate the Credit Tracker from the configuration modal UI.