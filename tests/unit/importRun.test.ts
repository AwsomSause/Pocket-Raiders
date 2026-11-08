import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/GameSession';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('export and import carry the run in progress', () => {
  it('a run exported from one browser continues in another', () => {
    const a = new GameSession(content, new MemoryStorageProvider());
    a.newRun('red', 'carry-run');
    a.chooseStarter(0);
    const file = a.exportSave();
    expect(JSON.parse(file).run).not.toBeNull();

    const bStorage = new MemoryStorageProvider();
    const b = new GameSession(content, bStorage);
    expect(b.canContinue).toBe(false);
    expect(b.importSave(file)).toMatch(/run in progress/);
    expect(b.run?.seed).toBe('carry-run');
    expect(new GameSession(content, bStorage).canContinue).toBe(true);
  });

  it('a file whose run is damaged changes nothing', () => {
    const a = new GameSession(content, new MemoryStorageProvider());
    a.newRun('red', 'bad-run');
    a.chooseStarter(0);
    const file = JSON.parse(a.exportSave());
    file.run.data.party[0].speciesId = 'no-such-mon';
    const bStorage = new MemoryStorageProvider();
    const b = new GameSession(content, bStorage);
    expect(b.importSave(JSON.stringify(file))).toMatch(/Import failed/);
    expect(new GameSession(content, bStorage).canContinue).toBe(false);
  });

  it('an older export file with no run still imports', () => {
    const a = new GameSession(content, new MemoryStorageProvider());
    const file = JSON.parse(a.exportSave());
    delete file.run;
    const b = new GameSession(content, new MemoryStorageProvider());
    expect(b.importSave(JSON.stringify(file))).toMatch(/^Save imported\./);
  });
});
