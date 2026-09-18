# Case Notes: saving, recovery, and exports

## Saving and backups

Notes autosave in this browser every ten seconds. Choose **Set Backup Folder** to select an approved location, preferably a work OneDrive-synced Documents folder. The app creates `ProSupportToolsBackup` there (or uses that folder if selected directly).

Once access is approved, changed notes and settings are backed up approximately every minute while Case Notes is open. Browser background throttling can delay this; it is not a background service. **Backup History** saves immediately. The status shows the last successful folder backup; **Reconnect Backup Folder** requests access again when permission expires. Browsers without folder access can download history and settings instead.

Each successful folder backup writes dated history and settings files plus the latest `customer-config.json`. Backup files are not automatically pruned. Folder backups contain customer information and are not encrypted by this app: use an approved protected location and follow your organization's retention policy. OneDrive synchronizes the folder independently; the app cannot confirm cloud upload completion.

## Recovery and retention

- **Recent cases** holds up to 100 cases. Older unpinned cases move to **Archive** instead of being discarded. If every case is pinned, the oldest case must still move to Archive to retain the 100-case working limit.
- **Archive** preserves case contents and screenshots; **Restore** brings a case back into the workspace.
- Deleting a case moves it to **Trash**. It remains recoverable until explicitly permanently deleted.
- **Version History** keeps up to ten previous saved content versions per case. Preview before restoring; restoring also retains the current content as a version. These are saved snapshots, not a record of every keystroke.
- Archive, Trash, and versions share browser storage. They do not provide unlimited capacity. Export backups regularly, especially when using screenshots. Clearing site data removes all browser-local collections.

## Finding and organizing cases

Search includes case fields, note content, next steps, custom fields, and support-toolkit text. Matching excerpts appear in results. Search applies to the selected collection and follow-up filter. Pin important recent cases; pinned cases appear first. Sort the rest by creation time, last edit, or follow-up due date.

## Restoring settings and notes

**Export Settings** saves `customer-config.json` and a dated settings copy directly to your configured `ProSupportToolsBackup` folder. Without a connected folder, it downloads the settings file instead. If folder access is denied or a write fails, the status explains the failure so you can reconnect and retry; it does not silently download elsewhere. Settings exports do not change your case-note backup files or the last successful full-backup time.

Settings include field configuration, toolbox URLs/order/colors, custom AI prompts, theme, floating-panel preference, collapsed sections/history, and pinned site resources. They do not include browser folder permissions or the temporary dragged position of the toolbox.

**Restore Settings** offers two sources: **From backup folder** reads `customer-config.json` from the connected folder, and **Choose a file** accepts a downloaded or dated settings file. Imports are validated before applying; a confirmation explains that existing preferences will change. Older field/toolbox-only settings backups are supported.

**Restore History** replaces the complete current history with a history backup after confirmation, including Archive, Trash, and versions. Export current history first if you need to retain it. Settings are restored separately. An **Export Case JSON** file instead imports one case, replacing only a matching case ID after confirmation.

## Sharing and printing

- **Export This Case** downloads a standalone HTML document with the selected case's fields, formatted notes, screenshots, and tracked time.
- **Export Case JSON** creates an individual-case file that can be imported back through Restore History.
- **Print / PDF** opens the browser print dialog. Choose Save as PDF if available.

Review customer information before sharing exports or copying notes into AI tools.

## Keyboard access

Use Tab and Shift+Tab to move among controls and Enter/Space to activate buttons. **Alt+Shift+F** opens the history panel and focuses search. Focus the toolbox launcher and use **Alt+Arrow keys** to move it; Escape closes its menu. Field ordering has Move up/Move down buttons as an alternative to dragging. Screenshot resize handles support arrow keys.
