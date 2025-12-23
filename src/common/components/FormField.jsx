import React from 'react';

export default function FormField({label, name, type = 'text', value, onChange, required}) {
    return (
        <div>
            <label>{label}</label>
            <input name={name} type={type} value={value} onChange={onChange} required={required}/>
        </div>
    );
}