import { useNavigate } from "react-router-dom";
import { Button, Result } from 'antd';
import { useEffect } from "react";
import { useAppSelector } from "@/redux/hooks";

const NotFound = () => {
    const navigate = useNavigate();
    const isAuthenticated = useAppSelector(state => state.account.isAuthenticated);
    function checkAuth() {
        if (!isAuthenticated) {
            alert("Bạn chưa đăng nhập");
            return navigate('/login');
        } else {
            return navigate('/admin');
        }
    }
    return (
        <>
            <Result
                status="404"
                title="404"
                subTitle="Sorry, the page you visited does not exist."
                extra={<Button type="primary"
                    onClick={() => checkAuth()}
                >Back Home</Button>}
            />
        </>
    )
}

export default NotFound;