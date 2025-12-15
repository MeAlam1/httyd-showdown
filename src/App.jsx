import {BrowserRouter as Router, Route, Routes, useNavigate} from 'react-router-dom';
import Battle from "./account/battle/Battle.jsx";
import BattleView from "./account/battle/BattleView.jsx";
import JoinBattle from "./account/battle/JoinBattle.jsx";

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
                <Route path="/battle" element={<Battle/>}/>
                <Route path="/battle/:battleId" element={<BattleView/>}/>
                <Route path="/join-battle" element={<JoinBattle/>}/>
            </Routes>
        </Router>
    );
}

export default App;