import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

function HomePage() {
  // ... (state and useEffect remain the same) ...
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { authToken } = useContext(AuthContext);

  useEffect(() => {
    if (authToken) {
      setLoading(true); setError(null);
      Promise.all([
        axiosInstance.get('/api/v1/categories/'),
        axiosInstance.get('/api/v1/topics/')
      ])
      .then(([categoriesResponse, topicsResponse]) => {
        setCategories(categoriesResponse.data.results || categoriesResponse.data);
        setTopics(topicsResponse.data.results || topicsResponse.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching initial data:", error);
        setError("Veriler yüklenirken bir hata oluştu.");
        setLoading(false);
      });
    } else {
      setCategories([]); setTopics([]); setLoading(false); setError(null);
    }
  }, [authToken]);


  return (
    <div>
      <h1>Ana Sayfa</h1>
      <p>Foruma hoş geldiniz! {authToken ? '(Giriş Yapıldı)' : '(Giriş Yapılmadı)'}</p>

      {!authToken && <p>İçeriği görmek için lütfen <Link to="/login">giriş yapın</Link>.</p>}

      {authToken && (
        <>
          {loading && <p>Veriler yükleniyor...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!loading && !error && (
            <>
              {/* Category Section - unchanged styling for now */}
              <section>
                <h2>Kategoriler</h2>
                {categories.length > 0 ? ( <ul> {categories.map(category => ( <li key={category.id}>{category.name}</li> ))} </ul> ) : (<p>Hiç kategori bulunamadı.</p>)}
              </section>

              <hr />

              {/* Topic Section - ADDED id and className */}
              <section id="topic-section"> {/* Added ID for more specific CSS */}
                <h2>Konular</h2>
                {topics.length > 0 ? (
                  <ul>
                    {topics.map(topic => (
                      // ADDED className="topic-list-item"
                      <li key={topic.id} className="topic-list-item">
                        {/* Link now wraps the whole content implicitly? No, just title */}
                        <Link to={`/topics/${topic.id}`}>
                          <strong>{topic.title}</strong>
                        </Link>
                        <small>
                          Yazar: {topic.author || 'Bilinmiyor'} |
                          Kategori: {topic.category || 'Yok'} |
                          Etiketler: {topic.tags && topic.tags.length > 0 ? topic.tags.map(tag => <span key={tag} className="tag">{tag}</span>) : 'Yok'} | {/* Assume tags are now strings */}
                          Son Aktivite: {new Date(topic.last_activity_at).toLocaleString('tr-TR')}
                        </small>
                      </li>
                    ))}
                  </ul>
                ) : ( <p>Hiç konu bulunamadı.</p> )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default HomePage;