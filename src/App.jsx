import {BrowserRouter as Router, Route, Routes, useNavigate} from 'react-router-dom';
import Register from './account/register/Register';
import UUIDUtils from '../common/utils/UUIDUtils';
import Battle from "./account/battle/Battle.jsx";

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
    }

    return (
        <>
            <button onClick={handleRegister}>
                Go to Register
            </button>
            <button onClick={createBattle}>
                Create Battle
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
            </Routes>
        </Router>
    );
}

export default App;