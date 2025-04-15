import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import React, { useState, useContext } from 'react';
import AuthContext from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import TopicDetailPage from './pages/TopicDetailPage';
import RegisterPage from './pages/RegisterPage';
import CreateTopicPage from './pages/CreateTopicPage';
import SearchResultsPage from './pages/SearchResultsPage';
import './App.css'; // Import the CSS file

function App() {
  const { authToken, user, logout } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      navigate(`/search-results?q=${encodeURIComponent(trimmedQuery)}`);
      setSearchQuery('');
    }
  };

  // Wrap everything in a div with className="app-container"
  return (
    <div className="app-container">
      <nav> {/* nav styles will be applied via App.css */}
        {/* Left side links */}
        <ul >
          <li><Link to="/">Ana Sayfa</Link></li>
          {authToken && ( <li><Link to="/new-topic">Yeni Konu Aç</Link></li> )}
        </ul>

        {/* Center/Right side - Search Form & Auth Links/Info */}
        <div>
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit}>
            <input type="search" placeholder="Ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} aria-label="Arama yap"/>
            <button type="submit">Ara</button>
          </form>

          {/* Auth Links/Info */}
          <ul>
            {authToken ? (
              <>
                <li><span>Hoşgeldin, {user ? user.username : 'Kullanıcı'}!</span></li>
                <li><button onClick={logout}>Çıkış Yap</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login">Giriş Yap</Link></li>
                <li><Link to="/register">Kayıt Ol</Link></li>
              </>
            )}
          </ul>
        </div>
      </nav>
      {/* Removed the <hr /> as margin is handled by CSS */}

      {/* Main Content Area */}
      <main> {/* main styles will be applied via App.css */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/topics/:topicId" element={<TopicDetailPage />} />
          <Route path="/new-topic" element={<CreateTopicPage />} />
          <Route path="/search-results" element={<SearchResultsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;