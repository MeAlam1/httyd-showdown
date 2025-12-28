// src/features/team/pages/TeamBuilderPage.jsx

import React, {useEffect, useMemo, useState} from 'react';
import InlineMessage from '../../../common/components/InlineMessage.jsx';
import FormField from '../../../common/components/FormField.jsx';

function joinUrl(base, endpoint) {
    const b = String(base || '').replace(/\/+$/, '');
    const e = String(endpoint || '').replace(/^\/+/, '');
    return b ? `${b}/${e}` : `/${e}`;
}

function isResourceNotFound(res, contentType, bodyText) {
    if (res.status !== 404) return false;
    if (!String(contentType || '').includes('application/json')) return false;

    try {
        const data = JSON.parse(bodyText || '{}');
        const err = String(data?.error || '').toLowerCase();
        if (err !== 'resource not found') return false;

        const resource = String(data?.resource || '');
        if (!resource) return true;

        const normalized = resource.replace(/\\/g, '/').replace(/^\/+/, '');
        return normalized.startsWith('static/api/dragons/');
    } catch {
        return false;
    }
}

async function fetchJson(url, {ignoreResourceNotFound = true} = {}) {
    const res = await fetch(url, {credentials: 'include'});
    const finalUrl = res.url || url;
    const contentType = res.headers.get('content-type') || '';
    const bodyText = await res.text();

    if (ignoreResourceNotFound && isResourceNotFound(res, contentType, bodyText)) {
        return null;
    }

    if (!res.ok) {
        throw new Error(
            `HTTP ${res.status} ${res.statusText}\n` +
            `URL: ${finalUrl}\n` +
            `Content-Type: ${contentType || 'unknown'}\n` +
            `${bodyText.slice(0, 800)}`
        );
    }

    if (!contentType.includes('application/json')) {
        throw new Error(
            `Expected JSON but got: ${contentType || 'unknown'}\n` +
            `URL: ${finalUrl}\n` +
            `${bodyText.slice(0, 800)}`
        );
    }

    try {
        return JSON.parse(bodyText);
    } catch (e) {
        throw new Error(
            `Invalid JSON\n` +
            `URL: ${finalUrl}\n` +
            `${String(e?.message || e)}\n` +
            `${bodyText.slice(0, 800)}`
        );
    }
}

function normalizeDragonPath(p) {
    const normalized = String(p || '').replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalized) return null;
    return normalized.endsWith('.json') ? normalized : `${normalized}.json`;
}

async function loadDragonFromPath(apiUrl, dragonJsonPath) {
    const endpoint = normalizeDragonPath(dragonJsonPath);
    if (!endpoint) return null;

    const url = joinUrl(apiUrl, endpoint);
    const data = await fetchJson(url, {ignoreResourceNotFound: true});
    if (!data) return null;

    const id = String(data?.id ?? endpoint);
    const name = String(data?.name ?? data?.displayName ?? id);
    return {id, name, path: endpoint, data};
}

async function loadAllDragonsFromApiIndex(apiUrl) {
    const indexUrl = joinUrl(apiUrl, 'static/api');
    const index = await fetchJson(indexUrl, {ignoreResourceNotFound: false});

    const base = String(index?.dragonsBase || '').replace(/\/+$/, '');
    const list = Array.isArray(index?.dragons) ? index.dragons : [];

    if (!base || list.length === 0) return [];

    const loaded = await Promise.all(
        list.map(async (entry) => {
            const normalized = String(entry).replace(/^\/+/, '');
            const path = `${base}/${normalized}`;
            return loadDragonFromPath(apiUrl, path);
        })
    );

    const byId = new Map();
    for (const d of loaded.filter(Boolean)) {
        byId.set(d.id, d);
    }

    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export default function TeamBuilderPage() {
    const apiUrl = import.meta.env.VITE_API_URL || '';

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
                const list = await loadAllDragonsFromApiIndex(apiUrl);
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
    }, [apiUrl]);

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
