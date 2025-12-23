import React, {useCallback, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import Loader from '../../../common/server/Loader.js';

function BattleViewPage() {
    const {battleId} = useParams();
    const [battle, setBattle] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [postEndpoint, setPostEndpoint] = useState(`/battle/${battleId}/turn`);
    const [postBody, setPostBody] = useState('{"action":"test"}');
    const [postResult, setPostResult] = useState(null);
    const [posting, setPosting] = useState(false);
    const [postPlayerId, setPostPlayerId] = useState('');

    const apiUrl = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        setPostEndpoint(`/battle/${battleId}/turn`);
    }, [battleId]);

    const buildUrl = (path) => {
        if (!path) return path;
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        return `${apiUrl}${path}`;
    };

    const loadBattle = useCallback(() => {
        setLoading(true);
        setError('');
        const path = `/battle/${battleId}?_=${Date.now()}`;
        Loader.load(path)
            .then(data => {
                setBattle(data);
            })
            .catch(err => {
                setError(err?.message || 'Failed to load battle');
            })
            .finally(() => setLoading(false));
    }, [battleId]);

    useEffect(() => {
        loadBattle();
    }, [loadBattle]);

    const sendPost = async (url, bodyObj, playerId) => {
        setPosting(true);
        setError('');
        setPostResult(null);
        try {
            const fullUrl = buildUrl(url);
            const headers = {'Content-Type': 'application/json'};
            if (playerId) headers['Authorization'] = `Bearer ${playerId}`;
            const res = await fetch(fullUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(bodyObj),
                credentials: 'include',
            });
            const text = await res.text();
            let parsedBody;
            try {
                parsedBody = text ? JSON.parse(text) : null;
            } catch (e) {
                parsedBody = text;
            }
            setPostResult({status: res.status, body: parsedBody});
        } catch (err) {
            setError(err?.message || 'POST failed');
        } finally {
            setPosting(false);
            loadBattle();
        }
    };

    const quickPost = (path, body = {}, playerId = postPlayerId) => sendPost(path, body, playerId);

    const handleSendPostClick = () => {
        let parsed;
        try {
            parsed = postBody ? JSON.parse(postBody) : {};
        } catch (e) {
            setError('Invalid JSON in POST body: ' + e.message);
            return;
        }
        sendPost(postEndpoint, parsed, postPlayerId);
    };

    const storageKey = (id) => `battle_${id}_playerNumber`;

    const [playerNumber, setPlayerNumber] = useState(() => {
        try {
            const raw = battleId ? localStorage.getItem(storageKey(battleId)) : null;
            const n = parseInt(raw, 10);
            return Number.isInteger(n) ? n : 3;
        } catch (e) {
            return 3;
        }
    });

    useEffect(() => {
        try {
            const raw = battleId ? localStorage.getItem(storageKey(battleId)) : null;
            const n = parseInt(raw, 10);
            setPlayerNumber(Number.isInteger(n) ? n : 3);
        } catch (e) {
            setPlayerNumber(3);
        }
    }, [battleId]);

    const handleJoin = () => {
        const nextId = `player${playerNumber}`;
        quickPost(`/battle/${battleId}/join`, {userId: nextId});
        const nextNum = playerNumber + 1;
        setPlayerNumber(nextNum);
        try {
            localStorage.setItem(storageKey(battleId), String(nextNum));
        } catch (e) { /* empty */
        }
    };

    if (error) return <div style={{color: 'red'}}>{error}</div>;
    if (loading || !battle) return <div>Loading...</div>;

    return (
        <div style={{fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto'}}>
            <h2>Battle Viewer</h2>

            <section style={{marginBottom: 16}}>
                <h3>GET request</h3>
                <div>
                    <strong>Request:</strong> GET <code>{`/battle/${battleId}`}</code>
                </div>
                <div style={{marginTop: 8}}>
                    <strong>Response (embedded):</strong>
                    <pre style={{background: '#f3f3f3', padding: 12, overflow: 'auto', maxHeight: 300}}>
                        {JSON.stringify(battle, null, 2)}
                    </pre>
                </div>
                <button onClick={loadBattle} style={{marginTop: 8}}>
                    Refresh
                </button>
            </section>

            <section style={{marginBottom: 16}}>
                <h3>Send POST</h3>
                <div style={{marginBottom: 8}}>
                    <label>
                        Endpoint:
                        <input
                            value={postEndpoint}
                            onChange={e => setPostEndpoint(e.target.value)}
                            style={{width: '100%', boxSizing: 'border-box', marginTop: 4}}
                        />
                    </label>
                </div>

                <div style={{marginBottom: 8}}>
                    <label>
                        Player ID (used as Authorization Bearer header):
                        <input
                            value={postPlayerId}
                            onChange={e => setPostPlayerId(e.target.value)}
                            placeholder="player1 or user id"
                            style={{width: '100%', boxSizing: 'border-box', marginTop: 4}}
                        />
                    </label>
                </div>

                <div style={{marginBottom: 8}}>
                    <label>
                        JSON body:
                        <textarea
                            value={postBody}
                            onChange={e => setPostBody(e.target.value)}
                            rows={6}
                            style={{width: '100%', boxSizing: 'border-box', marginTop: 4}}
                        />
                    </label>
                </div>
                <div>
                    <button onClick={handleSendPostClick} disabled={posting}>
                        {posting ? 'Posting...' : 'Send POST'}
                    </button>
                    <button
                        onClick={() => quickPost(`/battle/${battleId}/start`, {})}
                        style={{marginLeft: 8}}
                        disabled={posting}
                    >
                        POST /start
                    </button>
                    <button
                        onClick={() => quickPost(`/battle/${battleId}/finish`, {})}
                        style={{marginLeft: 8}}
                        disabled={posting}
                    >
                        POST /finish
                    </button>
                    <button
                        onClick={handleJoin}
                        style={{marginLeft: 8}}
                        disabled={posting}
                    >
                        Join
                    </button>
                </div>
                {postResult && (
                    <div style={{marginTop: 8}}>
                        <strong>POST result:</strong>
                        <div>Status: {postResult.status}</div>
                        <pre style={{background: '#eee', padding: 8, maxHeight: 240, overflow: 'auto'}}>
                            {typeof postResult.body === 'object' ? JSON.stringify(postResult.body, null, 2) : postResult.body}
                        </pre>
                    </div>
                )}
            </section>
        </div>
    );
}

export default BattleViewPage;