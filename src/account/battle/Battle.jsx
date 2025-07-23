import React, {useState} from 'react';
import Loader from '../../../common/server/Loader';

function Battle() {
    const [form, setForm] = useState({playerId: 'player1'});
    const [error, setError] = useState('');
    const [battle, setBattle] = useState(null);

    const handleChange = e => {
        setForm({...form, [e.target.name]: e.target.value});
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setBattle(null);
        try {
            const result = await Loader.load('/battle/create', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    playerId: form.playerId
                }),
                credentials: 'include'
            });
            setBattle(result);
            window.location.href = `/battle/${result.battleId}`; // Ignore Warning
        } catch (err) {
            setError(err.message || 'Battle creation failed');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <FormField label="Player ID:" name="playerId" value={form.playerId}
                       onChange={handleChange} required/>
            <button type="submit">Create Battle</button>
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