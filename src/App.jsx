import {BrowserRouter as Router, Route, Routes, useNavigate} from 'react-router-dom';
import Register from './account/register/Register';
import UUIDUtils from '../common/utils/UUIDUtils';
import Battle from "./account/battle/Battle.jsx";
import BattleView from "./account/battle/BattleView.jsx";
import JoinBattle from "./account/battle/JoinBattle.jsx";

function Home() {
    const navigate = useNavigate();

    const handleRegister = async () => {
        const uuidUtils = UUIDUtils.withPurpose('register');
        const newUUID = await uuidUtils.fetchUUID();
        navigate(`/register?id=${newUUID}`);
    };

    const createBattle = async () => {
        const uuidUtils = UUIDUtils.withPurpose('battle');
        const newUUID = await uuidUtils.fetchUUID();
        navigate(`/battle?id=${newUUID}`);
    };

    const joinBattle = () => {
        navigate('/join-battle');
    };

    return (
        <>
            <button onClick={handleRegister}>
                Go to Register
            </button>
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
                <Route path="/register" element={<Register/>}/>
                <Route path="/battle" element={<Battle/>}/>
                <Route path="/battle/:battleId" element={<BattleView/>}/>
                <Route path="/join-battle" element={<JoinBattle/>}/>
            </Routes>
        </Router>
    );
}

export default App;