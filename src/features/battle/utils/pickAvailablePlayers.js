export default function pickAvailablePlayers(preferred, existing = [], count = 2) {
    const candidates = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8', 'player9'];
    const picked = [];

    if (preferred && picked.length < count) picked.push(preferred);

    for (const c of candidates) {
        if (picked.length >= count) break;
        if (picked.includes(c)) continue;
        if (existing.includes(c)) continue;
        picked.push(c);
    }

    while (picked.length < count) {
        picked.push(`auto-${Date.now()}-${picked.length}`);
    }
    return picked;
}