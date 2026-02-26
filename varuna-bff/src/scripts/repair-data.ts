import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../varuna.db');
const db = new Database(DB_PATH);

const accounts = [
    { Id: 'acc_1', Name: 'Borusan Otomotiv', Code: 'BRSN-001', OwnerId: 'usr-001' },
    { Id: 'acc_2', Name: 'Arçelik A.Ş.', Code: 'ARC-001', OwnerId: 'usr-001' },
    { Id: 'acc_3', Name: 'Şişecam Group', Code: 'SIS-101', OwnerId: 'usr-002' },
    { Id: 'acc_4', Name: 'Türk Hava Yolları', Code: 'THY-202', OwnerId: 'usr-003' },
    { Id: 'acc_5', Name: 'Migros Ticaret A.Ş.', Code: 'MGRS-55', OwnerId: 'usr-001' },
    { Id: 'acc_6', Name: 'Koç Holding', Code: 'KOC-77', OwnerId: 'usr-004' },
    { Id: 'acc_7', Name: 'Aselsan', Code: 'ASE-99', OwnerId: 'usr-001' },
    { Id: 'acc_8', Name: 'Turkcell', Code: 'TCELL-01', OwnerId: 'usr-005' },
    { Id: 'acc_9', Name: 'Vestel', Code: 'VST-336', OwnerId: 'usr-001' },
    { Id: 'acc_10', Name: 'Sabancı Holding', Code: 'SAB-11', OwnerId: 'usr-002' }
];

const persons = [
    { Id: 'user_1', Name: 'Ahmet', SurName: 'Yılmaz', PersonNameSurname: 'Ahmet Yılmaz' },
    { Id: 'user_2', Name: 'Ayşe', SurName: 'Demir', PersonNameSurname: 'Ayşe Demir' },
    { Id: 'user_3', Name: 'Mehmet', SurName: 'Öztürk', PersonNameSurname: 'Mehmet Öztürk' },
    { Id: 'usr-012', Name: 'Can', SurName: 'Kaya', PersonNameSurname: 'Can Kaya' },
    { Id: 'usr-021', Name: 'Selin', SurName: 'Yıldız', PersonNameSurname: 'Selin Yıldız' },
    { Id: 'usr-033', Name: 'Burak', SurName: 'Şahin', PersonNameSurname: 'Burak Şahin' },
    { Id: 'usr-042', Name: 'Zeynep', SurName: 'Aydın', PersonNameSurname: 'Zeynep Aydın' },
    { Id: 'usr-055', Name: 'Deniz', SurName: 'Arslan', PersonNameSurname: 'Deniz Arslan' }
];

console.log('[Maintenance] Seeding missing accounts and persons to fix display labels...');

const upsertAccount = db.prepare(`
    INSERT INTO Account (Id, Name, Code, OwnerId, State)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(Id) DO UPDATE SET Name = excluded.Name
`);

const upsertPerson = db.prepare(`
    INSERT INTO Person (Id, Name, SurName, PersonNameSurname, Status)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(Id) DO UPDATE SET PersonNameSurname = excluded.PersonNameSurname
`);

const updateContracts = db.prepare(`
    UPDATE Contract SET ProductId = CASE 
        WHEN (ABS(RANDOM() % 6)) = 0 THEN 'EnRoute'
        WHEN (ABS(RANDOM() % 6)) = 1 THEN 'Stokbar'
        WHEN (ABS(RANDOM() % 6)) = 2 THEN 'Hosting'
        WHEN (ABS(RANDOM() % 6)) = 3 THEN 'ServiceCore'
        WHEN (ABS(RANDOM() % 6)) = 4 THEN 'Quest'
        ELSE 'Varuna'
    END
    WHERE ProductId = 'prod-server-2026' OR ProductId IS NULL
`);

const upsertTeam = db.prepare(`
    INSERT INTO CompanyUserGroups (Id, CompanyId, UserGroupId, UserGroupName)
    VALUES ('team-ent-id', 'cmp-1001', 'team-enterprise', 'Enterprise Sales Team')
    ON CONFLICT(Id) DO NOTHING
`);

const run = db.transaction(() => {
    for (const acc of accounts) {
        upsertAccount.run(acc.Id, acc.Name, acc.Code, acc.OwnerId);
    }
    for (const p of persons) {
        upsertPerson.run(p.Id, p.Name, p.SurName, p.PersonNameSurname);
    }
    updateContracts.run();
    upsertTeam.run();
});

try {
    run();
    console.log('[Maintenance] Success! Missing accounts seeded.');
} catch (e) {
    console.error('[Maintenance] Failed:', e);
}
