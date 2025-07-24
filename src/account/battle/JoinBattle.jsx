import React, {useState} from 'react';
import Loader from '../../../common/server/Loader';

function JoinBattle() {
    const [form, setForm] = useState({battleId: '', playerId: ''});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = e => {
        setForm({...form, [e.target.name]: e.target.value});
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        try {
            await Loader.load(`/battle/${form.battleId}/join`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({userId: form.playerId}),
                credentials: 'include'
            });
            setSuccess(true);
            window.location.href = `/battle/${form.battleId}`;
        } catch (err) {
            setError(err.message || 'Failed to join battle');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <FormField label="Battle ID:" name="battleId" value={form.battleId}
                       onChange={handleChange} required/>
            <FormField label="Player ID:" name="playerId" value={form.playerId}
                       onChange={handleChange} required/>
            <button type="submit">Join Battle</button>
            {error && <div style={{color: 'red'}}>{error}</div>}
            {success && <div style={{color: 'green'}}>Successfully joined battle!</div>}
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

export default JoinBattle;