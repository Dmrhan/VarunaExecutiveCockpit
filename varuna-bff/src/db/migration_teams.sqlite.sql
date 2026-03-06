-- migration_teams.sqlite.sql
CREATE TABLE IF NOT EXISTS TeamDefinition (
    Id          TEXT PRIMARY KEY,
    Code        TEXT NOT NULL,
    Definition  TEXT NOT NULL,
    Status      INTEGER DEFAULT 1,
    _SyncedAt   DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS TeamMember (
    Id          INTEGER PRIMARY KEY AUTOINCREMENT,
    TeamId      TEXT NOT NULL,
    PersonId    TEXT NOT NULL,
    _SyncedAt   DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (TeamId) REFERENCES TeamDefinition(Id) ON DELETE CASCADE,
    FOREIGN KEY (PersonId) REFERENCES Person(Id) ON DELETE CASCADE
);
