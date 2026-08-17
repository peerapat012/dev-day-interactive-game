# Retain entries arriving during refresh as pending

Refresh summary uses the entry snapshot captured at its start. Entries submitted while it runs remain outside the new summary and are reported as pending afterward, so the host can choose another refresh without the UI implying that those entries were included.
