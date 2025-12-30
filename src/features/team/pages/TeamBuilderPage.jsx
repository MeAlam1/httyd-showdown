import React, {useEffect, useMemo, useState} from 'react';
import InlineMessage from '../../../common/components/InlineMessage.jsx';
import FormField from '../../../common/components/FormField.jsx';
import Loader from '../../../common/server/Loader.js';

function normalizeDragonPath(p) {
    if (!p) return null;
    const normalized = String(p || '').replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalized) return null;
    const withExt = normalized.endsWith('.json') ? normalized : `${normalized}.json`;
    return `/${withExt}`;
}

function joinEndpoint(base, entry) {
    if (!base) return normalizeDragonPath(entry);
    const b = String(base).replace(/\/+$/, '');
    const e = String(entry).replace(/^\/+/, '');
    return `/${b.replace(/^\/+/, '')}/${e}`;
}

async function loadDragonFromPath(dragonJsonPath) {
    const endpoint = normalizeDragonPath(dragonJsonPath).replace(/^\/+/, '/').replace(/\/{2,}/g, '/');
    if (!endpoint) return null;

    try {
        const data = await Loader.load(endpoint);
        if (!data) return null;
        const id = String(data?.id ?? endpoint);
        const name = String(data?.name ?? data?.displayName ?? id);
        return {id, name, path: endpoint, data};
    } catch {
        return null;
    }
}

