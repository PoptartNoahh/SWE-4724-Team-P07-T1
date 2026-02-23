import { BrowserRouter, Routes, Route, Link} from "react-router-dom";
import LoginPage from "./pages/loginPage";
import Dashboard from "./pages/dashboard";
function NavBar() {
    return (
        <BrowserRouter>
            <nav>
                <Link to="/">Dash</Link>
                <Link to="/login">Login</Link>
            </nav>

            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/login" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default NavBar;