import React, {useState, useEffect, useCallback, useRef} from 'react';
import {useLocation} from 'react-router-dom';
import Loader from '../../../common/server/Loader';

function Battle() {
    const location = useLocation();
    const [form, setForm] = useState({playerId: 'player1'});
    const [error, setError] = useState('');
    const [battle, setBattle] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const isCreatingRef = useRef(false);

    const handleChange = e => {
        setForm({...form, [e.target.name]: e.target.value});
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
                    playerIds: [playerId],
                    spectatorIds: [],
                    phase: 'lobby',
                }),
            });

            const payload = result?.data || result;
            setBattle(payload);
            console.log(payload);
            const battleId = payload?.context?.battleId || payload?.battleId;

            if (!battleId) {
                setError('Battle ID not found in response');
                return;
            }

            await Loader.load(`/battle/${battleId}/join`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({userId: playerId})
            });

            window.location.href = `/battle/${battleId}`;
        } catch (err) {
            setError(err.message || 'Battle creation failed');
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