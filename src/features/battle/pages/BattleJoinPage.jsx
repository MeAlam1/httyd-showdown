import React, {useState} from 'react';
import FormField from '../../../common/components/FormField.jsx';
import InlineMessage from '../../../common/components/InlineMessage.jsx';
import {joinBattle} from '../api/battleApi.js';

function BattleJoinPage() {
    const [form, setForm] = useState({battleId: '', playerId: ''});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const res = await joinBattle(form.battleId, {userId: form.playerId});
            if (res && res.context) {
                setSuccess(Object.prototype.hasOwnProperty.call(res, 'playerBattleContext') ? 'Joined as player\!' : 'Joined as spectator\!');
                window.location.href = `/battle/${form.battleId}`;
            } else {
                setError('Unexpected response from server');
            }
        } catch (err) {
            setError(err?.message || 'Failed to join battle');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <FormField label="Battle ID:" name="battleId" value={form.battleId} onChange={handleChange} required/>
            <FormField label="Player ID:" name="playerId" value={form.playerId} onChange={handleChange} required/>
            <button type="submit">Join Battle</button>
            <InlineMessage error={error} success={success}/>
        </form>
    );
}

export default BattleJoinPage;