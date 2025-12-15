import React, {useState, useEffect, useCallback, useRef} from 'react';
import {useLocation} from 'react-router-dom';
import Loader from '../../../common/server/Loader';

function Battle() {
    const location = useLocation();
    const [form, setForm] = useState({playerId: 'player'});
    const [error, setError] = useState('');
    const [battle, setBattle] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const isCreatingRef = useRef(false);

    const handleChange = e => {
        setForm({...form, [e.target.name]: e.target.value});
    };

    const pickAvailablePlayers = (preferred, existing = [], count = 2) => {
        const candidates = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8', 'player9'];
        const picked = [];
        if (preferred && !existing.includes(preferred) && picked.length < count) {
            picked.push(preferred);
        } else if (preferred && picked.length < count) {
            picked.push(preferred);
        }
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
    };

    const createBattleRequest = useCallback(async (playerId) => {
        if (isCreatingRef.current) return;
        isCreatingRef.current = true;
        setIsCreating(true);
        setError('');
        setBattle(null);
        try {
            const result = await Loader.load('/battle/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    playerIds: [],
                    spectatorIds: [],
                    phase: 'lobby',
                })
            });

            const payload = result?.data || result;
            setBattle(payload);
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
                []).map(p => String(p));

            const teamIds = Object.keys(payload?.context?.teams || {});

            const [firstUser, secondUser] = pickAvailablePlayers(playerId, existingPlayers, 2);

            setForm(prev => ({...prev, playerId: firstUser}));

            const targetTeamIds = teamIds.length >= 2
                ? teamIds.slice(0, 2)
                : teamIds.length === 1
                    ? [teamIds[0], 'team-2']
                    : ['team-1', 'team-2'];

            await Loader.load(`/battle/${battleId}/join`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({userId: firstUser, teamId: targetTeamIds[0]})
            });

            await Loader.load(`/battle/${battleId}/join`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({userId: secondUser, teamId: targetTeamIds[1]})
            });

            window.location.href = `/battle/${battleId}`;
        } catch (err) {
            setError(err?.message || 'Battle creation failed');
        } finally {
            isCreatingRef.current = false;
            setIsCreating(false);
        }
    }, []);

    const handleSubmit = async e => {
        e.preventDefault();
        await createBattleRequest(form.playerId);
    };

    useEffect(() => {
            const auto = location?.state?.autoCreate;
            const pid = location?.state?.playerId || form.playerId;
            if (auto) {
                createBattleRequest(pid);
            }
        },
        [createBattleRequest, form.playerId, location]
    );

    return (
        <form onSubmit={handleSubmit}>
            <FormField
                label="Player ID:"
                name="playerId"
                value={form.playerId}
                onChange={handleChange}
                required
            />
            <button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Battle'}
            </button>
            <FormMessage error={error} battle={battle}/>
        </form>
    );
}

function FormField({label, name, type = 'text', value, onChange, required}) {
    return (
        <div>
            <label>{label}</label>
            <input name={name} type={type} value={value} onChange={onChange} required={required}/>
        </div>
    );
}

function FormMessage({error, battle}) {
    if (error) return <div style={{color: 'red'}}>{error}</div>;
    if (battle) return <div style={{color: 'green'}}>Battle created: {JSON.stringify(battle)}</div>;
    return null;
}

export default Battle;