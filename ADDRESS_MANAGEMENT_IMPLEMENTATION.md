# Address Management Feature Implementation

## Overview
Added a comprehensive address management feature for customers that allows them to:
- Add, edit, and delete multiple addresses
- Set a default address
- Manage addresses from the Profile page
- Quickly select and manage addresses when posting a new task

## Components Created

### 1. AddressForm Component (`src/components/AddressForm.jsx`)
A reusable form component for adding and editing addresses.

**Features:**
- Form fields for: Label (Home/Work/Other), House Number, Area/Colony, Landmark, City, State, Pincode
- Input validation with error messages
- Set as default address checkbox
- Cancel and Submit buttons
- Supports both add (new) and edit (existing) modes
- Pincode validation (must be 6 digits)

**Props:**
- `address`: Optional address object to edit
- `onSubmit`: Callback function when form is submitted
- `onCancel`: Callback function when form is cancelled
- `isLoading`: Loading state boolean

### 2. AddressManager Component (`src/components/AddressManager.jsx`)
Complete address management interface with list view and form management.

**Features:**
- Display all saved addresses
- Add new address button
- Edit, Delete, and Set Default buttons for each address
- Address form integration
- Fetch addresses from API
- Delete with confirmation
- Set default address functionality
- Support for selection mode (for PostTaskPage integration)
- Loading and empty state handling

**Props:**
- `onAddressSelect`: Optional callback when an address is selected (for selection mode)
- `showSelectMode`: Boolean to show selection buttons instead of edit/delete
- `selectedAddressId`: Current selected address ID (for selection mode)

## Pages Updated

### 1. ProfilePage (`src/pages/ProfilePage.jsx`)
**Changes:**
- Added import for AddressManager component
- Updated tabs section to show tabs for all users (not just taskers)
- Added new "Addresses" tab alongside "Profile" and "Reviews & Ratings"
- Added Addresses tab content displaying AddressManager component
- Tab navigation includes address management for both customers and taskers

**Tab Structure:**
- Profile (all users)
- Addresses (all users) ← NEW
- Reviews & Ratings (taskers only)

### 2. PostTaskPage (`src/pages/PostTaskPage.jsx`)
**Changes:**
- Added import for AddressManager component
- Added state: `showAddressManager` to control modal visibility
- Added function: `handleAddressManagerClose()` to refresh addresses after manager modal closes
- Added function: `fetchAddresses()` to fetch user's addresses
- Added "Manage Addresses" button next to "Address Details" heading
- Added modal dialog that displays AddressManager component
- Modal appears when user clicks "Manage Addresses" button
- Modal closes and refreshes address list when done

**Features:**
- Non-intrusive modal design
- Refreshes address list after management
- Users can manage addresses without leaving the task creation form
- Modal overlay with semi-transparent background

## API Integration

The feature integrates with existing backend address APIs:
- `GET /api/users/profile/addresses` - Fetch all addresses
- `POST /api/users/profile/addresses` - Add new address
- `PUT /api/users/profile/addresses/:addressId` - Update address
- `DELETE /api/users/profile/addresses/:addressId` - Delete address
- `PUT /api/users/profile/addresses/:addressId/default` - Set default address

## Backend Model
The User model already contains the addresses field with the following structure:
```javascript
addresses: [
  {
    label: String (Home/Work/Other),
    pincode: String (required),
    houseNoBuilding: String (required),
    areaColony: String (required),
    landmark: String (optional),
    city: String (required),
    state: String (required),
    isDefault: Boolean (default: false)
  }
]
```

## User Experience Flow

### From Profile Page:
1. User clicks on "Addresses" tab in their profile
2. AddressManager component displays all saved addresses
3. User can:
   - Click "Add Address" to add a new address
   - Click "Edit" to modify an existing address
   - Click "Delete" to remove an address
   - Click "Set Default" to make an address the default

### From Post Task Page:
1. User navigates to the "Address Details" section
2. User can either:
   - Select from saved addresses in the dropdown
   - Click "Manage Addresses" to open the address manager modal
3. In the modal, user can:
   - Add new addresses
   - Edit existing addresses
   - Delete addresses
   - Set default address
4. User closes the modal (address list refreshes automatically)
5. New/updated addresses appear in the dropdown

## Form Validation
- All required fields must be filled
- Pincode must be exactly 6 digits
- Empty state handling when no addresses exist
- Error messages displayed below each field

## State Management
- Component-level state using React hooks (useState)
- API calls using axios with error handling
- Toast notifications for user feedback (success, error, confirmation)
- Loading states for async operations

## Styling
- Uses Tailwind CSS for responsive design
- Consistent with existing UI patterns
- Mobile-friendly layout
- Hover effects and transitions
- Error states with red text
- Success states with green badges
- Disabled states for loading

## Files Modified/Created
1. ✅ Created: `src/components/AddressForm.jsx` (new)
2. ✅ Created: `src/components/AddressManager.jsx` (new)
3. ✅ Updated: `src/pages/ProfilePage.jsx`
4. ✅ Updated: `src/pages/PostTaskPage.jsx`

## Testing Checklist
- [ ] Navigate to Profile page and click Addresses tab
- [ ] Add a new address from Profile page
- [ ] Edit an existing address
- [ ] Delete an address
- [ ] Set an address as default
- [ ] Navigate to Post Task page
- [ ] Click "Manage Addresses" button
- [ ] Add/edit addresses from the modal
- [ ] Verify address list refreshes after modal closes
- [ ] Verify address selection dropdown updates
- [ ] Test on mobile devices
- [ ] Test form validation (try submitting with empty fields)
- [ ] Test pincode validation (try non-6-digit values)
