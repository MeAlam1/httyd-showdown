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
        const uuidUtils = UUIDUtils.withPurpose("register");
        uuidUtils.validateUUID(uuid)
            .then(valid => setIsValid(valid))
            .catch(() => setIsValid(false));
    }, [uuid]);

    if (!uuid) return <p>No UUID provided.</p>;
    if (isValid === null) return <p>Validating...</p>;
    if (!isValid) return <p>Invalid or expired registration link.</p>;

    return (
        <div>
            <h2>Register Page</h2>
            <p>Generated UUID: {uuid}</p>
            <RegisterForm/>
        </div>
    );
}

export default Register;