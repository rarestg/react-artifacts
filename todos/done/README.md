DONE Folder How-To

When a plan is completed:
1) Move the plan file into this folder.
2) Add a new "Implementation Summary (Completed)" section at the very top of the file with:
   - Implemented changes
   - Notes / deviations from plan
   - Validation steps run (commands)
3) Prefix the filename with a New York timestamp.

Timestamp format:
YYYY-MM-DD-H-Mpm_<original-filename>

Example:
2026-02-02-7-57pm_standalone-artifact-route-plan.md

To fetch the timestamp in New York:
date +"%Y-%m-%d %H:%M:%S %Z"

Convert the time to the prefix format (e.g., 19:57 -> 7-57pm).

Or generate the prefix directly:
TZ=America/New_York date +"%Y-%m-%d-%-I-%M%P"
