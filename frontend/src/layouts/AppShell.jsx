import { NavLink, Outlet } from "react-router-dom";
import { MnsLogo } from "../components/MnsLogo";
import { useAuth } from "../context/AuthContext";

const navigation = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/products", label: "Products" },
  { to: "/categories", label: "Categories" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/customers", label: "Customers" },
  { to: "/transactions", label: "Transactions" },
  { to: "/stock", label: "Stock" }
];

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <MnsLogo />
          <p className="sidebar-copy">Track products, stock flow, suppliers, and customers from one workspace.</p>
        </div>
        <div className="sidebar-main">
          <nav className="sidebar-nav">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
          <button type="button" className="ghost-button sidebar-logout" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
