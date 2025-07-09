import React, {useEffect, useState} from 'react';
import Loader from '../../../common/server/Loader';

function RegisterForm() {
    const [form, setForm] = useState({username: '', password: '', captchaAnswer: ''});
    const [captcha, setCaptcha] = useState({captchaId: '', question: ''});
    const [error, setError] = useState('');
    const [token, setToken] = useState('');

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const fetchCaptcha = () => {
        Loader.load('/auth/captcha').then(setCaptcha);
    };

    const handleChange = e => {
        setForm({...form, [e.target.name]: e.target.value});
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setToken('');
        try {
            const token = await Loader.load('/auth/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username: form.username,
                    password: form.password,
                    captchaId: captcha.captchaId,
                    captchaAnswer: form.captchaAnswer
                }),
                credentials: 'include'
            });
            setToken(token);
        } catch (err) {
            setError(err.message || 'Registration failed');
            fetchCaptcha();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <FormField label="Username:" name="username" value={form.username} onChange={handleChange} required/>
            <FormField label="Password:" name="password" type="password" value={form.password} onChange={handleChange}
                       required/>
            <FormField label={`Captcha: ${captcha.question}`} name="captchaAnswer" value={form.captchaAnswer}
                       onChange={handleChange} required/>
            <button type="submit">Register</button>
            <FormMessage error={error} token={token}/>
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

function FormMessage({error, token}) {
    if (error) return <div style={{color: 'red'}}>{error}</div>;
    if (token) return <div style={{color: 'green'}}>Token: {token}</div>;
    return null;
}

export default RegisterForm;