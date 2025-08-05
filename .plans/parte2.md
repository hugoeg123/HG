Centralized Semantic Color System
UI Color Management Enhancement (Brownfield)
## Story
**As a** developer,
**I want** a centralized semantic color system in Tailwind CSS,
**so that** I can easily edit colors in the future without manual searches, while preserving the current dark mode aesthetics, registration tags styles, and left sidebar tonal grays exactly as is.
## Acceptance Criteria
1.  **✅ (Configuration)** The `frontend/tailwind.config.js` file is updated with a new semantic color palette (`theme-background`, `theme-surface`, `theme-card`, `theme-border`) that maps **exactly** to the current hardcoded hex values.
2.  **✅ (Code Quality)** All hardcoded hex color classes (`bg-[#...]`) and inline styles (`style={{backgroundColor: ...}}`) related to the primary palette are removed from all `.jsx` and `.tsx` files and replaced with the new semantic classes.
3.  **✅ (Visual Integrity)** A visual comparison of the application before and after the refactor shows **zero regressions or changes** to the UI. Special attention must be paid to:
    * The tonal differences in the **Left Sidebar** between the background and the patient list items.
    * The background, border, and text colors of tags in the **TagToolbar** and **SectionBlock** components.
4.  **✅ (Maintainability)** A test change to a semantic color in `tailwind.config.js` (e.g., modifying `theme-card`) correctly and globally updates the color of all associated components after a server restart.
5.  **✅ (Documentation)** A new file, `frontend/docs/REFATORACAO-CORES.md`, is created, documenting the new semantic color system and its usage guidelines.
## Tasks / Subtasks
-   [ ] **Phase 0: Baseline Verification**
    -   [ ] Take "before" screenshots of the following key components for visual validation: `LeftSidebar`, `HybridEditor` (showing `TagToolbar` and `SectionBlock`), and `PatientDashboard`.
-   [ ] **Phase 1: Configuration**
    -   [ ] Modify `frontend/tailwind.config.js` to add the new semantic color palette as defined in the Dev Notes.
-   [ ] **Phase 2: Phased Implementation & Validation**
    -   [ ] **Step 2.1: Layout Components.**
        -   [ ] Refactor `MainLayout.jsx`.
        -   [ ] Refactor `LeftSidebar.jsx`.
        -   [ ] Refactor `RightSidebar.jsx`.
        -   [ ] Refactor `Navbar.jsx`.
        -   [ ] **VALIDATE:** Compare the running application with baseline screenshots. Ensure no visual changes.
    -   [ ] **Step 2.2: Critical Patient View Components.**
        -   [ ] Refactor `HybridEditor.jsx`.
        -   [ ] Refactor `TagToolbar.jsx`.
        -   [ ] Refactor `SectionBlock.jsx`.
        -   [ ] **VALIDATE:** Meticulously compare tag and editor styles with baseline screenshots.
    -   [ ] **Step 2.3: Dashboard & UI Components.**
        -   [ ] Refactor `PatientDashboard.jsx`.
        -   [ ] Refactor `Dashboard.jsx`.
        -   [ ] Refactor components in `frontend/src/components/ui/` (`card.tsx`, `dialog.tsx`, `input.tsx`).
        -   [ ] **VALIDATE:** Compare with baseline screenshots.
    -   [ ] **Step 2.4: Global Styles & Final Sweep.**
        -   [ ] Update `frontend/src/index.css` to use semantic classes where applicable.
        -   [ ] Perform a project-wide search for any remaining hardcoded hex values from the palette and replace them.
-   [ ] **Phase 3: Documentation**
    -   [ ] Create the `frontend/docs/REFATORACAO-CORES.md` documentation.
## Dev Notes
-   **CRITICAL DIRECTIVE:** The primary goal is a **technical refactor with zero visual changes**. The application must look identical after the changes. This is a non-negotiable requirement.
-   **Semantic Color Mapping (Source of Truth):**
    -   `#1a1e23` -> `theme-background` (Apply with `bg-theme-background`)
    -   `#1C1C1F` -> `theme-surface` (Apply with `bg-theme-surface`)
    -   `#22262b` -> `theme-card` (Apply with `bg-theme-card`)
    -   `#374151` -> `theme-border` (Apply with `border-theme-border`)
-   **Tailwind Configuration Snippet:**

    ```javascript
    // In frontend/tailwind.config.js, inside theme.extend.colors:
    colors: {
      // --- Semantic Color System ---
      'theme-background': '#1a1e23', // Main background for app body and sidebars
      'theme-surface': '#1C1C1F',    // Panels and distinct content areas
      'theme-card': '#22262b',       // Interactive items: cards, inputs, modals
      'theme-border': '#374151',     // Standard borders

      // Existing colors...
      darkBg: '#111827',
      lightBg: '#1f2937',
      border: 'hsl(var(--border))',
      primary: { ... },
      // ...etc
    }
    ```
-   **Validation:** After each sub-task in Phase 2, restart the development server and perform a visual comparison against the baseline screenshots. Do not proceed if there are any discrepancies.