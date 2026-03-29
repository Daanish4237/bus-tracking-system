# Manual Test Verification - Bus Tracking System

## Test Date: 2024
## Tester: System Verification

## Overview
This document provides a comprehensive manual test checklist for verifying the complete passenger workflow of the Bus Tracking System.

## Prerequisites
- Backend server running on `http://localhost:3000`
- Frontend development server running (typically `http://localhost:5173`)
- Browser with developer console open for debugging

## Test Scenarios

### Test 1: Initial Application Load
**Requirement: 1.1 - Display all available routes**

**Steps:**
1. Open the application in a web browser
2. Observe the "Available Routes" section

**Expected Results:**
- ✓ Application loads without errors
- ✓ Three routes are displayed:
  - Route 101 - Downtown Express
  - Route 202 - Uptown Local
  - Route 303 - Crosstown Shuttle
- ✓ Each route shows both identifier and name (Requirement 1.2)
- ✓ Routes are clickable/selectable

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________________________

---

### Test 2: Route Selection and Stop Display
**Requirements: 1.3, 1.4 - Display stops in sequential order**

**Steps:**
1. Click on "Route 101 - Downtown Express"
2. Observe the "Route Stops" section
3. Count the number of stops displayed
4. Verify the stop sequence

**Expected Results:**
- ✓ Route is visually highlighted as selected
- ✓ All 5 stops are displayed in order:
  1. Central Station
  2. City Hall
  3. Union Square
  4. Financial District
  5. Battery Park
- ✓ Stops appear in the "Select Your Drop-off Stop" section (Requirement 2.1)
- ✓ All stops are selectable options

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________________________

---

### Test 3: Drop-off Stop Selection
**Requirements: 2.2, 2.3, 2.4, 2.5 - Stop selection with visual feedback**

**Steps:**
1. With Route 101 selected, click on "Union Square" stop
2. Observe visual feedback
3. Check browser console for confirmation
4. Click on a different stop (e.g., "Financial District")
5. Observe that previous selection is cleared

**Expected Results:**
- ✓ Selected stop is visually highlighted (Requirement 2.3)
- ✓ Console shows: "Stop selected: stop-101-3" (Requirement 2.2)
- ✓ Console shows: "Drop-off stop set to: Union Square..."
- ✓ Only one stop is selected at a time (Requirement 2.4)
- ✓ Previous selection is cleared when new stop is selected (Requirement 2.5)

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________________________

---

### Test 4: Real-time Bus Location Display
**Requirements: 3.1, 3.2, 3.5 - Display bus locations**

**Steps:**
1. With Route 101 selected, observe the "Live Bus Tracking" section
2. Check for bus location information
3. Verify bus details are displayed

**Expected Results:**
- ✓ At least one bus (bus-001) is displayed on Route 101
- ✓ Bus location shows GPS coordinates (Requirement 3.1)
- ✓ Bus information includes:
  - Bus ID
  - Current location (latitude/longitude)
  - Last updated timestamp
  - Speed and heading (if available)
- ✓ Bus location is displayed on visual representation (Requirement 3.2)

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________________________

---

### Test 5: Stop-by-Stop Progress Tracking
**Requirements: 4.1, 4.2, 4.3 - Show stop completion status**

**Steps:**
1. With Route 101 selected and bus-001 visible
2. Observe the stop status indicators
3. Identify completed, current, and upcoming stops

**Expected Results:**
- ✓ All stops display a status (Requirement 4.1)
- ✓ Stops are visually distinguished by status (Requirement 4.3):
  - Completed stops (passed by bus)
  - Current stop (bus is at or near)
  - Upcoming stops (not yet reached)
- ✓ Stop status matches bus location (Requirement 4.2)
- ✓ Stops are in correct sequential order (Requirement 4.4)

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________________________

---

### Test 6: Multiple Routes Testing
**Requirements: All - Verify system works for different routes**

