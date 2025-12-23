import React from 'react';

export default function InlineMessage({error, success}) {
    if (error) return <div style={{color: 'red'}}>{error}</div>;
    if (success) return <div style={{color: 'green'}}>{success}</div>;
    return null;
}