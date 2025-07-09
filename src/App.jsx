import {BrowserRouter as Router, Route, Routes, useNavigate} from 'react-router-dom';
import Register from './Register';
import UUIDUtils from '../common/utils/UUIDUtils';

function Home() {
    const navigate = useNavigate();

    const handleRegister = async () => {
        const uuidUtils = UUIDUtils.withPurpose("register");
        const newUUID = await uuidUtils.fetchUUID();
        navigate(`/register?id=${newUUID}`);
    };

    return (
        <button onClick={handleRegister}>
            Go to Register
        </button>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/register" element={<Register/>}/>
            </Routes>
        </Router>
    );
}

export default App;