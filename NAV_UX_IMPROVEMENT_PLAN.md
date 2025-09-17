
# Navigation UX Improvement Plan

## 1. Goal

Improve the user experience of the main navigation dropdown menu by making it close automatically after a navigation item is selected.

## 2. Problem

Currently, when a user clicks an item in the user navigation dropdown (top right), the dropdown remains open. The user must click outside the menu to close it, which is an unnecessary extra step and feels clunky.

## 3. Component to Modify

The target component for this change is `src/components/layout/UserNav.tsx`.

## 4. Proposed Solution (Option 1)

The best solution is to make the dropdown close automatically upon item selection. This is a common and expected UX pattern.

### Implementation Strategy

1.  **Analyze `UserNav.tsx`:** Inspect the component to see how the `DropdownMenu` from `shadcn/ui` is being used. The navigation items are likely composed of `<DropdownMenuItem>` wrapping a Next.js `<Link>` component.
2.  **Use `asChild` prop:** The `<DropdownMenuItem>` component from `shadcn/ui` includes an `asChild` prop. When a `<Link>` component is passed as its child, using `asChild` merges the properties and behavior of both. This is the standard way to make navigation items within a dropdown work correctly and trigger the dropdown's default "onSelect" behavior, which includes closing the menu.
3.  **Alternative (Fallback): Controlled Component:** If the `asChild` prop doesn't work as expected (which is highly unlikely), the fallback plan is to convert the `DropdownMenu` into a controlled component.
    *   Introduce a state variable: `const [open, setOpen] = useState(false);`
    *   Bind this state to the `DropdownMenu`'s `open` and `onOpenChange` props.
    *   Add an `onClick` handler to each navigation `<Link>` that calls `setOpen(false)`.

The `asChild` approach is much cleaner and is the preferred, idiomatic solution for `shadcn/ui`.

## 5. Next Steps

1.  Get user approval for this plan.
2.  Ask the user to switch to **Standard Mode**.
3.  Open `src/components/layout/UserNav.tsx`.
4.  Apply the `asChild` prop to the `<DropdownMenuItem>` components that contain `<Link>` components for navigation.
5.  Test the functionality in the preview to ensure the menu closes on click as expected.
