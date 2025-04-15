import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom'; // useSearchParams for query params
import AuthContext from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';

function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || ''; // Get 'q' parameter from URL

  const [results, setResults] = useState(null); // Store {topics:[], posts:[], ...}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authToken } = useContext(AuthContext);

  useEffect(() => {
    if (authToken && query) {
      setLoading(true);
      setError(null);
      setResults(null); // Clear previous results
      console.log(`Searching for: ${query}`);

      axiosInstance.get(`/api/v1/search/?q=${encodeURIComponent(query)}`)
        .then(response => {
          setResults(response.data);
          setLoading(false);
          console.log("Search results:", response.data);
        })
        .catch(err => {
          console.error("Search failed:", err);
          setError("Arama sırasında bir hata oluştu.");
          setLoading(false);
        });
    } else if (!authToken) {
        setError("Arama yapmak için giriş yapmalısınız.");
        setLoading(false);
    } else {
        // No query term
        setLoading(false);
        setError(null);
        setResults(null); // Ensure no old results shown if query removed
    }

  }, [query, authToken]); // Re-run if query or token changes

  return (
    <div>
      <h1>Arama Sonuçları</h1>
      {query ? (
        <p>"{query}" için sonuçlar:</p>
      ) : (
        <p>Lütfen arama yapmak için yukarıdaki kutucuğu kullanın.</p>
      )}

      {loading && <p>Aranıyor...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {results && !loading && !error && (
        <>
          {/* Topic Results */}
          <section style={{ marginTop: '20px' }}>
            <h2>Bulunan Konular ({results.topics?.length || 0})</h2>
            {results.topics && results.topics.length > 0 ? (
              <ul>
                {results.topics.map(topic => (
                  <li key={`topic-${topic.id}`}>
                    <Link to={`/topics/${topic.id}`}>{topic.title}</Link>
                    <small> (Yazar: {topic.author__username || 'Bilinmiyor'})</small>
                  </li>
                ))}
              </ul>
            ) : ( <p>Eşleşen konu bulunamadı.</p> )}
          </section>

          {/* Post Results */}
          <section style={{ marginTop: '20px' }}>
            <h2>Bulunan Mesajlar ({results.posts?.length || 0})</h2>
            {results.posts && results.posts.length > 0 ? (
              <ul>
                {results.posts.map(post => (
                  // Link to the topic detail page, maybe highlight the post later?
                  <li key={`post-${post.id}`}>
                     "{post.content.substring(0, 100)}..."
                     <small>
                       (Konu: <Link to={`/topics/${post.topic_id}`}>#{post.topic_id}</Link> |
                       Yazar: {post.author__username || 'Bilinmiyor'})
                     </small>
                  </li>
                ))}
              </ul>
            ) : ( <p>Eşleşen mesaj bulunamadı.</p> )}
          </section>

          {/* User Results */}
          <section style={{ marginTop: '20px' }}>
            <h2>Bulunan Kullanıcılar ({results.users?.length || 0})</h2>
            {results.users && results.users.length > 0 ? (
              <ul>
                {results.users.map(user => (
                  // TODO: Add link to user profile page if implemented later
                  <li key={`user-${user.id}`}>
                    {user.first_name} {user.last_name} ({user.username})
                  </li>
                ))}
              </ul>
            ) : ( <p>Eşleşen kullanıcı bulunamadı.</p> )}
          </section>

          {/* Attachment Results */}
          <section style={{ marginTop: '20px' }}>
            <h2>Bulunan Dosyalar ({results.attachments?.length || 0})</h2>
            {results.attachments && results.attachments.length > 0 ? (
              <ul>
                {results.attachments.map(att => (
                   // TODO: Add link to download or view attachment detail if implemented
                  <li key={`att-${att.id}`}>
                    {att.original_filename}
                    <small> (Yükleyen: {att.uploader__username || 'Bilinmiyor'})</small>
                  </li>
                ))}
              </ul>
            ) : ( <p>Eşleşen dosya bulunamadı.</p> )}
          </section>
        </>
      )}
    </div>
  );
}

export default SearchResultsPage;