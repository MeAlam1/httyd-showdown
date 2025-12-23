import Loader from '../../../common/server/Loader.js';

export async function createBattle() {
  return Loader.load('/battle/create', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      playerIds: [],
      spectatorIds: [],
      phase: 'lobby',
    }),
  });
}

export async function joinBattle(battleId, {userId, teamId} = {}) {
  return Loader.load(`/battle/${battleId}/join`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(teamId ? {userId, teamId} : {userId}),
  });
}

export async function getBattle(battleId) {
  return Loader.load(`/battle/${battleId}?_=${Date.now()}`);
}