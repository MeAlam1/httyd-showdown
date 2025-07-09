import React, {useEffect, useState} from 'react';
import Loader from "../../../common/server/Loader.js";

function RegisterForm() {
    const [form, setForm] = useState({
        username: '',
        password: '',
        captchaAnswer: ''
    });
    const [captcha, setCaptcha] = useState({captchaId: '', question: ''});
    const [error, setError] = useState('');
    const [token, setToken] = useState('');

    useEffect(() => {
        Loader.load('/auth/captcha')
            .then(data => setCaptcha(data));
    }, []);

    const handleChange = e => {
        setForm({...form, [e.target.name]: e.target.value});
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setToken('');
        const body = {
            username: form.username,
            password: form.password,
            captchaId: captcha.captchaId,
            captchaAnswer: form.captchaAnswer
        };
        try {
            const token = await Loader.load('/auth/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
                credentials: 'include'
            });
            setToken(token);
        } catch (err) {
            setError(err.message || 'Registration failed');
            Loader.load('/auth/captcha')
                .then(data => setCaptcha(data));
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Username:</label>
                <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <label>Password:</label>
                <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                />
            </div>
            <div>
                <label>Captcha: {captcha.question}</label>
                <input
                    name="captchaAnswer"
                    value={form.captchaAnswer}
                    onChange={handleChange}
                    required
                />
            </div>
            <button type="submit">Register</button>
            {error && <div style={{color: 'red'}}>{error}</div>}
            {token && <div style={{color: 'green'}}>Token: {token}</div>}
        </form>
    );
}

export default RegisterForm;