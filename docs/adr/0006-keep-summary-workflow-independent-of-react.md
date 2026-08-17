# Keep the host summary workflow independent of React

The host summary lifecycle will be implemented as a framework-independent deep module, with React state and effects kept in a thin adapter. This keeps lifecycle rules testable through one seam and prevents presentation concerns from becoming part of the summary domain model.
