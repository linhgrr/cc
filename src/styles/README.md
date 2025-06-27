# Standardized Button System

## Overview
This project uses a standardized button system to ensure consistent UI/UX across all components. The system includes predefined styles and a reusable Button component.

## Button Styles (`buttonStyles.js`)

### Available Variants

#### Primary Buttons
- `primary`: Standard primary button for main actions
- `primaryFixed`: Primary button with fixed width (192px)

#### Secondary Buttons  
- `secondary`: Standard secondary button for less prominent actions
- `secondaryFixed`: Secondary button with fixed width (192px)

#### Icon Buttons
- `icon`: Small circular button for control actions (32x32px)
- `iconSecondary`: Secondary style icon button

#### Language Selection Buttons
- `languageActive`: Active state for language selection
- `languageInactive`: Inactive state for language selection

#### Special Purpose
- `browse`: File upload browse button

## Button Component (`components/common/Button.jsx`)

### Props
- `variant`: Button style variant (default: 'primary')
- `size`: 'default' | 'fixed' 
- `disabled`: Boolean to disable button
- `loading`: Boolean to show loading state
- `icon`: React element to display as icon
- `onClick`: Click handler function
- `className`: Additional CSS classes
- `children`: Button content

### Usage Examples

```jsx
import Button from '../components/common/Button';

// Primary button
<Button variant="primary" onClick={handleClick}>
  Save
</Button>

// Secondary button with fixed width
<Button variant="secondary" size="fixed">
  Cancel
</Button>

// Icon button
<Button variant="icon" icon={<SaveIcon />} title="Save" />

// Language button
<Button 
  variant={isActive ? "languageActive" : "languageInactive"}
  onClick={() => setLanguage(lang)}
>
  English
</Button>

// Loading state
<Button variant="primary" loading={isLoading}>
  Processing...
</Button>
```

## Design Tokens

### Colors
- Primary: `#004098` (dark blue)
- Primary Hover: `#002e6e` 
- Secondary Background: `#F0F7FF` (light blue)
- Secondary Hover: `#E6F0FF`
- Border: `#0066CC` (medium blue)

### Spacing
- Standard padding: `px-6 py-2.5`
- Icon button: `w-8 h-8`
- Fixed width buttons: `w-48`

### Effects
- Shadow: `shadow-sm`
- Transition: `transition-colors duration-200`
- Border radius: `rounded-full`

## Migration Guide

When updating existing buttons:

1. Import the button styles or Button component
2. Replace inline classes with standardized variants
3. Ensure consistent spacing and effects
4. Test responsive behavior

### Before
```jsx
<button className="bg-[#004098] text-white px-8 py-2.5 w-48 rounded-full shadow hover:bg-[#002e6e] transition-colors">
  Translate
</button>
```

### After (Method 1 - Using styles)
```jsx
import { buttonStyles } from '../styles/buttonStyles';

<button className={buttonStyles.primaryFixed}>
  Translate  
</button>
```

### After (Method 2 - Using component)
```jsx
import Button from '../components/common/Button';

<Button variant="primary" size="fixed">
  Translate
</Button>
```

## Benefits

- **Consistency**: All buttons follow the same design patterns
- **Maintainability**: Changes to button styles can be made in one place
- **Reusability**: Common Button component reduces code duplication
- **Accessibility**: Consistent focus states and disabled handling
- **Performance**: Optimized class combinations and transitions 