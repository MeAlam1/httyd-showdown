import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import Loader from '../../../common/server/Loader.js';

function BattleView() {
    const {battleId} = useParams();
    const [battle, setBattle] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        Loader.load(`/battle/${battleId}`)
            .then(setBattle)
            .catch(err => setError(err.message || 'Failed to load battle'));
    }, [battleId]);

    if (error) return <div style={{color: 'red'}}>{error}</div>;
    if (!battle) return <div>Loading...</div>;
    return <pre>{JSON.stringify(battle, null, 2)}</pre>;
}

export default BattleView;