jest.mock('./db', () => ({ getSetting: () => null }));
jest.mock('./supabase', () => ({}));

import { planPull } from './sync';

const local = (id: string, synced: boolean, deleted = false) => ({ id, synced, deleted });

describe('planPull', () => {
  it('inserts Entries written on another device', () => {
    expect(planPull([local('a', true)], [{ id: 'a', deleted: false }, { id: 'b', deleted: false }]).insert).toEqual(['b']);
  });

  it('does not re-insert an Entry deleted here and not yet sent', () => {
    expect(planPull([local('a', true, true)], [{ id: 'a', deleted: false }]).insert).toEqual([]);
  });

  it('purges Entries deleted on another device', () => {
    const plan = planPull([local('a', true), local('b', false)], [{ id: 'a', deleted: true }, { id: 'c', deleted: true }]);
    expect(plan.purge).toEqual(['a']);
    expect(plan.insert).toEqual([]);
  });

  it('an empty server never deletes the journal: uploaded Entries go up again', () => {
    const plan = planPull([local('a', true), local('b', false), local('c', true, true)], []);
    expect(plan.purge).toEqual([]);
    expect(plan.reupload).toEqual(['a']);
  });
});
