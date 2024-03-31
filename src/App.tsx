import "bootstrap/dist/css/bootstrap.min.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import "./colors.css";
import BudgetPage from "./components/Budget/BudgetPage";
import { BudgetProvider } from "./context/BudgetContext";
import { ConfigProvider } from "./context/ConfigContext";

export default function App() {
  return (
    <ConfigProvider>
      <BudgetProvider>
        <Router>
          <Routes>
            <Route path="/" element={<BudgetPage />} />
            <Route path="/:name" element={<BudgetPage />} />
          </Routes>
        </Router>
      </BudgetProvider>
    </ConfigProvider>
  );
}
//Simple App.jsx as any other react project will have.
//the confusion exists at line 6 and 7 just because of the different way importing files.
// else the rest is same.
