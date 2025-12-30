import React, {useEffect, useMemo, useState} from 'react';
import InlineMessage from '../../../common/components/InlineMessage.jsx';
import FormField from '../../../common/components/FormField.jsx';
import Loader from '../../../common/server/Loader.js';

function normalizeDragonPath(p) {
    if (!p) return null;
    // Ensure single leading slash and .json extension
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
        // ignore errors for individual dragon loads
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
            // build full endpoint using base from index
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

export default function TeamBuilderPage() {
    const [dragons, setDragons] = useState([]);
    const [loading, setLoading] = useState(false);

    const [playerName, setPlayerName] = useState('');
    const [teamIds, setTeamIds] = useState([]);

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

    const canAddMore = teamIds.length < 6;
    const canSave = playerName.trim().length > 0 && teamIds.length === 6 && !saving;

    const addDragonById = (id) => {
        if (!canAddMore) return;
        setTeamIds((prev) => [...prev, id]);
        setError('');
        setSuccess('');
    };

    const removeAt = (idx) => {
        setTeamIds((prev) => prev.filter((_, i) => i !== idx));
        setError('');
        setSuccess('');
    };

    const clearTeam = () => {
        setTeamIds([]);
        setError('');
        setSuccess('');
    };

    const saveTeam = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const payload = {name: playerName.trim(), dragonIds: teamIds};

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
            teamIds.map((id) => ({
                id,
                dragon: dragons.find((d) => d.id === id) || null,
            })),
        [teamIds, dragons]
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
                                        disabled={!canAddMore}
                                        style={{padding: '6px 10px'}}
                                        title={d.id}
                                    >
                                        {d.name}
                                    </button>
                                ))}
                            </div>

                            <div style={{marginTop: 10}}>
                                <button onClick={clearTeam} disabled={teamIds.length === 0}>
                                    Clear
                                </button>
                                <span style={{marginLeft: 10, fontSize: 12, color: '#555'}}>
                                    Team size: {teamIds.length}/6
                                </span>
                            </div>
                        </>
                    )}
                </div>

                <div style={{border: '1px solid #ddd', padding: 12}}>
                    <h3>Your team</h3>
                    {teamIds.length === 0 && <div>Pick exactly 6 dragons (duplicates allowed).</div>}
                    {teamIds.length > 0 && (
                        <ol>
                            {team.map(({id, dragon}, idx) => (
                                <li key={`${id}_${idx}`} style={{marginBottom: 6}}>
                                    <code>{dragon?.name ?? id}</code>{' '}
                                    <span style={{color: '#777'}}>({id})</span>
                                    <button
                                        type="button"
                                        onClick={() => removeAt(idx)}
                                        style={{marginLeft: 8}}
                                    >
                                        Remove
                                    </button>
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
                        Save calls `POST /api/team/create`.
                    </div>
                </div>
            </div>
        </div>
    );
}