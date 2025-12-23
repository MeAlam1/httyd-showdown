import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useLocation} from 'react-router-dom';
import FormField from '../../../common/components/FormField.jsx';
import InlineMessage from '../../../common/components/InlineMessage.jsx';
import {createBattle, joinBattle} from '../api/battleApi.js';
import pickAvailablePlayers from '../utils/pickAvailablePlayers.js';

function BattleCreatePage() {
    const location = useLocation();
    const [form, setForm] = useState({playerId: 'player'});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const isCreatingRef = useRef(false);

    const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value});

    const createBattleFlow = useCallback(async (playerId) => {
        if (isCreatingRef.current) return;
        isCreatingRef.current = true;

        setIsCreating(true);
        setError('');
        setSuccess('');

        try {
            const result = await createBattle();
            const payload = result?.data || result;
            const battleId = payload?.context?.battleId || payload?.battleId;

            if (!battleId) {
                setError('Battle ID not found in response');
                return;
            }

            const existingPlayers = (payload?.playerIds ||
                payload?.players ||
                payload?.context?.playerIds ||
                payload?.context?.players ||
                payload?.context?.allPlayerIds ||
                []).map((p) => String(p));

            const teamIds = Object.keys(payload?.context?.teams || {});
            const [firstUser, secondUser] = pickAvailablePlayers(playerId, existingPlayers, 2);

            setForm((prev) => ({...prev, playerId: firstUser}));

            const targetTeamIds =
                teamIds.length >= 2 ? teamIds.slice(0, 2) : teamIds.length === 1 ? [teamIds[0], 'team-2'] : ['team-1', 'team-2'];

            await joinBattle(battleId, {userId: firstUser, teamId: targetTeamIds[0]});
            await joinBattle(battleId, {userId: secondUser, teamId: targetTeamIds[1]});

            setSuccess(`Battle created: ${battleId}`);
            window.location.href = `/battle/${battleId}`;
        } catch (err) {
            setError(err?.message || 'Battle creation failed');
        } finally {
            isCreatingRef.current = false;
            setIsCreating(false);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await createBattleFlow(form.playerId);
    };

    useEffect(() => {
        const auto = location?.state?.autoCreate;
        const pid = location?.state?.playerId || form.playerId;
        if (auto) createBattleFlow(pid);
    }, [createBattleFlow, form.playerId, location]);

    return (
        <form onSubmit={handleSubmit}>
            <FormField label="Player ID:" name="playerId" value={form.playerId} onChange={handleChange} required/>
            <button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Battle'}
            </button>
            <InlineMessage error={error} success={success}/>
        </form>
    );
}

export default BattleCreatePage;