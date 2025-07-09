import React, {useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';
import UUIDUtils from '../../../common/utils/UUIDUtils';
import RegisterForm from './RegisterForm';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

function Register() {
    const query = useQuery();
    const uuid = query.get('id');
    const [isValid, setIsValid] = useState(null);

    useEffect(() => {
        if (!uuid) {
            setIsValid(false);
            return;
        }
        const uuidUtils = UUIDUtils.withPurpose('register');
        uuidUtils.validateUUID(uuid)
            .then(setIsValid)
            .catch(() => setIsValid(false));
    }, [uuid]);

    if (!uuid) return <Message text="No UUID provided."/>;
    if (isValid === null) return <Message text="Validating..."/>;
    if (!isValid) return <Message text="Invalid or expired registration link."/>;

    return (
        <div>
            <h2>Register Page</h2>
            <p>Generated UUID: {uuid}</p>
            <RegisterForm/>
        </div>
    );
}

function Message({text}) {
    return <p>{text}</p>;
}

export default Register;