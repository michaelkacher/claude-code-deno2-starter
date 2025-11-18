* Recommendations to Speed Up Startup:
Option 1: Lazy Route Loading (Best)
Move rarely-used API routes to a separate directory that Fresh doesn't automatically scan.

Option 2: Reduce Route Count
Consolidate related routes (e.g., combine CRUD operations into single files with multiple handlers)

Option 3: Split into Microservices
Move admin/dashboard routes to a separate app
* The .env file is no longer accurate

* Does the port close still work?
* Realtime shows reconnecting
* Dark light theme
* Notifications page flickers on refreshes
* Redirect when logged out sometimes not working and staying on the login screen