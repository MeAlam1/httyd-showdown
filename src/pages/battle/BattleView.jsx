import React, {useCallback, useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import Loader from '../../../common/server/Loader.js';

function BattleView() {
    const {battleId} = useParams();
    const [battle, setBattle] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [postEndpoint, setPostEndpoint] = useState(`/battle/${battleId}/turn`);
    const [postBody, setPostBody] = useState('{"type":"test"}');
    const [postResult, setPostResult] = useState(null);
    const [posting, setPosting] = useState(false);

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

    const sendPost = async (url, bodyObj) => {
        setPosting(true);
        setError('');
        setPostResult(null);
        try {
            const fullUrl = buildUrl(url);
            const res = await fetch(fullUrl, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(bodyObj),
                credentials: 'include',
            });
            const text = await res.text();
            setPostResult({status: res.status, body: text});
        } catch (err) {
            setError(err?.message || 'POST failed');
        } finally {
            setPosting(false);
            loadBattle();
        }
    };

    const handleSendPostClick = () => {
        let parsed;
        try {
            parsed = postBody ? JSON.parse(postBody) : {};
        } catch (e) {
            setError('Invalid JSON in POST body: ' + e.message);
            return;
        }
        sendPost(postEndpoint, parsed);
    };

    const quickPost = (path, body = {}) => sendPost(path, body);

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
                    <pre style={{background: '#f3f3f3', padding: 12, overflow: 'auto'}}>
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
                        onClick={() => quickPost(`/battle/${battleId}/join`, {userId: 'player'})}
                        style={{marginLeft: 8}}
                        disabled={posting}
                    >
                        POST /join (player)
                    </button>
                    <button
                        onClick={() => quickPost(`/battle/${battleId}/join`, {
                            userId: 'spectator'
                        })}
                        style={{marginLeft: 8}}
                        disabled={posting}
                    >
                        POST /join (spectator)
                    </button>
                </div>
                {postResult && (
                    <div style={{marginTop: 8}}>
                        <strong>POST result:</strong>
                        <div>Status: {postResult.status}</div>
                        <pre style={{background: '#eee', padding: 8}}>{postResult.body}</pre>
                    </div>
                )}
            </section>
        </div>
    );
}

export default BattleView;