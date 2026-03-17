import { BrowserRouter, Routes, Route, Link} from "react-router-dom";
import LoginPage from "./pages/loginPage";
import Dashboard from "./pages/dashboard";
import Project from "./pages/Project";
import Report from "./pages/Report";
import Login from "./pages/loginPage";
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
                <Route path="/projects/:projectId" element={<Project />} />
                <Route path="/reports/:reportId" element={<Report />} />
            </Routes>
        </BrowserRouter>
    )
}

export default NavBar;