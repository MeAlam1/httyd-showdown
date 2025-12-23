import {BrowserRouter as Router, Route, Routes, useNavigate} from 'react-router-dom';
import BattleCreatePage from '../features/battle/pages/BattleCreatePage.jsx';
import BattleViewPage from '../features/battle/pages/BattleViewPage.jsx';
import BattleJoinPage from '../features/battle/pages/BattleJoinPage.jsx';

function Home() {
    const navigate = useNavigate();

    const createBattle = async () => {
        navigate('/battle', {state: {autoCreate: true, playerId: 'player1'}});
    };

    const joinBattle = () => {
        navigate('/join-battle');
    };

    return (
        <>
            <button onClick={createBattle}>
                Create Battle
            </button>
            <button onClick={joinBattle}>
                Join Battle
            </button>
        </>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/battle" element={<BattleCreatePage/>}/>
                <Route path="/battle/:battleId" element={<BattleViewPage/>}/>
                <Route path="/join-battle" element={<BattleJoinPage/>}/>
            </Routes>
        </Router>
    );
}

export default App;