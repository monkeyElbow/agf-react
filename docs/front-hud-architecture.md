# Front HUD ownership

`FrontHudDock` owns the shared desktop dock chrome and interactions: panel tabs, icon/name mode, hover labels, close controls, active-tab behavior, and drag/drop presentation.

Page owners keep route-specific responsibilities: panel definitions and ordering, target selection/scrolling, active panel state, block editor rendering, and ownership actions. `FrontHudPageWorkflow` remains the shared save/publish workflow, not the dock owner.

`NativeContentPage` intentionally keeps its mobile HUD/action tray separate because mobile selection and sheet behavior are different. “Sitewide” means the shared desktop dock is wired through every page owner; it does not mean route-specific editor behavior or the mobile presentation is collapsed into one file.