async function loadAllDragonsFromApiIndex() {
    const raw = await Loader.load('/static/api');
    const index = raw?.data || raw || {};

    const base = String(index?.dragonsBase || index?.base || '').replace(/\/+$/, '');
    const list = Array.isArray(index?.dragons) ? index.dragons : [];

    if (!base || list.length === 0) return [];

    const loaded = await Promise.all(
        list.map(async (entry) => {
            const entryPath = joinEndpoint(base, entry);
            return loadDragonFromPath(entryPath);
        })
    );

    const byId = new Map();
    for (const d of loaded.filter(Boolean)) {
        byId.set(d.id, d);
    }

    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function defaultSlotFromDragon(d) {
    const baseData = d?.data || {};
    return {
        id: d.id,
        nickname: baseData?.nickname || '',
        natureId: baseData?.natureId || '',
        level: baseData?.level ?? 1,
        abilityId: baseData?.abilityId || '',
        heldItemId: baseData?.heldItemId || '',
        stats: {
            attack: baseData?.stats?.attack ?? 0,
            speed: baseData?.stats?.speed ?? 0,
            defense: baseData?.stats?.defense ?? 0,
            armor: baseData?.stats?.armor ?? 0,
            firepower: baseData?.stats?.firepower ?? 0,
            stealth: baseData?.stats?.stealth ?? 0,
            stamina: baseData?.stats?.stamina ?? 0,
            shotLimit: baseData?.stats?.shotLimit ?? 0,
            venom: baseData?.stats?.venom ?? 0,
            jawStrength: baseData?.stats?.jawStrength ?? 0,
        },
        moves: [
            {moveId: baseData?.moves?.[0]?.moveId || '', slot: 1},
            {moveId: baseData?.moves?.[1]?.moveId || '', slot: 2},
            {moveId: baseData?.moves?.[2]?.moveId || '', slot: 3},
            {moveId: baseData?.moves?.[3]?.moveId || '', slot: 4},
        ],
        trainingEffort: {
            attack: baseData?.trainingEffort?.attack ?? 0,
            speed: baseData?.trainingEffort?.speed ?? 0,
            stamina: baseData?.trainingEffort?.stamina ?? 0,
        },
    };
}

export default function TeamBuilderPage() {
    const [dragons, setDragons] = useState([]);
    const [loading, setLoading] = useState(false);

    // Preset player name for quick testing
    const [playerName, setPlayerName] = useState('TestPlayer');

    // Helper to produce a sample slot
    const sampleSlot = (i) => ({
        id: `dragon-${i}`,
        nickname: `Nick ${i}`,
        natureId: `nature-${i}`,
        level: 50,
        abilityId: `ability-${i}`,
        heldItemId: `item-${i}`,
        stats: {
            attack: 10 + i,
            speed: 8 + i,
            defense: 7 + i,
            armor: 5,
            firepower: 9,
            stealth: 3,
            stamina: 12,
            shotLimit: 2,
            venom: 0,
            jawStrength: 4,
        },
        moves: [
            {moveId: `m${i}a`, slot: 1},
            {moveId: `m${i}b`, slot: 2},
            {moveId: `m${i}c`, slot: 3},
            {moveId: `m${i}d`, slot: 4},
        ],
        trainingEffort: {
            attack: 5,
            speed: 4,
            stamina: 3,
        },
    });

    // Start with an empty team (no prefilled slots)
    const [teamSlots, setTeamSlots] = useState([]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadAll() {
            setLoading(true);
            setError('');
            setSuccess('');

            try {
                const list = await loadAllDragonsFromApiIndex();
                if (!cancelled) setDragons(list);
            } catch (e) {
                if (!cancelled) {
                    setError(e?.message || 'Failed to load dragons');
                    setDragons([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadAll();
        return () => {
            cancelled = true;
        };
    }, []);
    const canSave = playerName.trim().length > 0 && teamSlots.length === 6 && !saving;

    const addDragonById = (id) => {
        const d = dragons.find((x) => x.id === id);
        const filledSlot = d ? defaultSlotFromDragon(d) : {
            id,
            nickname: '',
            level: 1,
            moves: [{moveId: '', slot: 1}, {moveId: '', slot: 2}, {moveId: '', slot: 3}, {moveId: '', slot: 4}],
            stats: {},
            trainingEffort: {}
        };

        setTeamSlots((prev) => {
            // If there's room, append full slot
            if (prev.length < 6) {
                return [...prev, filledSlot];
            }

            // Otherwise, find the first placeholder slot (one whose id does not match a loaded dragon)
            const placeholderIdx = prev.findIndex((s) => !dragons.find((dr) => dr.id === s.id));
            const replaceIdx = placeholderIdx >= 0 ? placeholderIdx : 0;

            const copy = prev.slice();
            // Merge so we keep any custom fields the user might have set, but prefer the filled values
            copy[replaceIdx] = {...copy[replaceIdx], ...filledSlot};
            return copy;
        });

        setError('');
        setSuccess('');
    };

    const removeAt = (idx) => {
        setTeamSlots((prev) => prev.filter((_, i) => i !== idx));
        setError('');
        setSuccess('');
    };

    const clearTeam = () => {
        setTeamSlots([]);
        setError('');
        setSuccess('');
    };

    const updateSlot = (idx, changes) => {
        setTeamSlots((prev) => {
            const copy = prev.slice();
            copy[idx] = {...copy[idx], ...changes};
            return copy;
        });
        setError('');
        setSuccess('');
    };

    const updateSlotStat = (idx, statKey, value) => {
        setTeamSlots((prev) => {
            const copy = prev.slice();
            const slot = {...copy[idx], stats: {...(copy[idx].stats || {})}};
            slot.stats[statKey] = Number(value) || 0;
            copy[idx] = slot;
            return copy;
        });
    };

    const updateSlotMove = (idx, moveSlot, moveId) => {
        setTeamSlots((prev) => {
            const copy = prev.slice();
            const moves = (copy[idx].moves || []).slice();
            const mIndex = moves.findIndex((m) => m.slot === moveSlot);
            if (mIndex >= 0) moves[mIndex] = {slot: moveSlot, moveId};
            else moves.push({slot: moveSlot, moveId});
            copy[idx] = {...copy[idx], moves};
            return copy;
        });
    };

    const saveTeam = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                name: playerName.trim(),
                dragons: teamSlots.map((s) => ({
                    id: s.id,
                    nickname: s.nickname,
                    natureId: s.natureId,
                    level: Number(s.level) || 1,
                    abilityId: s.abilityId,
                    heldItemId: s.heldItemId,
                    stats: {...(s.stats || {})},
                    moves: (s.moves || []).map((m) => ({moveId: m.moveId, slot: m.slot})),
                    trainingEffort: {...(s.trainingEffort || {})},
                })),
            };

            const res = await fetch('/api/team/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload),
                credentials: 'include',
            });

            if (!res.ok) throw new Error(await res.text());
            setSuccess('Team saved');
        } catch (e) {
            setError(e?.message || 'Failed to save team');
        } finally {
            setSaving(false);
        }
    };

    const team = useMemo(
        () =>
            teamSlots.map((slot, idx) => ({
                idx,
                slot,
                dragon: dragons.find((d) => d.id === slot.id) || null,
            })),
        [teamSlots, dragons]
    );

    return (
        <div style={{fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: 12}}>
            <h2>Team Builder</h2>

            <div style={{border: '1px solid #ddd', padding: 12, marginBottom: 12}}>
                <FormField
                    label="Player name"
                    name="playerName"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    required
                />
            </div>

            <InlineMessage error={error} success={success}/>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
                <div style={{border: '1px solid #ddd', padding: 12}}>
                    <h3>Available dragons</h3>
                    {loading && <div>Loading...</div>}
                    {!loading && dragons.length === 0 && <div>No dragons found.</div>}

                    {!loading && dragons.length > 0 && (
                        <>
                            <div style={{fontSize: 12, color: '#555', marginBottom: 8}}>
                                Click a dragon to add (duplicates allowed)
                            </div>

                            <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                                {dragons.map((d) => (
                                    <button
                                        key={d.id}
                                        type="button"
                                        onClick={() => addDragonById(d.id)}
                                        disabled={false}
                                        style={{padding: '6px 10px'}}
                                        title={d.id}
                                    >
                                        {d.name}
                                    </button>
                                ))}
                            </div>

                            <div style={{marginTop: 10}}>
                                <button onClick={clearTeam} disabled={teamSlots.length === 0}>
                                    Clear
                                </button>
                                <span style={{marginLeft: 10, fontSize: 12, color: '#555'}}>
                                                            Team size: {teamSlots.length}/6
                                                        </span>
                            </div>
                        </>
                    )}
                </div>

                <div style={{border: '1px solid #ddd', padding: 12}}>
                    <h3>Your team</h3>
                    {teamSlots.length === 0 && <div>Pick exactly 6 dragons (duplicates allowed).</div>}
                    {teamSlots.length > 0 && (
                        <ol>
                            {team.map(({idx, slot, dragon}) => (
                                <li key={`${slot.id}_${idx}`} style={{marginBottom: 12}}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                        <strong>{dragon?.name ?? slot.id}</strong>
                                        <span style={{color: '#777'}}>({slot.id})</span>
                                        <button type="button" onClick={() => removeAt(idx)} style={{marginLeft: 8}}>
                                            Remove
                                        </button>
                                    </div>

                                    <div
                                        style={{marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
                                        <input
                                            placeholder="Nickname"
                                            value={slot.nickname || ''}
                                            onChange={(e) => updateSlot(idx, {nickname: e.target.value})}
                                        />
                                        <input
                                            type="number"
                                            min={1}
                                            placeholder="Level"
                                            value={slot.level}
                                            onChange={(e) => updateSlot(idx, {level: Number(e.target.value) || 1})}
                                        />
                                        <input
                                            placeholder="Nature ID"
                                            value={slot.natureId || ''}
                                            onChange={(e) => updateSlot(idx, {natureId: e.target.value})}
                                        />
                                        <input
                                            placeholder="Ability ID"
                                            value={slot.abilityId || ''}
                                            onChange={(e) => updateSlot(idx, {abilityId: e.target.value})}
                                        />
                                        <input
                                            placeholder="Held Item ID"
                                            value={slot.heldItemId || ''}
                                            onChange={(e) => updateSlot(idx, {heldItemId: e.target.value})}
                                        />
                                    </div>

                                    <div style={{marginTop: 8}}>
                                        <div style={{fontSize: 13, fontWeight: 600}}>Moves</div>
                                        <div style={{display: 'flex', gap: 8, marginTop: 6}}>
                                            {Array.from({length: 4}).map((_, i) => (
                                                <input
                                                    key={i}
                                                    placeholder={`Slot ${i + 1} moveId`}
                                                    value={(slot.moves && slot.moves[i]?.moveId) || ''}
                                                    onChange={(e) => updateSlotMove(idx, i + 1, e.target.value)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{marginTop: 8}}>
                                        <div style={{fontSize: 13, fontWeight: 600}}>Stats</div>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(3, 1fr)',
                                            gap: 6,
                                            marginTop: 6
                                        }}>
                                            {['attack', 'speed', 'defense', 'armor', 'firepower', 'stealth', 'stamina', 'shotLimit', 'venom', 'jawStrength'].map((k) => (
                                                <input
                                                    key={k}
                                                    type="number"
                                                    placeholder={k}
                                                    value={slot.stats?.[k] ?? ''}
                                                    onChange={(e) => updateSlotStat(idx, k, e.target.value)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{marginTop: 8}}>
                                        <div style={{fontSize: 13, fontWeight: 600}}>Training Effort</div>
                                        <div style={{display: 'flex', gap: 8, marginTop: 6}}>
                                            <input
                                                type="number"
                                                placeholder="attack"
                                                value={slot.trainingEffort?.attack ?? ''}
                                                onChange={(e) => updateSlot(idx, {
                                                    trainingEffort: {
                                                        ...(slot.trainingEffort || {}),
                                                        attack: Number(e.target.value) || 0
                                                    }
                                                })}
                                            />
                                            <input
                                                type="number"
                                                placeholder="speed"
                                                value={slot.trainingEffort?.speed ?? ''}
                                                onChange={(e) => updateSlot(idx, {
                                                    trainingEffort: {
                                                        ...(slot.trainingEffort || {}),
                                                        speed: Number(e.target.value) || 0
                                                    }
                                                })}
                                            />
                                            <input
                                                type="number"
                                                placeholder="stamina"
                                                value={slot.trainingEffort?.stamina ?? ''}
                                                onChange={(e) => updateSlot(idx, {
                                                    trainingEffort: {
                                                        ...(slot.trainingEffort || {}),
                                                        stamina: Number(e.target.value) || 0
                                                    }
                                                })}
                                            />
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}

                    <div style={{display: 'flex', gap: 8, marginTop: 12}}>
                        <button onClick={saveTeam} disabled={!canSave}>
                            {saving ? 'Saving...' : 'Save team'}
                        </button>
                    </div>

                    <div style={{marginTop: 12, fontSize: 12, color: '#555'}}>
                        Save calls `POST /api/team/create` with payload matching the saved example.
                    </div>
                </div>
            </div>
        </div>
    );
}