**Steps:**
1. Click on "Route 202 - Uptown Local"
2. Verify stops are displayed (should show 6 stops)
3. Select a drop-off stop
4. Verify bus tracking shows bus-002
5. Click on "Route 303 - Crosstown Shuttle"
6. Verify stops are displayed (should show 5 stops)
7. Verify bus tracking shows bus-003

**Expected Results:**
- ✓ Route 202 displays 6 stops in order
- ✓ Route 303 displays 5 stops in order
- ✓ Each route shows its respective bus(es)
- ✓ Previous route selection is cleared when new route is selected
- ✓ Stop selection is cleared when switching routes

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________________________

---

### Test 7: Real-time Updates
**Requirements: 3.3, 4.5 - GPS updates within 10 seconds**

**Steps:**
1. Select any route with an active bus
2. Note the "Last updated" timestamp
3. Wait 10-15 seconds
4. Observe if the timestamp updates

**Expected Results:**
- ✓ Bus location updates automatically (Requirement 3.3)
- ✓ Updates occur within 10 seconds
- ✓ Stop status updates when bus location changes (Requirement 4.5)
- ✓ No page refresh required for updates

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________________________

---

### Test 8: User Interface Responsiveness
**Requirements: 6.1, 6.2, 6.3, 6.4 - UI responsiveness**

**Steps:**
1. Click on various routes and stops
2. Measure response time (use browser dev tools if needed)
3. Observe visual feedback for all interactions
4. Switch between routes multiple times

**Expected Results:**
- ✓ All interactions respond within 500ms (Requirement 6.1)
- ✓ Information is displayed in clear, readable format (Requirement 6.2)
- ✓ View context is maintained during updates (Requirement 6.3)
- ✓ Visual feedback is provided for all clicks/taps (Requirement 6.4)

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________________________

---

### Test 9: GPS Data Validation
**Requirements: 7.1, 7.5 - GPS coordinate validation and timestamps**

**Steps:**
1. Open browser developer console
2. Select a route with active buses
3. Check console logs for GPS data
4. Verify coordinates are within valid ranges
5. Verify timestamps are present

**Expected Results:**
- ✓ GPS coordinates are within valid ranges:
  - Latitude: -90 to 90
  - Longitude: -180 to 180
- ✓ All bus locations have timestamps (Requirement 7.5)
- ✓ Timestamps are recent (within last few minutes)
- ✓ Invalid coordinates are rejected (if any)

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________________________

---

### Test 10: Error Handling
**Requirements: 3.4, 6.5 - Error handling and user feedback**

**Steps:**
1. Stop the backend server
2. Try to select a route
3. Observe error message
4. Restart the backend server
5. Try selecting a route again

**Expected Results:**
- ✓ User-friendly error message is displayed (Requirement 6.5)
- ✓ Error message explains the issue clearly
- ✓ System attempts to retry the request
- ✓ System recovers when backend is available again
- ✓ No application crash or unhandled errors

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________________________

---

## Complete Passenger Workflow Test
**Requirements: All - End-to-end user journey**

**Scenario:** A passenger wants to track their bus to Battery Park

**Steps:**
1. Open the application
2. View available routes
3. Select "Route 101 - Downtown Express"
4. View all stops on the route
5. Select "Battery Park" as drop-off stop
6. View bus location on the route
7. Observe stop progress (which stops are completed/upcoming)
8. Wait for automatic updates
9. Verify the complete experience is smooth and intuitive

**Expected Results:**
- ✓ All steps complete without errors
- ✓ Information is accurate and up-to-date
- ✓ Visual feedback is clear at each step
- ✓ Real-time updates work correctly
- ✓ User can easily understand bus progress toward their stop

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________________________

---

## Summary

### Test Results
- Total Tests: 11
- Passed: ___
- Failed: ___
- Pass Rate: ___%

### Critical Issues Found
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________

### Non-Critical Issues Found
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________

### Recommendations
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________

### Overall Assessment
[ ] System is ready for use
[ ] System needs minor fixes
[ ] System needs major fixes

### Tester Signature: _________________ Date: _________

