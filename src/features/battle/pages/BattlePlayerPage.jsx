import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import InlineMessage from '../../../common/components/InlineMessage.jsx';
import FormField from '../../../common/components/FormField.jsx';
import Loader from '../../../common/server/Loader.js';
import {createBattle, joinBattle} from '../api/battleApi.js';

function BattlePlayerPage() {
    const navigate = useNavigate();
    const params = useParams();

    const [battleId, setBattleId] = useState(params.battleId || '');
    const [playerId, setPlayerId] = useState('player1');
    const [teamId, setTeamId] = useState('');

    const [battle, setBattle] = useState(null);
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [turnAction, setTurnAction] = useState('attack');

    const canLoad = useMemo(() => Boolean(battleId && battleId.trim()), [battleId]);

    useEffect(() => {
        if (params.battleId) setBattleId(params.battleId);
    }, [params.battleId]);

    const loadBattle = useCallback(async () => {
        if (!canLoad) return;
        setLoading(true);
        setError('');
        try {
            const data = await Loader.load(`/battle/${battleId}?_=${Date.now()}`);
            setBattle(data);
        } catch (e) {
            setError(e?.message || 'Failed to load battle');
        } finally {
            setLoading(false);
        }
    }, [battleId, canLoad]);

    useEffect(() => {
        loadBattle();
    }, [loadBattle]);

    const post = async (path, bodyObj = {}) => {
        if (!canLoad) return;
        setPosting(true);
        setError('');
        setSuccess('');
        try {
            const headers = {'Content-Type': 'application/json'};
            if (playerId && playerId.trim()) headers.Authorization = `Bearer ${playerId.trim()}`;

            const res = await Loader.load(path, {
                method: 'POST',
                headers,
                body: JSON.stringify(bodyObj),
            });

            setSuccess('Action sent');
            return res;
        } catch (e) {
            setError(e?.message || 'Action failed');
        } finally {
            setPosting(false);
            await loadBattle();
        }
    };

    const handleCreateSolo = async () => {
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const result = await createBattle();
            const payload = result?.data || result;
            const newBattleId = payload?.context?.battleId || payload?.battleId;
            if (!newBattleId) throw new Error('Battle ID not found in response');

            await joinBattle(newBattleId, teamId && teamId.trim()
                ? {userId: playerId.trim(), teamId: teamId.trim()}
                : {userId: playerId.trim()}
            );

            setBattleId(newBattleId);
            setSuccess(`Created battle: ${newBattleId}`);
            navigate(`/play/${newBattleId}`);
        } catch (e) {
            setError(e?.message || 'Failed to create battle');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinExisting = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            if (!battleId.trim()) throw new Error('Battle ID is required');
            if (!playerId.trim()) throw new Error('Player ID is required');

            await joinBattle(
                battleId.trim(),
                teamId && teamId.trim()
                    ? {userId: playerId.trim(), teamId: teamId.trim()}
                    : {userId: playerId.trim()}
            );

            setSuccess('Joined battle');
            navigate(`/play/${battleId.trim()}`);
            await loadBattle();
        } catch (e2) {
            setError(e2?.message || 'Failed to join battle');
        } finally {
            setLoading(false);
        }
    };

    const phase = battle?.phase || battle?.context?.phase || 'unknown';

    return (
        <div style={{fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: 12}}>
            <h2>Battle \- Player POV</h2>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12}}>
                <div style={{border: '1px solid #ddd', padding: 12}}>
                    <h3>Identity</h3>
                    <FormField
                        label="Player ID:"
                        name="playerId"
                        value={playerId}
                        onChange={(e) => setPlayerId(e.target.value)}
                        required
                    />
                    <FormField
                        label="Team ID \(optional\):"
                        name="teamId"
                        value={teamId}
                        onChange={(e) => setTeamId(e.target.value)}
                        required={false}
                    />
                    <div style={{marginTop: 8, display: 'flex', gap: 8}}>
                        <button onClick={handleCreateSolo} disabled={loading || posting || !playerId.trim()}>
                            Create battle \(solo\)
                        </button>
                    </div>
                </div>

                <div style={{border: '1px solid #ddd', padding: 12}}>
                    <h3>Join existing</h3>
                    <form onSubmit={handleJoinExisting}>
                        <FormField
                            label="Battle ID:"
                            name="battleId"
                            value={battleId}
                            onChange={(e) => setBattleId(e.target.value)}
                            required
                        />
                        <FormField
                            label="Team ID \(optional\):"
                            name="teamId"
                            value={teamId}
                            onChange={(e) => setTeamId(e.target.value)}
                            required={false}
                        />
                        <div style={{marginTop: 8, display: 'flex', gap: 8}}>
                            <button type="submit" disabled={loading || posting || !battleId.trim() || !playerId.trim()}>
                                Join
                            </button>
                            <button type="button" onClick={loadBattle} disabled={loading || posting || !canLoad}>
                                Refresh
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <InlineMessage error={error} success={success} />

            <div style={{border: '1px solid #ddd', padding: 12, marginTop: 12}}>
                <h3>Status</h3>
                {!canLoad && <div>Enter a battle ID or create a battle.</div>}
                {canLoad && loading && <div>Loading...</div>}
                {canLoad && !loading && (
                    <>
                        <div><strong>Battle:</strong> <code>{battleId}</code></div>
                        <div><strong>You are:</strong> <code>{playerId}</code></div>
                        <div><strong>Team:</strong> <code>{teamId || 'auto'}</code></div>
                        <div><strong>Phase:</strong> <code>{String(phase)}</code></div>

                        <div style={{marginTop: 12}}>
                            <h3>Actions</h3>

                            <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'}}>
                                <button
                                    onClick={() => post(`/battle/${battleId}/start`, {})}
                                    disabled={posting || loading || !canLoad}
                                >
                                    Start battle
                                </button>

                                <label style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                                    Turn action:
                                    <select
                                        value={turnAction}
                                        onChange={(e) => setTurnAction(e.target.value)}
                                        disabled={posting || loading || !canLoad}
                                    >
                                        <option value="attack">attack</option>
                                        <option value="defend">defend</option>
                                        <option value="pass">pass</option>
                                    </select>
                                </label>

                                <button
                                    onClick={() => post(`/battle/${battleId}/turn`, {action: turnAction})}
                                    disabled={posting || loading || !canLoad}
                                >
                                    Turn
                                </button>

                                <button
                                    onClick={() => post(`/battle/${battleId}/finish`, {})}
                                    disabled={posting || loading || !canLoad}
                                >
                                    Finish battle
                                </button>
                            </div>

                            <div style={{marginTop: 8, fontSize: 12, color: '#555'}}>
                                Authorization uses `Bearer {playerId}`.
                            </div>
                        </div>

                        <div style={{marginTop: 12}}>
                            <h3>Battle snapshot</h3>
                            <pre style={{background: '#f3f3f3', padding: 12, overflow: 'auto', maxHeight: 260}}>
                                {JSON.stringify(battle, null, 2)}
                            </pre>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default BattlePlayerPage;